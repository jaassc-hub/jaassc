import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerUsuarioActual } from "@/lib/auth";
import { tienePermiso } from "@/lib/permisos";
import { generarPin } from "@/lib/pin";

export async function POST() {
  const usuarioActual = await obtenerUsuarioActual();
  if (!tienePermiso(usuarioActual, "configuracion")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const sinPin = await prisma.abonado.findMany({ where: { pin: null }, select: { id: true } });
  for (const a of sinPin) {
    await prisma.abonado.update({ where: { id: a.id }, data: { pin: generarPin() } });
  }

  return NextResponse.json({ ok: true, generados: sinPin.length });
}
