import { prisma } from "@/lib/prisma";
import { obtenerUsuarioActual } from "@/lib/auth";
import { tienePermiso } from "@/lib/permisos";
import AccesoDenegado from "@/components/AccesoDenegado";
import { NOTIFICACIONES_DEFAULT } from "@/lib/notificacionesConfig";
import NotificacionesConfigClient from "./NotificacionesConfigClient";

export default async function NotificacionesConfigPage() {
  const usuario = await obtenerUsuarioActual();
  if (!tienePermiso(usuario, "configuracion")) {
    return <AccesoDenegado modulo="Configuración del sistema" />;
  }

  const row = await prisma.configuracion.findUnique({ where: { clave: "notificaciones" } });
  const config = row ? { ...NOTIFICACIONES_DEFAULT, ...JSON.parse(row.valor) } : NOTIFICACIONES_DEFAULT;

  return (
    <div>
      <h1 className="text-2xl font-bold text-azul mb-1">Notificaciones de irregularidades</h1>
      <p className="text-gray-500 mb-6">
        Ajuste a partir de cuántos meses se considera una irregularidad, y el monto de la
        multa por cuota de conexión atrasada.
      </p>
      <NotificacionesConfigClient configInicial={config} />
    </div>
  );
}
