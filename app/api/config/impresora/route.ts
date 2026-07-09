import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerUsuarioActual } from "@/lib/auth";
import { tienePermiso } from "@/lib/permisos";
import { IMPRESORA_DEFAULT } from "@/lib/impresoraConfig";

export async function GET() {
  const row = await prisma.configuracion.findUnique({ where: { clave: "impresora" } });
  if (!row) return NextResponse.json(IMPRESORA_DEFAULT);
  return NextResponse.json(JSON.parse(row.valor));
}

export async function PUT(req: NextRequest) {
  const usuarioActual = await obtenerUsuarioActual();
  if (!tienePermiso(usuarioActual, "configuracion")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const body = await req.json();
  await prisma.configuracion.upsert({
    where: { clave: "impresora" },
    update: { valor: JSON.stringify(body) },
    create: { clave: "impresora", valor: JSON.stringify(body) },
  });
  return NextResponse.json(body);
}
