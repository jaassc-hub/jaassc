import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mesesDeMora, calcularMontoMora, mesesConsecutivos, siguienteMesPendiente, nombreMes } from "@/lib/mora";
import { obtenerUsuarioActual } from "@/lib/auth";
import { asegurarPin } from "@/lib/pin";
import { MORA_DEFAULT } from "@/lib/moraConfig";
import { obtenerConfigAvisos, enviarAviso, llenarPlantilla } from "@/lib/avisos";
import { generarCorrelativo } from "@/lib/correlativo";
import { randomUUID } from "crypto";

export async function GET(req: NextRequest) {
  const mes = req.nextUrl.searchParams.get("mes");
  const anio = req.nextUrl.searchParams.get("anio");
  const pegueId = req.nextUrl.searchParams.get("pegueId");

  const pagos = await prisma.pago.findMany({
    where: {
      ...(pegueId ? { pegueId } : {}),
      ...(anio
        ? {
            fechaPago: {
              gte: new Date(
                parseInt(anio),
                mes ? parseInt(mes) - 1 : 0,
                1
              ),
              lt: mes
                ? new Date(parseInt(anio), parseInt(mes), 1)
                : new Date(parseInt(anio) + 1, 0, 1),
            },
          }
        : {}),
    },
    include: {
      pegue: { include: { abonado: true, barrio: true } },
    },
    orderBy: { fechaPago: "desc" },
    take: 300,
  });

  return NextResponse.json(pagos);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    pegueId,
    mesPagado,
    anioPagado,
    cantidadMeses,
    metodoPago,
    referencia,
    observaciones,
    incluyeReconexion,
    montoReconexion,
    montoDescuento,
    motivoDescuento,
    fechaPago,
  } = body;

  if (!pegueId || !mesPagado || !anioPagado) {
    return NextResponse.json(
      { error: "Pegue, mes y año son requeridos" },
      { status: 400 }
    );
  }

  const pegue = await prisma.pegue.findUnique({
    where: { id: pegueId },
    include: {
      servicios: { include: { servicio: true } },
      pagos: { orderBy: [{ anioPagado: "desc" }, { mesPagado: "desc" }], take: 1 },
      abonado: true,
      barrio: true,
    },
  });

  if (!pegue) {
    return NextResponse.json({ error: "Pegue no encontrado" }, { status: 404 });
  }

  if (pegue.estado === "INACTIVO") {
    return NextResponse.json(
      { error: "Este pegue está inhabilitado. Debe reactivarlo (con motivo) antes de poder cobrarle." },
      { status: 400 }
    );
  }

  await asegurarPin(pegue.abonadoId);

  // --- Validacion: no se puede pagar un mes distinto al siguiente pendiente ---
  const tieneAlgunPago = pegue.pagos.length > 0;
  if (tieneAlgunPago) {
    const pendiente = siguienteMesPendiente(pegue.pagos[0], pegue.createdAt);
    if (parseInt(mesPagado) !== pendiente.mes || parseInt(anioPagado) !== pendiente.anio) {
      return NextResponse.json(
        {
          error: `Ese pegue debe pagar primero ${nombreMes(pendiente.mes)} ${pendiente.anio}. No se pueden saltar ni repetir meses.`,
          mesEsperado: pendiente,
        },
        { status: 400 }
      );
    }
  }

  const cantidad = Math.max(1, Math.min(24, parseInt(cantidadMeses) || 1));
  const meses = mesesConsecutivos(parseInt(mesPagado), parseInt(anioPagado), cantidad);

  const fecha = fechaPago ? new Date(fechaPago) : new Date();
  const montoServicios = pegue.tipoConexion === "BIEN_COMUN"
    ? 0
    : pegue.servicios.filter((ps) => ps.habilitado).reduce((sum, ps) => sum + ps.servicio.precio, 0);

  // La mora se calcula UNA sola vez sobre el total adeudado, segun cuantos meses de
  // atraso tiene el mes mas antiguo de este cobro (no mes por mes).
  const moraConfigRow = await prisma.configuracion.findUnique({ where: { clave: "mora" } });
  const tramosMora = moraConfigRow ? JSON.parse(moraConfigRow.valor).tramos : MORA_DEFAULT.tramos;
  const mesesMoraBase = mesesDeMora(meses[0].mes, meses[0].anio, fecha);
  const mesesVencidosEnEsteCobro = Math.min(cantidad, mesesMoraBase);
  const montoAdeudado = montoServicios * mesesVencidosEnEsteCobro;
  const montoMoraTotal = calcularMontoMora(montoAdeudado, mesesMoraBase, tramosMora);

  const loteId = cantidad > 1 ? randomUUID() : null;
  const montoRecon = incluyeReconexion ? parseFloat(montoReconexion || "0") : 0;
  const montoDesc = parseFloat(montoDescuento || "0") || 0;
  const usuarioActual = await obtenerUsuarioActual();
  const emitidoPor = usuarioActual ? usuarioActual.nombre || usuarioActual.username : null;

  try {
    const pagosCreados = await prisma.$transaction(async (tx) => {
      // Correlativo de recibo tipo PAGO, independiente de conexiones/constancias/actas.
      const numeroRecibo = await generarCorrelativo(tx, "PAGO");

      const creados = [];
      for (let i = 0; i < meses.length; i++) {
        const { mes, anio } = meses[i];
        const mesesMoraDeEsteMes = mesesDeMora(mes, anio, fecha);
        // La mora, reconexion y descuento se cobran una sola vez, en el primer mes del lote
        const esPrimero = i === 0;
        const total =
          montoServicios +
          (esPrimero ? montoMoraTotal : 0) +
          (esPrimero ? montoRecon : 0) -
          (esPrimero ? montoDesc : 0);

        const pago = await tx.pago.create({
          data: {
            pegueId,
            mesPagado: mes,
            anioPagado: anio,
            montoServicios,
            montoMora: esPrimero ? montoMoraTotal : 0,
            montoReconexion: esPrimero ? montoRecon : 0,
            montoDescuento: esPrimero ? montoDesc : 0,
            motivoDescuento: esPrimero ? motivoDescuento || null : null,
            mesesMora: mesesMoraDeEsteMes,
            total,
            metodoPago: metodoPago || "EFECTIVO",
            referencia: referencia || null,
            observaciones: observaciones || null,
            loteId,
            numeroRecibo,
            emitidoPor,
            fechaPago: fecha,
          },
        });
        creados.push(pago);
      }
      return creados;
    });

    // Si se pagó reconexión y el pegue estaba cortado, se reactiva y se registra el evento
    if (incluyeReconexion && pegue.estado === "CORTADO") {
      await prisma.pegue.update({ where: { id: pegueId }, data: { estado: "ACTIVO" } });
      await prisma.eventoPegue.create({
        data: { pegueId, tipo: "RECONEXION", nota: "Reconexión pagada, servicio reactivado" },
      });
    }

    const totalGeneral = pagosCreados.reduce((s, p) => s + p.total, 0);
    const mesesMoraMax = Math.max(...pagosCreados.map((p) => p.mesesMora));

    // Notificacion de pago (SMS o WhatsApp, segun este configurado). Nunca debe
    // interrumpir la respuesta del cobro, aunque falle el envio.
    try {
      const configAvisos = await obtenerConfigAvisos();
      if (configAvisos.activo && pegue.abonado.telefono) {
        const mensaje = llenarPlantilla(configAvisos.plantilla, {
          nombre: pegue.abonado.nombre,
          codigo: pegue.codigo,
          barrio: pegue.barrio.nombre,
          meses: meses.map((m) => `${nombreMes(m.mes)} ${m.anio}`).join(", "),
          total: totalGeneral.toFixed(2),
          numeroRecibo: pagosCreados[0].numeroRecibo || "",
          fecha: fecha.toLocaleDateString("es-HN"),
          junta: process.env.NEXT_PUBLIC_JUNTA_NOMBRE || "Junta de Agua",
        });
        await enviarAviso(pegue.abonado.telefono, mensaje, pagosCreados[0].id);
      }
    } catch {
      // silenciosamente ignorado: el pago ya quedo registrado de todas formas
    }

    return NextResponse.json({
      pago: pagosCreados[0],
      pagos: pagosCreados,
      loteId,
      totalGeneral,
      sujetoACorte: mesesMoraMax > 3,
    });
  } catch (e: any) {
    if (e.code === "P2002") {
      return NextResponse.json(
        { error: "Uno de esos meses ya estaba pagado para este pegue" },
        { status: 400 }
      );
    }
    throw e;
  }
}
