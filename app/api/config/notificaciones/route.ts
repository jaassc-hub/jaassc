import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerUsuarioActual } from "@/lib/auth";
import { tienePermiso } from "@/lib/permisos";
import { NOTIFICACIONES_DEFAULT } from "@/lib/notificacionesConfig";

export async function GET() {
  const row = await prisma.configuracion.findUnique({ where: { clave: "notificaciones" } });
  return NextResponse.json(row ? { ...NOTIFICACIONES_DEFAULT, ...JSON.parse(row.valor) } : NOTIFICACIONES_DEFAULT);
}

export async function PUT(req: NextRequest) {
  const usuarioActual = await obtenerUsuarioActual();
  if (!tienePermiso(usuarioActual, "configuracion")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const body = await req.json();
  await prisma.configuracion.upsert({
    where: { clave: "notificaciones" },
    update: { valor: JSON.stringify(body) },
    create: { clave: "notificaciones", valor: JSON.stringify(body) },
  });
  return NextResponse.json({ ok: true });
}
