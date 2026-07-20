import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { crearSesion } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  if (!username || !password) {
    return NextResponse.json(
      { error: "Usuario y contraseña son requeridos" },
      { status: 400 }
    );
  }

  const usuario = await prisma.usuario.findUnique({ where: { username } });
  if (!usuario || !usuario.activo) {
    return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
  }

  const valido = await bcrypt.compare(password, usuario.passwordHash);
  if (!valido) {
    return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
  }

  await crearSesion(usuario.username);
  return NextResponse.json({ ok: true, debeCambiarPassword: usuario.debeCambiarPassword });
}
