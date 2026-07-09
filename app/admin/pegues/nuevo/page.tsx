import { prisma } from "@/lib/prisma";
import { obtenerUsuarioActual } from "@/lib/auth";
import { tienePermiso } from "@/lib/permisos";
import AccesoDenegado from "@/components/AccesoDenegado";
import NuevoPegueClient from "./NuevoPegueClient";

export default async function NuevoPeguePage() {
  const usuario = await obtenerUsuarioActual();
  if (!tienePermiso(usuario, "abonados")) {
    return <AccesoDenegado modulo="Pegues y abonados" />;
  }

  const [barrios, servicios] = await Promise.all([
    prisma.barrio.findMany({ orderBy: { nombre: "asc" } }),
    prisma.servicio.findMany({ where: { activo: true }, orderBy: { nombre: "asc" } }),
  ]);

  return <NuevoPegueClient barrios={barrios} servicios={servicios} />;
}
