import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerUsuarioActual } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const usuarioActual = await obtenerUsuarioActual();
  if (!usuarioActual) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const delegacion = await prisma.delegacion.findUnique({ where: { id: params.id } });
  if (!delegacion) {
    return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  }

  const body = await req.json();
  const actualizada = await prisma.delegacion.update({
    where: { id: params.id },
    data: {
      resuelto: true,
      notaResolucion: body.notaResolucion || null,
      resueltoAt: new Date(),
    },
  });

  return NextResponse.json(actualizada);
}
