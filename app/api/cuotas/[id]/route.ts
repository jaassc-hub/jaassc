import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerUsuarioActual } from "@/lib/auth";
import { generarCorrelativo } from "@/lib/correlativo";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const usuarioActual = await obtenerUsuarioActual();
  const emitidoPor = usuarioActual ? usuarioActual.nombre || usuarioActual.username : null;

  const cuota = await prisma.cuotaPegue.findUnique({ where: { id: params.id } });
  if (!cuota) {
    return NextResponse.json({ error: "Cuota no encontrada" }, { status: 404 });
  }
  if (cuota.pagada) {
    return NextResponse.json({ error: "Esa cuota ya estaba pagada" }, { status: 400 });
  }

  const actualizada = await prisma.$transaction(async (tx) => {
    const numeroRecibo = await generarCorrelativo(tx, "CONEXION");

    return tx.cuotaPegue.update({
      where: { id: params.id },
      data: {
        pagada: true,
        fechaPago: body.fechaPago ? new Date(body.fechaPago) : new Date(),
        metodoPago: body.metodoPago || "EFECTIVO",
        referencia: body.referencia || null,
        numeroRecibo,
        emitidoPor,
      },
    });
  });

  return NextResponse.json(actualizada);
}
