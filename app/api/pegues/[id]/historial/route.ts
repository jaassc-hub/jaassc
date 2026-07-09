import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const pegue = await prisma.pegue.findUnique({
    where: { id: params.id },
    include: {
      abonado: true,
      barrio: true,
      pagos: { orderBy: [{ anioPagado: "desc" }, { mesPagado: "desc" }] },
      eventos: { orderBy: { fecha: "desc" } },
    },
  });

  if (!pegue) {
    return NextResponse.json({ error: "Pegue no encontrado" }, { status: 404 });
  }

  // Se combinan pagos y eventos en una sola linea de tiempo ordenada por fecha
  const linea = [
    ...pegue.pagos.map((p) => ({
      tipo: "PAGO" as const,
      fecha: p.fechaPago,
      detalle: p,
    })),
    ...pegue.eventos.map((e) => ({
      tipo: "EVENTO" as const,
      fecha: e.fecha,
      detalle: e,
    })),
  ].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  return NextResponse.json({ pegue, linea });
}
