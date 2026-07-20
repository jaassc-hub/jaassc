import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerUsuarioActual } from "@/lib/auth";
import { generarCorrelativo } from "@/lib/correlativo";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const { costoConexion, formaPagoConexion, cantidadCuotas, metodoPagoContado, referenciaContado } = body;

  const costo = parseFloat(costoConexion || "0") || 0;
  if (costo <= 0) {
    return NextResponse.json({ error: "El costo debe ser mayor a cero" }, { status: 400 });
  }

  const existentes = await prisma.cuotaPegue.count({ where: { pegueId: params.id } });
  if (existentes > 0) {
    return NextResponse.json(
      { error: "Este pegue ya tiene un derecho de conexión registrado" },
      { status: 400 }
    );
  }

  const usuarioActual = await obtenerUsuarioActual();
  const emitidoPor = usuarioActual ? usuarioActual.nombre || usuarioActual.username : null;

  try {
    await prisma.$transaction(async (tx) => {
      if (formaPagoConexion === "CONTADO") {
        const numeroRecibo = await generarCorrelativo(tx, "CONEXION");
        await tx.cuotaPegue.create({
          data: {
            pegueId: params.id,
            numero: 1,
            totalCuotas: 1,
            monto: costo,
            pagada: true,
            fechaPago: new Date(),
            metodoPago: metodoPagoContado || "EFECTIVO",
            referencia: referenciaContado || null,
            numeroRecibo,
            emitidoPor,
          },
        });
      } else {
        const n = Math.max(2, Math.min(24, parseInt(cantidadCuotas) || 2));
        const montoBase = Math.floor((costo / n) * 100) / 100;
        const ultimaCuota = Math.round((costo - montoBase * (n - 1)) * 100) / 100;
        for (let i = 1; i <= n; i++) {
          await tx.cuotaPegue.create({
            data: {
              pegueId: params.id,
              numero: i,
              totalCuotas: n,
              monto: i === n ? ultimaCuota : montoBase,
              pagada: false,
            },
          });
        }
      }
    });

    const pegueActualizado = await prisma.pegue.findUnique({
      where: { id: params.id },
      include: { cuotas: { orderBy: { numero: "asc" } } },
    });

    return NextResponse.json(pegueActualizado);
  } catch (e) {
    return NextResponse.json({ error: "Error al registrar el derecho de conexión" }, { status: 500 });
  }
}
