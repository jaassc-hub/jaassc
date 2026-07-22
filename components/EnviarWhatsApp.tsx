"use client";

import { useState } from "react";
import { MessageCircle, Send } from "lucide-react";
import { enlaceWhatsAppWeb } from "@/lib/whatsappWeb";

export default function EnviarWhatsApp({
  telefono,
  mensaje,
  texto = "Enviar por WhatsApp",
}: {
  telefono?: string | null;
  mensaje: string;
  texto?: string;
}) {
  const [mostrarInput, setMostrarInput] = useState(false);
  const [numeroManual, setNumeroManual] = useState("");

  if (telefono) {
    const enlace = enlaceWhatsAppWeb(telefono, mensaje);
    if (!enlace) return null;
    return (
      <a href={enlace} target="_blank" rel="noopener noreferrer" className="btn-outline text-sm flex items-center gap-1.5">
        <MessageCircle size={14} /> {texto}
      </a>
    );
  }

  if (!mostrarInput) {
    return (
      <button type="button" onClick={() => setMostrarInput(true)} className="btn-outline text-sm flex items-center gap-1.5">
        <MessageCircle size={14} /> Notificar a un número
      </button>
    );
  }

  const enlaceManual = numeroManual ? enlaceWhatsAppWeb(numeroManual, mensaje) : null;

  return (
    <div className="flex items-center gap-2">
      <input
        className="input text-sm w-40"
        placeholder="Ej: 9999-9999"
        value={numeroManual}
        onChange={(e) => setNumeroManual(e.target.value)}
      />
      {enlaceManual ? (
        <a href={enlaceManual} target="_blank" rel="noopener noreferrer" className="btn-primario text-sm flex items-center gap-1.5">
          <Send size={14} /> Enviar
        </a>
      ) : (
        <button type="button" disabled className="btn-primario text-sm opacity-50">
          <Send size={14} />
        </button>
      )}
    </div>
  );
}
