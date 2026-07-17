import { prisma } from "@/lib/prisma";
import { obtenerUsuarioActual } from "@/lib/auth";
import { tienePermiso } from "@/lib/permisos";
import AccesoDenegado from "@/components/AccesoDenegado";
import { NOTA_MORA_DEFAULT } from "@/lib/notaMoraConfig";
import NotaMoraTextoClient from "./NotaMoraTextoClient";

export default async function NotaMoraConfigPage() {
  const usuario = await obtenerUsuarioActual();
  if (!tienePermiso(usuario, "configuracion")) {
    return <AccesoDenegado modulo="Configuración del sistema" />;
  }

  const row = await prisma.configuracion.findUnique({ where: { clave: "notaMora" } });
  const config = row ? { ...NOTA_MORA_DEFAULT, ...JSON.parse(row.valor) } : NOTA_MORA_DEFAULT;

  return (
    <div>
      <h1 className="text-2xl font-bold text-azul mb-1">Textos de la nota de mora</h1>
      <p className="text-gray-500 mb-6">
        Edite el texto que aparece en las notas de pago pendiente. Los datos del abonado
        (nombre, código, deuda) se llenan solos.
      </p>
      <NotaMoraTextoClient configInicial={config} />
    </div>
  );
}
