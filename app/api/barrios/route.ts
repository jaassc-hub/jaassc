import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const barrios = await prisma.barrio.findMany({
    orderBy: { nombre: "asc" },
    include: { _count: { select: { pegues: true } } },
  });
  return NextResponse.json(barrios);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.nombre || !body.prefijo) {
    return NextResponse.json(
      { error: "Nombre y prefijo son requeridos" },
      { status: 400 }
    );
  }
  const barrio = await prisma.barrio.create({
    data: {
      nombre: body.nombre,
      prefijo: body.prefijo.toUpperCase(),
    },
  });
  return NextResponse.json(barrio);
}
