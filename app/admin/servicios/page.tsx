import { prisma } from "@/lib/prisma";
import { obtenerUsuarioActual } from "@/lib/auth";
import { tienePermiso } from "@/lib/permisos";
import AccesoDenegado from "@/components/AccesoDenegado";
import ServiciosClient from "./ServiciosClient";

export default async function ServiciosPage() {
  const usuario = await obtenerUsuarioActual();
  if (!tienePermiso(usuario, "servicios")) {
    return <AccesoDenegado modulo="Servicios y tarifas" />;
  }
  const servicios = await prisma.servicio.findMany({ orderBy: { nombre: "asc" } });
  return (
    <div>
      <h1 className="text-2xl font-bold text-azul mb-1">Servicios y tarifas</h1>
      <p className="text-gray-500 mb-6">
        Aquí se definen los servicios que presta la Junta y su precio mensual. Solo el
        administrador puede editarlos.
      </p>
      <ServiciosClient serviciosIniciales={servicios} />
    </div>
  );
}
