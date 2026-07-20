import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const codigo = req.nextUrl.searchParams.get("codigo");
  if (!codigo) {
    return NextResponse.json({ error: "Código requerido" }, { status: 400 });
  }

  const pegue = await prisma.pegue.findFirst({
    where: { codigo: { equals: codigo, mode: "insensitive" } },
    include: { abonado: true, barrio: true },
  });

  if (!pegue) {
    return NextResponse.json({ error: "No se encontró ese código de pegue" }, { status: 404 });
  }

  return NextResponse.json({
    nombre: pegue.abonado.nombre,
    barrio: pegue.barrio.nombre,
    codigo: pegue.codigo,
  });
}
