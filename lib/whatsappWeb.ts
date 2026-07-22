// Genera un enlace de "click to chat" de WhatsApp (100% permitido por Meta, no requiere
// API ni verificacion de negocio) que abre WhatsApp Web o la app con el mensaje ya escrito
// -- la persona solo tiene que darle "Enviar". No es automatico del todo a proposito: WhatsApp
// prohibe automatizar el envio sin su API oficial, y hacerlo por fuera arriesga que bloqueen
// el numero.
export function enlaceWhatsAppWeb(telefono: string, mensaje: string): string | null {
  const digitos = telefono.replace(/[^0-9]/g, "");
  let numero: string;
  if (digitos.length === 8) numero = `504${digitos}`;
  else if (digitos.length === 11 && digitos.startsWith("504")) numero = digitos;
  else if (digitos.length >= 8) numero = digitos; // ya viene con algun codigo de pais
  else return null;

  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
}
