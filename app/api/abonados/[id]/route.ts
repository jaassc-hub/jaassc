import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generarPin } from "@/lib/pin";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const abonado = await prisma.abonado.findUnique({
    where: { id: params.id },
    include: {
      pegues: {
        include: {
          barrio: true,
          servicios: { include: { servicio: true } },
          pagos: { orderBy: [{ anioPagado: "desc" }, { mesPagado: "desc" }] },
        },
      },
    },
  });
  if (!abonado) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }
  return NextResponse.json(abonado);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const data: any = {};
  if (body.nombre !== undefined) data.nombre = body.nombre;
  if (body.identidad !== undefined) data.identidad = body.identidad.trim() ? body.identidad.trim() : null;
  if (body.telefono !== undefined) data.telefono = body.telefono;
  if (body.direccion !== undefined) data.direccion = body.direccion;
  if (body.activo !== undefined) data.activo = body.activo;
  if (body.regenerarPin) data.pin = generarPin();

  try {
    const abonado = await prisma.abonado.update({
      where: { id: params.id },
      data,
    });
    return NextResponse.json(abonado);
  } catch (e: any) {
    if (e.code === "P2002") {
      return NextResponse.json(
        { error: "Ya existe otro abonado con esa identidad" },
        { status: 400 }
      );
    }
    throw e;
  }
}
