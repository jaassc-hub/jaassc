export const WHATSAPP_DEFAULT = {
  activo: false,
  numeroFrom: "", // numero de WhatsApp de Twilio, ej: +14155238886 (sandbox) o el numero real ya aprobado
  plantilla:
    "Hola {nombre}, recibimos su pago de L{total} por {meses} en el pegue {codigo} ({barrio}). " +
    "Recibo #{numeroRecibo}, fecha {fecha}. ¡Gracias por su pago puntual! - {junta}",
};
