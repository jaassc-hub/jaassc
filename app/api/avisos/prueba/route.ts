import { NextRequest, NextResponse } from "next/server";
import { obtenerUsuarioActual } from "@/lib/auth";
import { tienePermiso } from "@/lib/permisos";
import { enviarAviso } from "@/lib/avisos";

export async function POST(req: NextRequest) {
  const usuarioActual = await obtenerUsuarioActual();
  if (!tienePermiso(usuarioActual, "configuracion")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const { telefono } = await req.json();
  if (!telefono) {
    return NextResponse.json({ error: "Escriba un número de teléfono" }, { status: 400 });
  }

  const mensaje =
    "Este es un mensaje de prueba de su sistema de la Junta de Agua. Si lo recibió, todo está funcionando correctamente.";
  const resultado = await enviarAviso(telefono, mensaje);

  if (!resultado.ok) {
    return NextResponse.json({ error: resultado.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
