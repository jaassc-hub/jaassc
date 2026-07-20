import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { asegurarPin } from "@/lib/pin";
import { obtenerUsuarioActual } from "@/lib/auth";
import { generarCorrelativo } from "@/lib/correlativo";

export async function GET(req: NextRequest) {
  const codigo = req.nextUrl.searchParams.get("codigo");
  if (!codigo) {
    return NextResponse.json({ error: "Código requerido" }, { status: 400 });
  }
  const pegue = await prisma.pegue.findFirst({
    where: { codigo: { equals: codigo, mode: "insensitive" } },
    include: {
      abonado: {
        include: {
          pegues: {
            include: {
              barrio: true,
              pagos: { orderBy: [{ anioPagado: "desc" }, { mesPagado: "desc" }], take: 1 },
            },
          },
        },
      },
      barrio: true,
      servicios: { include: { servicio: true } },
      pagos: { orderBy: [{ anioPagado: "desc" }, { mesPagado: "desc" }], take: 1 },
      eventos: { orderBy: { fecha: "desc" }, take: 5 },
      cuotas: { orderBy: { numero: "asc" } },
    },
  });
  if (!pegue) {
    return NextResponse.json({ error: "No se encontró ese código de pegue" }, { status: 404 });
  }
  const pin = await asegurarPin(pegue.abonadoId);
  (pegue.abonado as any).pin = pin;
  return NextResponse.json(pegue);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    abonadoId,
    barrioId,
    servicioIds,
    codigoManual,
    costoConexion,
    formaPagoConexion, // "CONTADO" | "CUOTAS" | "SIN_COBRO"
    cantidadCuotas,
    metodoPagoContado,
    referenciaContado,
  } = body;

  if (!abonadoId || !barrioId) {
    return NextResponse.json(
      { error: "Abonado y barrio son requeridos" },
      { status: 400 }
    );
  }

  const usuarioActual = await obtenerUsuarioActual();
  const emitidoPor = usuarioActual ? usuarioActual.nombre || usuarioActual.username : null;
  const costo = parseFloat(costoConexion || "0") || 0;

  try {
    const pegue = await prisma.$transaction(async (tx) => {
      let codigo = codigoManual;

      if (!codigo) {
        // Se incrementa el correlativo del barrio de forma atomica
        const barrio = await tx.barrio.update({
          where: { id: barrioId },
          data: { ultimoNum: { increment: 1 } },
        });
        const numero = String(barrio.ultimoNum).padStart(3, "0");
        codigo = `${barrio.prefijo}${numero}`;
      }

      const nuevoPegue = await tx.pegue.create({
        data: {
          codigo,
          abonadoId,
          barrioId,
          servicios: {
            create: (servicioIds || []).map((servicioId: string) => ({
              servicioId,
              habilitado: true,
            })),
          },
        },
        include: { servicios: { include: { servicio: true } }, barrio: true },
      });

      // Derecho de conexion: de contado (queda registrado ya pagado), en cuotas
      // (queda pendiente por cobrar), o sin cobro (no se crea nada).
      if (costo > 0 && formaPagoConexion === "CONTADO") {
        const numeroReciboConexion = await generarCorrelativo(tx, "CONEXION");

        await tx.cuotaPegue.create({
          data: {
            pegueId: nuevoPegue.id,
            numero: 1,
            totalCuotas: 1,
            monto: costo,
            pagada: true,
            fechaPago: new Date(),
            metodoPago: metodoPagoContado || "EFECTIVO",
            referencia: referenciaContado || null,
            numeroRecibo: numeroReciboConexion,
            emitidoPor,
          },
        });
      } else if (costo > 0 && formaPagoConexion === "CUOTAS") {
        const n = Math.max(2, Math.min(24, parseInt(cantidadCuotas) || 2));
        const montoBase = Math.floor((costo / n) * 100) / 100;
        const ultimaCuota = Math.round((costo - montoBase * (n - 1)) * 100) / 100;
        for (let i = 1; i <= n; i++) {
          await tx.cuotaPegue.create({
            data: {
              pegueId: nuevoPegue.id,
              numero: i,
              totalCuotas: n,
              monto: i === n ? ultimaCuota : montoBase,
              pagada: false,
            },
          });
        }
      }

      return nuevoPegue;
    });

    return NextResponse.json(pegue);
  } catch (e: any) {
    if (e.code === "P2002") {
      return NextResponse.json(
        { error: "Ese código de pegue ya existe, elija otro" },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Error al crear el pegue" }, { status: 500 });
  }
}
