import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const data: any = {};
  if (body.nombre !== undefined) data.nombre = body.nombre;
  if (body.prefijo !== undefined) data.prefijo = body.prefijo.toUpperCase();
  if (body.ultimoNum !== undefined) data.ultimoNum = parseInt(body.ultimoNum);

  const barrio = await prisma.barrio.update({
    where: { id: params.id },
    data,
  });
  return NextResponse.json(barrio);
}
