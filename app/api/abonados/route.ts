import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generarPin } from "@/lib/pin";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") || "";

  const abonados = await prisma.abonado.findMany({
    where: q
      ? {
          OR: [
            { nombre: { contains: q, mode: "insensitive" } },
            { identidad: { contains: q, mode: "insensitive" } },
            { pegues: { some: { codigo: { contains: q, mode: "insensitive" } } } },
          ],
        }
      : undefined,
    include: {
      pegues: { include: { barrio: true, servicios: { include: { servicio: true } } } },
    },
    orderBy: { nombre: "asc" },
    take: 100,
  });

  return NextResponse.json(abonados);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.nombre) {
    return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 });
  }

  try {
    const abonado = await prisma.abonado.create({
      data: {
        nombre: body.nombre,
        identidad: body.identidad ? body.identidad.trim() : null,
        telefono: body.telefono || null,
        direccion: body.direccion || null,
        pin: generarPin(),
      },
    });
    return NextResponse.json(abonado);
  } catch (e: any) {
    if (e.code === "P2002") {
      return NextResponse.json(
        { error: "Ya existe un abonado con esa identidad" },
        { status: 400 }
      );
    }
    throw e;
  }
}
