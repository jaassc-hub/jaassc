import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const data: any = {};
  if (body.nombre !== undefined) data.nombre = body.nombre;
  if (body.precio !== undefined) data.precio = parseFloat(body.precio);
  if (body.activo !== undefined) data.activo = body.activo;

  const servicio = await prisma.servicio.update({
    where: { id: params.id },
    data,
  });
  return NextResponse.json(servicio);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  // No se elimina fisicamente (hay historial ligado), se desactiva.
  const servicio = await prisma.servicio.update({
    where: { id: params.id },
    data: { activo: false },
  });
  return NextResponse.json(servicio);
}
