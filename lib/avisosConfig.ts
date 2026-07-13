export const AVISOS_DEFAULT = {
  activo: false,
  canal: "SMS", // "SMS" o "WHATSAPP" - el mismo numero de Twilio sirve para ambos
  numeroFrom: "", // numero de Twilio, ej: +14155238886
  plantilla:
    "Hola {nombre}, recibimos su pago de L{total} por {meses} en el pegue {codigo} ({barrio}). " +
    "Recibo #{numeroRecibo}, fecha {fecha}. ¡Gracias por su pago puntual! - {junta}",
};
