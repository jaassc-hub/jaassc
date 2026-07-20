import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerUsuarioActual } from "@/lib/auth";
import { tienePermiso } from "@/lib/permisos";
import { validarPassword, generarPasswordTemporal } from "@/lib/passwordPolicy";
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
  if (body.email !== undefined) data.email = body.email;
  if (body.rol !== undefined) data.rol = body.rol;
  if (body.permisos !== undefined) data.permisos = JSON.stringify(body.permisos);
  if (body.activo !== undefined) data.activo = body.activo;
  if (data.rol === "COBRADOR") data.permisos = JSON.stringify(["pagos"]);

  // Evitar que alguien se quite a si mismo el acceso total por error
  if (params.id === usuarioActual!.id && data.activo === false) {
    return NextResponse.json({ error: "No puede desactivar su propio usuario" }, { status: 400 });
  }

  let passwordTemporalGenerada: string | null = null;

  if (body.regenerarPassword) {
    // El admin resetea la contraseña: se genera una temporal y se obliga a cambiarla
    // en el proximo inicio de sesion. Solo se muestra una vez, aqui en la respuesta.
    passwordTemporalGenerada = generarPasswordTemporal();
    data.passwordHash = await bcrypt.hash(passwordTemporalGenerada, 10);
    data.debeCambiarPassword = true;
  } else if (body.password) {
    const errorPassword = validarPassword(body.password);
    if (errorPassword) {
      return NextResponse.json({ error: errorPassword }, { status: 400 });
    }
    data.passwordHash = await bcrypt.hash(body.password, 10);
    data.debeCambiarPassword = false;
  }

  const usuario = await prisma.usuario.update({
    where: { id: params.id },
    data,
    select: {
      id: true, username: true, nombre: true, email: true, rol: true,
      permisos: true, activo: true, debeCambiarPassword: true,
    },
  });

  return NextResponse.json({ ...usuario, passwordTemporal: passwordTemporalGenerada });
}
