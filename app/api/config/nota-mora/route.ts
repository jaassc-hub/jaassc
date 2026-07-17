import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerUsuarioActual } from "@/lib/auth";
import { tienePermiso } from "@/lib/permisos";
import { NOTA_MORA_DEFAULT } from "@/lib/notaMoraConfig";

export async function GET() {
  const row = await prisma.configuracion.findUnique({ where: { clave: "notaMora" } });
  return NextResponse.json(row ? { ...NOTA_MORA_DEFAULT, ...JSON.parse(row.valor) } : NOTA_MORA_DEFAULT);
}

export async function PUT(req: NextRequest) {
  const usuarioActual = await obtenerUsuarioActual();
  if (!tienePermiso(usuarioActual, "configuracion")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const body = await req.json();
  await prisma.configuracion.upsert({
    where: { clave: "notaMora" },
    update: { valor: JSON.stringify(body) },
    create: { clave: "notaMora", valor: JSON.stringify(body) },
  });
  return NextResponse.json({ ok: true });
}
