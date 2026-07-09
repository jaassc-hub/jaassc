import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const servicios = await prisma.servicio.findMany({
    orderBy: { nombre: "asc" },
  });
  return NextResponse.json(servicios);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.nombre || body.precio === undefined) {
    return NextResponse.json(
      { error: "Nombre y precio son requeridos" },
      { status: 400 }
    );
  }
  const servicio = await prisma.servicio.create({
    data: { nombre: body.nombre, precio: parseFloat(body.precio) },
  });
  return NextResponse.json(servicio);
}
