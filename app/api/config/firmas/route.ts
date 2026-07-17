import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerUsuarioActual } from "@/lib/auth";
import { tienePermiso } from "@/lib/permisos";
import { FIRMAS_DEFAULT } from "@/lib/firmasConfig";

export async function GET() {
  const row = await prisma.configuracion.findUnique({ where: { clave: "firmas" } });
  return NextResponse.json(row ? JSON.parse(row.valor) : FIRMAS_DEFAULT);
}

export async function PUT(req: NextRequest) {
  const usuarioActual = await obtenerUsuarioActual();
  if (!tienePermiso(usuarioActual, "configuracion")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const body = await req.json();
  await prisma.configuracion.upsert({
    where: { clave: "firmas" },
    update: { valor: JSON.stringify(body) },
    create: { clave: "firmas", valor: JSON.stringify(body) },
  });
  return NextResponse.json({ ok: true });
}
