import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerUsuarioActual } from "@/lib/auth";
import { tienePermiso } from "@/lib/permisos";
import bcrypt from "bcryptjs";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const usuarioActual = await obtenerUsuarioActual();
  if (!tienePermiso(usuarioActual, "configuracion")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json();
  const data: any = {};
  if (body.nombre !== undefined) data.nombre = body.nombre;
  if (body.rol !== undefined) data.rol = body.rol;
  if (body.permisos !== undefined) data.permisos = JSON.stringify(body.permisos);
  if (body.activo !== undefined) data.activo = body.activo;
  if (body.password) data.passwordHash = await bcrypt.hash(body.password, 10);
  if (data.rol === "COBRADOR") data.permisos = JSON.stringify(["pagos"]);

  // Evitar que alguien se quite a si mismo el acceso total por error
  if (params.id === usuarioActual!.id && (data.activo === false)) {
    return NextResponse.json({ error: "No puede desactivar su propio usuario" }, { status: 400 });
  }

  const usuario = await prisma.usuario.update({
    where: { id: params.id },
    data,
    select: { id: true, username: true, nombre: true, rol: true, permisos: true, activo: true },
  });
  return NextResponse.json(usuario);
}
