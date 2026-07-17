import { obtenerUsuarioActual } from "@/lib/auth";
import { tienePermiso } from "@/lib/permisos";
import AccesoDenegado from "@/components/AccesoDenegado";
import { prisma } from "@/lib/prisma";
import LibroDiarioClient from "./LibroDiarioClient";

export default async function LibroDiarioPage() {
  const usuario = await obtenerUsuarioActual();
  if (!tienePermiso(usuario, "caja")) {
    return <AccesoDenegado modulo="Informe de caja" />;
  }

  const barrios = await prisma.barrio.findMany({ orderBy: { nombre: "asc" } });

  return (
    <LibroDiarioClient
      barrios={barrios}
      juntaNombre={process.env.NEXT_PUBLIC_JUNTA_NOMBRE || "Junta de Agua"}
    />
  );
}
