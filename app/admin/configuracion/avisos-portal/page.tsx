import { prisma } from "@/lib/prisma";
import { obtenerUsuarioActual } from "@/lib/auth";
import { tienePermiso } from "@/lib/permisos";
import AccesoDenegado from "@/components/AccesoDenegado";
import { AVISOS_PORTAL_DEFAULT } from "@/lib/avisosPortalConfig";
import AvisosPortalClient from "./AvisosPortalClient";

export default async function AvisosPortalPage() {
  const usuario = await obtenerUsuarioActual();
  if (!tienePermiso(usuario, "configuracion")) {
    return <AccesoDenegado modulo="Configuración del sistema" />;
  }

  const row = await prisma.configuracion.findUnique({ where: { clave: "avisosPortal" } });
  const config = row ? JSON.parse(row.valor) : AVISOS_PORTAL_DEFAULT;

  return (
    <div>
      <h1 className="text-2xl font-bold text-azul mb-1">Avisos del portal</h1>
      <p className="text-gray-500 mb-6">
        Estos avisos aparecen en un carrusel en la página de inicio, antes de que el abonado
        entre a consultar su cuenta. Puede ser texto (próximo cobro, reunión, enlace a
        Facebook) o una imagen — para la imagen, suba la foto a algún sitio gratis (por
        ejemplo, publíquela en su Facebook y copie el enlace de la imagen, o use un servicio
        como imgur.com) y pegue aquí el enlace — así no guardamos archivos pesados en la
        base de datos.
      </p>
      <AvisosPortalClient configInicial={config} />
    </div>
  );
}
