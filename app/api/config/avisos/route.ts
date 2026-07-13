import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerUsuarioActual } from "@/lib/auth";
import { tienePermiso } from "@/lib/permisos";
import { AVISOS_DEFAULT } from "@/lib/avisosConfig";

export async function GET() {
  const usuarioActual = await obtenerUsuarioActual();
  if (!tienePermiso(usuarioActual, "configuracion")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const row = await prisma.configuracion.findUnique({ where: { clave: "avisos" } });
  const config = row ? { ...AVISOS_DEFAULT, ...JSON.parse(row.valor) } : AVISOS_DEFAULT;
  return NextResponse.json({
    ...config,
    credencialesConfiguradas: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
  });
}

export async function PUT(req: NextRequest) {
  const usuarioActual = await obtenerUsuarioActual();
  if (!tienePermiso(usuarioActual, "configuracion")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const body = await req.json();
  const { activo, canal, numeroFrom, plantilla } = body;
  await prisma.configuracion.upsert({
    where: { clave: "avisos" },
    update: { valor: JSON.stringify({ activo, canal, numeroFrom, plantilla }) },
    create: { clave: "avisos", valor: JSON.stringify({ activo, canal, numeroFrom, plantilla }) },
  });
  return NextResponse.json({ ok: true });
}
