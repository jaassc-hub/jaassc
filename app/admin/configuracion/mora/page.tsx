import { prisma } from "@/lib/prisma";
import { obtenerUsuarioActual } from "@/lib/auth";
import { tienePermiso } from "@/lib/permisos";
import AccesoDenegado from "@/components/AccesoDenegado";
import { MORA_DEFAULT } from "@/lib/moraConfig";
import MoraClient from "./MoraClient";

export default async function MoraPage() {
  const usuario = await obtenerUsuarioActual();
  if (!tienePermiso(usuario, "configuracion")) {
    return <AccesoDenegado modulo="Configuración del sistema" />;
  }

  const row = await prisma.configuracion.findUnique({ where: { clave: "mora" } });
  const config = row ? JSON.parse(row.valor) : MORA_DEFAULT;

  return (
    <div>
      <h1 className="text-2xl font-bold text-azul mb-1">Mora</h1>
      <p className="text-gray-500 mb-6">
        La mora se cobra una sola vez, como un porcentaje sobre el total que el abonado
        debe (no por cada mes). Defina el porcentaje según cuántos meses lleve debiendo.
      </p>
      <MoraClient configInicial={config} />
    </div>
  );
}
