import { prisma } from "@/lib/prisma";
import { obtenerUsuarioActual } from "@/lib/auth";
import { tienePermiso } from "@/lib/permisos";
import AccesoDenegado from "@/components/AccesoDenegado";
import { WHATSAPP_DEFAULT } from "@/lib/whatsappConfig";
import WhatsappClient from "./WhatsappClient";

export default async function WhatsappPage() {
  const usuario = await obtenerUsuarioActual();
  if (!tienePermiso(usuario, "configuracion")) {
    return <AccesoDenegado modulo="Configuración del sistema" />;
  }

  const row = await prisma.configuracion.findUnique({ where: { clave: "whatsapp" } });
  const config = row ? { ...WHATSAPP_DEFAULT, ...JSON.parse(row.valor) } : WHATSAPP_DEFAULT;
  const credencialesConfiguradas = !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN);

  const ultimosMensajes = await prisma.mensajeWhatsapp.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-azul mb-1">Avisos por WhatsApp</h1>
      <p className="text-gray-500 mb-6">
        Envía automáticamente un mensaje de WhatsApp al abonado (si tiene teléfono
        registrado) cada vez que se le registra un pago.
      </p>
      <WhatsappClient
        configInicial={config}
        credencialesConfiguradas={credencialesConfiguradas}
        mensajesIniciales={JSON.parse(JSON.stringify(ultimosMensajes))}
      />
    </div>
  );
}
