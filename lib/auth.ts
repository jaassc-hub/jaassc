import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

const COOKIE_NAME = "junta_session";

function getSecret() {
  const secret = process.env.JWT_SECRET || "dev-secret-cambiar";
  return new TextEncoder().encode(secret);
}

export async function crearSesion(username: string) {
  const token = await new SignJWT({ username })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(getSecret());

  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function obtenerSesion() {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as { username: string };
  } catch {
    return null;
  }
}

export function cerrarSesion() {
  cookies().delete(COOKIE_NAME);
}

// Trae el usuario completo (rol, permisos) a partir de la sesion activa.
// Se usa en las paginas del panel para decidir que puede ver cada quien.
export async function obtenerUsuarioActual() {
  const sesion = await obtenerSesion();
  if (!sesion) return null;
  const usuario = await prisma.usuario.findUnique({ where: { username: sesion.username } });
  if (!usuario || !usuario.activo) return null;
  return usuario;
}

export { COOKIE_NAME };
