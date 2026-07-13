import { prisma } from "@/lib/prisma";
import { obtenerUsuarioActual } from "@/lib/auth";
import { tienePermiso } from "@/lib/permisos";
import AccesoDenegado from "@/components/AccesoDenegado";
import { AVISOS_DEFAULT } from "@/lib/avisosConfig";
import AvisosClient from "./AvisosClient";

export default async function AvisosPage() {
  const usuario = await obtenerUsuarioActual();
  if (!tienePermiso(usuario, "configuracion")) {
    return <AccesoDenegado modulo="Configuración del sistema" />;
  }

  const row = await prisma.configuracion.findUnique({ where: { clave: "avisos" } });
  const config = row ? { ...AVISOS_DEFAULT, ...JSON.parse(row.valor) } : AVISOS_DEFAULT;
  const credencialesConfiguradas = !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN);

  const ultimosMensajes = await prisma.mensajeWhatsapp.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-azul mb-1">Avisos de pago (SMS / WhatsApp)</h1>
      <p className="text-gray-500 mb-6">
        Envía automáticamente un aviso al abonado (si tiene teléfono registrado) cada vez
        que se le registra un pago. Puede usar SMS (más simple, ya disponible) o WhatsApp
        (más barato, requiere aprobación de Meta) con el mismo número de Twilio.
      </p>
      <AvisosClient
        configInicial={config}
        credencialesConfiguradas={credencialesConfiguradas}
        mensajesIniciales={JSON.parse(JSON.stringify(ultimosMensajes))}
      />
    </div>
  );
}
