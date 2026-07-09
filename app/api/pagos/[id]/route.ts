import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Devuelve el pago junto con todos los demas pagos del mismo recibo (lote), si aplica.
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const pago = await prisma.pago.findUnique({
    where: { id: params.id },
    include: { pegue: { include: { abonado: true, barrio: true } } },
  });
  if (!pago) return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 });

  const hermanos = pago.loteId
    ? await prisma.pago.findMany({
        where: { loteId: pago.loteId },
        orderBy: [{ anioPagado: "asc" }, { mesPagado: "asc" }],
      })
    : [pago];

  return NextResponse.json({ pago, recibo: hermanos });
}

// Solo se permite corregir datos administrativos (metodo, referencia, observaciones,
// fecha real de pago). Se aplica a TODOS los meses del recibo a la vez, ya que
// representan un mismo cobro. Mes/anio/montos no se editan aqui porque afectan el
// calculo de mora; para eso se usa agregar/quitar mes o eliminar el recibo completo.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const data: any = {};
  if (body.metodoPago !== undefined) data.metodoPago = body.metodoPago;
  if (body.referencia !== undefined) data.referencia = body.referencia;
  if (body.observaciones !== undefined) data.observaciones = body.observaciones;
  if (body.fechaPago !== undefined) data.fechaPago = new Date(body.fechaPago);

  const pago = await prisma.pago.findUnique({ where: { id: params.id } });
  if (!pago) return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 });

  if (pago.loteId) {
    await prisma.pago.updateMany({ where: { loteId: pago.loteId }, data });
  } else {
    await prisma.pago.update({ where: { id: params.id }, data });
  }
  return NextResponse.json({ ok: true });
}

// Elimina el RECIBO COMPLETO: si el pago pertenece a un lote de varios meses, se
// eliminan todos los meses de ese recibo (no uno por uno). Los meses vuelven a
// quedar pendientes para el pegue.
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const pago = await prisma.pago.findUnique({ where: { id: params.id } });
  if (!pago) return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 });

  if (pago.loteId) {
    await prisma.pago.deleteMany({ where: { loteId: pago.loteId } });
  } else {
    await prisma.pago.delete({ where: { id: params.id } });
  }
  return NextResponse.json({ ok: true });
}
