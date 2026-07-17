import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const anio = parseInt(req.nextUrl.searchParams.get("anio") || String(new Date().getFullYear()));
  const barrioId = req.nextUrl.searchParams.get("barrioId");

  const pegues = await prisma.pegue.findMany({
    where: barrioId ? { barrioId } : {},
    include: {
      abonado: true,
      barrio: true,
      pagos: { where: { anioPagado: anio }, select: { mesPagado: true } },
    },
    orderBy: [{ barrio: { nombre: "asc" } }, { codigo: "asc" }],
  });

  const filas = pegues.map((p) => ({
    codigo: p.codigo,
    nombre: p.abonado.nombre,
    barrio: p.barrio.nombre,
    estado: p.estado,
    meses: Array.from({ length: 12 }, (_, i) => p.pagos.some((pg) => pg.mesPagado === i + 1)),
  }));

  return NextResponse.json({ filas });
}
