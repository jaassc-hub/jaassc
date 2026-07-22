export const AVISOS_DEFAULT = {
  activo: false,
  canal: "SMS", // "SMS" o "WHATSAPP" - el mismo numero de Twilio sirve para ambos
  numeroFrom: "", // numero de Twilio, ej: +14155238886
  plantilla:
    "Estimado(a) *{nombre}*\n\n" +
    "Le notificamos que hemos recibido su pago y acontinuación le presentamos la información correspondiente a la transacción realizada:\n\n" +
    "•  Recibo: #{numeroRecibo}\n" +
    "•  Fecha: {fecha}\n" +
    "•  Pegue: {codigo}\n" +
    "•  Barrio: {barrio}\n" +
    "•  Meses pagados: {meses}\n" +
    "•  Total cancelado: *L {total}*\n\n" +
    "_Recuerde mantener sus pagos al día._\n\n" +
    "Att: {junta}",
};
