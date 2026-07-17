import { prisma } from "@/lib/prisma";
import { obtenerUsuarioActual } from "@/lib/auth";
import { tienePermiso } from "@/lib/permisos";
import AccesoDenegado from "@/components/AccesoDenegado";
import { CLAUSULAS_DEFAULT } from "@/lib/clausulasConfig";
import ClausulasClient from "./ClausulasClient";

export default async function ClausulasPage() {
  const usuario = await obtenerUsuarioActual();
  if (!tienePermiso(usuario, "configuracion")) {
    return <AccesoDenegado modulo="Configuración del sistema" />;
  }

  const row = await prisma.configuracion.findUnique({ where: { clave: "clausulas" } });
  const config = row ? JSON.parse(row.valor) : CLAUSULAS_DEFAULT;

  return (
    <div>
      <h1 className="text-2xl font-bold text-azul mb-1">Cláusulas del acta de instalación</h1>
      <p className="text-gray-500 mb-6">
        Estas cláusulas aparecen en el acta que se genera cuando se instala un pegue nuevo.
      </p>
      <ClausulasClient configInicial={config} />
    </div>
  );
}
