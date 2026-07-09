import { prisma } from "@/lib/prisma";
import { obtenerUsuarioActual } from "@/lib/auth";
import { tienePermiso } from "@/lib/permisos";
import AccesoDenegado from "@/components/AccesoDenegado";
import BarriosClient from "./BarriosClient";

export default async function BarriosPage() {
  const usuario = await obtenerUsuarioActual();
  if (!tienePermiso(usuario, "barrios")) {
    return <AccesoDenegado modulo="Barrios y códigos" />;
  }
  const barrios = await prisma.barrio.findMany({
    orderBy: { nombre: "asc" },
    include: { _count: { select: { pegues: true } } },
  });
  return (
    <div>
      <h1 className="text-2xl font-bold text-azul mb-1">Barrios y códigos</h1>
      <p className="text-gray-500 mb-6">
        Cada barrio tiene un prefijo (ej. GUA) y un correlativo. El siguiente pegue de ese
        barrio se numerará automáticamente, pero puede corregir el correlativo aquí si es
        necesario.
      </p>
      <BarriosClient barriosIniciales={barrios} />
    </div>
  );
}
