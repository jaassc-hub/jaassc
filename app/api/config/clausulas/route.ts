import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerUsuarioActual } from "@/lib/auth";
import { tienePermiso } from "@/lib/permisos";
import { CLAUSULAS_DEFAULT } from "@/lib/clausulasConfig";

export async function GET() {
  const row = await prisma.configuracion.findUnique({ where: { clave: "clausulas" } });
  return NextResponse.json(row ? JSON.parse(row.valor) : CLAUSULAS_DEFAULT);
}

export async function PUT(req: NextRequest) {
  const usuarioActual = await obtenerUsuarioActual();
  if (!tienePermiso(usuarioActual, "configuracion")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const body = await req.json();
  await prisma.configuracion.upsert({
    where: { clave: "clausulas" },
    update: { valor: JSON.stringify(body) },
    create: { clave: "clausulas", valor: JSON.stringify(body) },
  });
  return NextResponse.json({ ok: true });
}
