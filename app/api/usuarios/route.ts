import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerUsuarioActual } from "@/lib/auth";
import { tienePermiso } from "@/lib/permisos";
import { validarPassword } from "@/lib/passwordPolicy";
import bcrypt from "bcryptjs";

export async function GET() {
  const usuarioActual = await obtenerUsuarioActual();
  if (!tienePermiso(usuarioActual, "configuracion")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const usuarios = await prisma.usuario.findMany({
    orderBy: { username: "asc" },
    select: {
      id: true, username: true, nombre: true, email: true, rol: true,
      permisos: true, activo: true, debeCambiarPassword: true, createdAt: true,
    },
  });
  return NextResponse.json(usuarios);
}

export async function POST(req: NextRequest) {
  const usuarioActual = await obtenerUsuarioActual();
  if (!tienePermiso(usuarioActual, "configuracion")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json();
  if (!body.username || !body.password) {
    return NextResponse.json({ error: "Usuario y contraseña son requeridos" }, { status: 400 });
  }

  const errorPassword = validarPassword(body.password);
  if (errorPassword) {
    return NextResponse.json({ error: errorPassword }, { status: 400 });
  }

  try {
    const passwordHash = await bcrypt.hash(body.password, 10);
    const permisos = body.rol === "COBRADOR" ? ["pagos"] : body.permisos || [];
    const usuario = await prisma.usuario.create({
      data: {
        username: body.username,
        passwordHash,
        nombre: body.nombre || null,
        email: body.email || null,
        rol: body.rol || "VOCAL",
        permisos: JSON.stringify(permisos),
      },
      select: { id: true, username: true, nombre: true, email: true, rol: true, permisos: true, activo: true },
    });
    return NextResponse.json(usuario);
  } catch (e: any) {
    if (e.code === "P2002") {
      return NextResponse.json({ error: "Ya existe un usuario con ese nombre de usuario" }, { status: 400 });
    }
    throw e;
  }
}
