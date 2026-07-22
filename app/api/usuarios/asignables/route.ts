import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerUsuarioActual } from "@/lib/auth";
import { tienePermiso } from "@/lib/permisos";

export async function GET() {
  const usuarioActual = await obtenerUsuarioActual();
  if (!tienePermiso(usuarioActual, "abonados")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const usuarios = await prisma.usuario.findMany({
    where: { activo: true },
    select: { id: true, nombre: true, username: true },
    orderBy: { username: "asc" },
  });
  return NextResponse.json(usuarios);
}
