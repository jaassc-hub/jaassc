import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mesesDeMora, calcularMontoMora } from "@/lib/mora";
import { MORA_DEFAULT } from "@/lib/moraConfig";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const pago = await prisma.pago.findUnique({ where: { id: params.id } });
  if (!pago) return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 });

  if (!pago.loteId) {
    return NextResponse.json(
      { error: "Este recibo tiene un solo mes. Para quitarlo, elimine el recibo completo." },
      { status: 400 }
    );
  }

  const hermanos = await prisma.pago.findMany({ where: { loteId: pago.loteId } });
  if (hermanos.length <= 1) {
    return NextResponse.json(
      { error: "Es el único mes de este recibo. Elimine el recibo completo en vez de quitar el mes." },
      { status: 400 }
    );
  }

  // Se guardan los montos extra (mora/reconexion/descuento) antes de borrar, para
  // no perderlos si el mes que se quita era el que los tenia asignados.
  const totalReconexion = hermanos.reduce((s, p) => s + p.montoReconexion, 0);
  const totalDescuento = hermanos.reduce((s, p) => s + p.montoDescuento, 0);
  const motivoDescuento = hermanos.find((p) => p.motivoDescuento)?.motivoDescuento || null;

  const moraConfigRow = await prisma.configuracion.findUnique({ where: { clave: "mora" } });
  const tramos = moraConfigRow ? JSON.parse(moraConfigRow.valor).tramos : MORA_DEFAULT.tramos;

  await prisma.$transaction(async (tx) => {
    await tx.pago.delete({ where: { id: params.id } });

    const restantes = hermanos
      .filter((p) => p.id !== params.id)
      .sort((a, b) => a.anioPagado * 12 + a.mesPagado - (b.anioPagado * 12 + b.mesPagado));

    const primero = restantes[0];
    const montoServicios = primero.montoServicios;
    const mesesMoraBase = mesesDeMora(primero.mesPagado, primero.anioPagado, primero.fechaPago);
    const vencidos = Math.min(restantes.length, mesesMoraBase);
    const montoMoraTotal = calcularMontoMora(montoServicios * vencidos, mesesMoraBase, tramos);

    for (let i = 0; i < restantes.length; i++) {
      const fila = restantes[i];
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

  return NextResponse.json({ ok: true });
}
