import { prisma } from "@/lib/prisma";
import { obtenerUsuarioActual } from "@/lib/auth";
import { tienePermiso } from "@/lib/permisos";
import AccesoDenegado from "@/components/AccesoDenegado";
import UsuariosClient from "./UsuariosClient";

export default async function UsuariosPage() {
  const usuario = await obtenerUsuarioActual();
  if (!tienePermiso(usuario, "configuracion")) {
    return <AccesoDenegado modulo="Configuración del sistema" />;
  }

  const usuarios = await prisma.usuario.findMany({
    orderBy: { username: "asc" },
    select: { id: true, username: true, nombre: true, email: true, rol: true, permisos: true, activo: true, debeCambiarPassword: true },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-azul mb-1">Usuarios y permisos</h1>
      <p className="text-gray-500 mb-6">
        Presidente y Tesorero siempre tienen acceso a todo. Para los demás roles, marque a qué
        secciones tienen acceso.
      </p>
      <UsuariosClient usuariosIniciales={usuarios} usuarioActualId={usuario!.id} />
    </div>
  );
}
