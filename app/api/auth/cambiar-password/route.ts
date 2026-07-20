import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerUsuarioActual } from "@/lib/auth";
import { validarPassword } from "@/lib/passwordPolicy";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const usuarioActual = await obtenerUsuarioActual();
  if (!usuarioActual) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { passwordActual, passwordNueva } = await req.json();

  const valido = await bcrypt.compare(passwordActual || "", usuarioActual.passwordHash);
  if (!valido) {
    return NextResponse.json({ error: "La contraseña actual no es correcta" }, { status: 400 });
  }

  const errorPassword = validarPassword(passwordNueva);
  if (errorPassword) {
    return NextResponse.json({ error: errorPassword }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(passwordNueva, 10);
  await prisma.usuario.update({
    where: { id: usuarioActual.id },
    data: { passwordHash, debeCambiarPassword: false },
  });

  return NextResponse.json({ ok: true });
}
