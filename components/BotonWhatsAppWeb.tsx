"use client";

import { MessageCircle } from "lucide-react";
import { enlaceWhatsAppWeb } from "@/lib/whatsappWeb";

export default function BotonWhatsAppWeb({
  telefono,
  mensaje,
  texto = "Enviar por WhatsApp",
  className = "btn-outline text-sm flex items-center gap-1.5",
}: {
  telefono: string;
  mensaje: string;
  texto?: string;
  className?: string;
}) {
  const enlace = enlaceWhatsAppWeb(telefono, mensaje);
  if (!enlace) return null;

  return (
    <a href={enlace} target="_blank" rel="noopener noreferrer" className={className}>
      <MessageCircle size={14} /> {texto}
    </a>
  );
}
