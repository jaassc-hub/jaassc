import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mesesDeMora, calcularMontoMora, siguienteMesPendiente } from "@/lib/mora";
import { MORA_DEFAULT } from "@/lib/moraConfig";
import { randomUUID } from "crypto";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const pago = await prisma.pago.findUnique({ where: { id: params.id } });
  if (!pago) return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 });

  const hermanos = pago.loteId
    ? await prisma.pago.findMany({ where: { loteId: pago.loteId } })
    : [pago];
  const ordenados = [...hermanos].sort((a, b) => a.anioPagado * 12 + a.mesPagado - (b.anioPagado * 12 + b.mesPagado));
  const ultimo = ordenados[ordenados.length - 1];

  // El mes a agregar debe ser exactamente el siguiente mes pendiente real del pegue,
  // para no dejar huecos ni pagar el mismo mes en dos recibos distintos.
  const todosLosPagosDelPegue = await prisma.pago.findMany({
    where: { pegueId: pago.pegueId },
    orderBy: [{ anioPagado: "desc" }, { mesPagado: "desc" }],
    take: 1,
  });
  const pegue = await prisma.pegue.findUnique({ where: { id: pago.pegueId } });
  const pendienteGlobal = siguienteMesPendiente(todosLosPagosDelPegue[0] || null, pegue!.createdAt);

  const siguienteDeEsteRecibo = { mes: ultimo.mesPagado + 1 > 12 ? 1 : ultimo.mesPagado + 1, anio: ultimo.mesPagado + 1 > 12 ? ultimo.anioPagado + 1 : ultimo.anioPagado };
  if (pendienteGlobal.mes !== siguienteDeEsteRecibo.mes || pendienteGlobal.anio !== siguienteDeEsteRecibo.anio) {
    return NextResponse.json(
      { error: "El siguiente mes pendiente de este pegue no es consecutivo a este recibo. Regístrelo como un cobro aparte." },
      { status: 400 }
    );
  }

  const totalReconexion = ordenados.reduce((s, p) => s + p.montoReconexion, 0);
  const totalDescuento = ordenados.reduce((s, p) => s + p.montoDescuento, 0);
  const motivoDescuento = ordenados.find((p) => p.motivoDescuento)?.motivoDescuento || null;

  const moraConfigRow = await prisma.configuracion.findUnique({ where: { clave: "mora" } });
  const tramos = moraConfigRow ? JSON.parse(moraConfigRow.valor).tramos : MORA_DEFAULT.tramos;

  const loteId = pago.loteId || randomUUID();

  await prisma.$transaction(async (tx) => {
    // si el recibo era de un solo mes, hay que asignarle un loteId ahora
    if (!pago.loteId) {
      await tx.pago.update({ where: { id: pago.id }, data: { loteId } });
    }

    const nuevo = await tx.pago.create({
      data: {
        pegueId: pago.pegueId,
        mesPagado: siguienteDeEsteRecibo.mes,
        anioPagado: siguienteDeEsteRecibo.anio,
        montoServicios: ultimo.montoServicios,
        montoMora: 0,
        montoReconexion: 0,
        montoDescuento: 0,
        mesesMora: mesesDeMora(siguienteDeEsteRecibo.mes, siguienteDeEsteRecibo.anio, ultimo.fechaPago),
        total: ultimo.montoServicios,
        metodoPago: ultimo.metodoPago,
        referencia: ultimo.referencia,
        observaciones: ultimo.observaciones,
        loteId,
        numeroRecibo: ultimo.numeroRecibo,
        emitidoPor: ultimo.emitidoPor,
        fechaPago: ultimo.fechaPago,
      },
    });

    const todos = [...ordenados, nuevo];
    const primero = todos[0];
    const montoServicios = primero.montoServicios;
    const mesesMoraBase = mesesDeMora(primero.mesPagado, primero.anioPagado, primero.fechaPago);
    const vencidos = Math.min(todos.length, mesesMoraBase);
    const montoMoraTotal = calcularMontoMora(montoServicios * vencidos, mesesMoraBase, tramos);

    for (let i = 0; i < todos.length; i++) {
      const fila = todos[i];
      const esPrimero = i === 0;
      const mesesMoraFila = mesesDeMora(fila.mesPagado, fila.anioPagado, fila.fechaPago);
      const montoMora = esPrimero ? montoMoraTotal : 0;
      const montoReconexion = esPrimero ? totalReconexion : 0;
      const montoDescuento = esPrimero ? totalDescuento : 0;
      await tx.pago.update({
        where: { id: fila.id },
        data: {
          mesesMora: mesesMoraFila,
          montoMora,
          montoReconexion,
          montoDescuento,
          motivoDescuento: esPrimero ? motivoDescuento : null,
          total: montoServicios + montoMora + montoReconexion - montoDescuento,
        },
      });
    }
  });

  return NextResponse.json({ ok: true, loteId });
}
