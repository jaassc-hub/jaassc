import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerUsuarioActual } from "@/lib/auth";
import { tienePermiso } from "@/lib/permisos";
import { WHATSAPP_DEFAULT } from "@/lib/whatsappConfig";

export async function GET() {
  const usuarioActual = await obtenerUsuarioActual();
  if (!tienePermiso(usuarioActual, "configuracion")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const row = await prisma.configuracion.findUnique({ where: { clave: "whatsapp" } });
  const config = row ? { ...WHATSAPP_DEFAULT, ...JSON.parse(row.valor) } : WHATSAPP_DEFAULT;
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
  const { activo, numeroFrom, plantilla } = body;
  await prisma.configuracion.upsert({
    where: { clave: "whatsapp" },
    update: { valor: JSON.stringify({ activo, numeroFrom, plantilla }) },
    create: { clave: "whatsapp", valor: JSON.stringify({ activo, numeroFrom, plantilla }) },
  });
  return NextResponse.json({ ok: true });
}
