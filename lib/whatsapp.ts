import { prisma } from "./prisma";
import { WHATSAPP_DEFAULT } from "./whatsappConfig";

// Convierte cualquier formato de telefono hondureno a formato internacional E.164.
// Acepta "9999-9999", "99999999", "+50499999999", etc.
export function normalizarTelefonoHN(telefono: string): string | null {
  const digitos = telefono.replace(/[^0-9]/g, "");
  if (digitos.length === 8) return `+504${digitos}`;
  if (digitos.length === 11 && digitos.startsWith("504")) return `+${digitos}`;
  if (telefono.trim().startsWith("+")) return telefono.trim();
  return null;
}

export function llenarPlantilla(plantilla: string, datos: Record<string, string>): string {
  let resultado = plantilla;
  for (const [clave, valor] of Object.entries(datos)) {
    resultado = resultado.split(`{${clave}}`).join(valor);
  }
  return resultado;
}

export async function obtenerConfigWhatsapp() {
  const row = await prisma.configuracion.findUnique({ where: { clave: "whatsapp" } });
  return row ? { ...WHATSAPP_DEFAULT, ...JSON.parse(row.valor) } : WHATSAPP_DEFAULT;
}

// Envia un mensaje por WhatsApp usando la API de Twilio y deja constancia en
// MensajeWhatsapp de si se logro enviar o no. Nunca lanza una excepcion hacia
// afuera: un fallo aqui no debe interrumpir el registro de un pago.
export async function enviarWhatsapp(
  telefono: string,
  mensaje: string,
  pagoId?: string
): Promise<{ ok: boolean; error?: string }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const config = await obtenerConfigWhatsapp();

  if (!accountSid || !authToken) {
    const error = "Faltan TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN en las variables de entorno.";
    await registrar(telefono, mensaje, "ERROR", error, pagoId);
    return { ok: false, error };
  }
  if (!config.numeroFrom) {
    const error = "No hay número de envío configurado (Configuración → WhatsApp).";
    await registrar(telefono, mensaje, "ERROR", error, pagoId);
    return { ok: false, error };
  }

  const numeroDestino = normalizarTelefonoHN(telefono);
  if (!numeroDestino) {
    const error = `Número de teléfono inválido: ${telefono}`;
    await registrar(telefono, mensaje, "ERROR", error, pagoId);
    return { ok: false, error };
  }

  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          From: `whatsapp:${config.numeroFrom}`,
          To: `whatsapp:${numeroDestino}`,
          Body: mensaje,
        }),
      }
    );

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const error = data.message || `Twilio respondió con error ${res.status}`;
      await registrar(telefono, mensaje, "ERROR", error, pagoId);
      return { ok: false, error };
    }

    await registrar(telefono, mensaje, "ENVIADO", undefined, pagoId);
    return { ok: true };
  } catch (e: any) {
    const error = e.message || "Error de red al contactar Twilio";
    await registrar(telefono, mensaje, "ERROR", error, pagoId);
    return { ok: false, error };
  }
}

async function registrar(
  telefono: string,
  mensaje: string,
  estado: "ENVIADO" | "ERROR",
  error: string | undefined,
  pagoId: string | undefined
) {
  try {
    await prisma.mensajeWhatsapp.create({
      data: { telefono, mensaje, estado, error, pagoId },
    });
  } catch {
    // si ni siquiera se puede guardar el registro, no hacemos nada mas: no debe
    // interrumpir el flujo de pago.
  }
}
