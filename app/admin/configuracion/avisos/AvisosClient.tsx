"use client";

import { useState } from "react";
import { Send, CheckCircle2, XCircle } from "lucide-react";

const PLACEHOLDERS = [
  "{nombre}", "{codigo}", "{barrio}", "{meses}", "{total}", "{numeroRecibo}", "{fecha}", "{junta}",
];

export default function AvisosClient({
  configInicial,
  credencialesConfiguradas,
  mensajesIniciales,
}: {
  configInicial: any;
  credencialesConfiguradas: boolean;
  mensajesIniciales: any[];
}) {
  const [config, setConfig] = useState(configInicial);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const [telefonoPrueba, setTelefonoPrueba] = useState("");
  const [enviandoPrueba, setEnviandoPrueba] = useState(false);
  const [resultadoPrueba, setResultadoPrueba] = useState("");

  async function guardar() {
    setGuardando(true);
    setMensaje("");
    const res = await fetch("/api/config/avisos", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    setGuardando(false);
    setMensaje(res.ok ? "Guardado." : "Error al guardar.");
  }

  async function enviarPrueba() {
    if (!telefonoPrueba) return;
    setEnviandoPrueba(true);
    setResultadoPrueba("");
    const res = await fetch("/api/avisos/prueba", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telefono: telefonoPrueba }),
    });
    setEnviandoPrueba(false);
    const data = await res.json();
    setResultadoPrueba(res.ok ? "✓ Mensaje enviado, revíselo en ese teléfono." : `Error: ${data.error}`);
  }

  return (
    <div className="max-w-xl space-y-4">
      {!credencialesConfiguradas && (
        <div className="card border-orange-300 bg-orange-50">
          <p className="text-sm text-orange-700">
            ⚠ Todavía no hay credenciales de Twilio en el servidor
            (<code>TWILIO_ACCOUNT_SID</code> / <code>TWILIO_AUTH_TOKEN</code> en su archivo
            <code> .env</code>). Puede configurar todo lo demás aquí, pero los avisos no se
            enviarán hasta que agregue esas dos variables y reinicie el sistema.
          </p>
        </div>
      )}

      <div className="card space-y-3">
        <label className="flex items-center gap-2 font-semibold text-azul">
          <input
            type="checkbox"
            checked={config.activo}
            onChange={(e) => setConfig({ ...config, activo: e.target.checked })}
          />
          Activar aviso automático de pago
        </label>

        <div>
          <label className="label">Canal de envío</label>
          <select className="input" value={config.canal} onChange={(e) => setConfig({ ...config, canal: e.target.value })}>
            <option value="SMS">SMS (mensaje de texto)</option>
            <option value="WHATSAPP">WhatsApp</option>
          </select>
          <p className="text-xs text-gray-400 mt-1">
            Use SMS mientras espera la aprobación de WhatsApp por parte de Meta — el mismo
            número de Twilio sirve para los dos, solo cambie esta opción cuando le aprueben.
          </p>
        </div>

        <div>
          <label className="label">Número de envío (el que le dio Twilio)</label>
          <input
            className="input"
            placeholder="+14155238886"
            value={config.numeroFrom}
            onChange={(e) => setConfig({ ...config, numeroFrom: e.target.value })}
          />
        </div>

        <div>
          <label className="label">Mensaje</label>
          <textarea
            className="input min-h-[100px]"
            value={config.plantilla}
            onChange={(e) => setConfig({ ...config, plantilla: e.target.value })}
          />
          <p className="text-xs text-gray-400 mt-1">
            Datos disponibles: {PLACEHOLDERS.join(" ")}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button type="button" onClick={guardar} disabled={guardando} className="btn-primario text-sm">
            {guardando ? "Guardando..." : "Guardar"}
          </button>
          {mensaje && <span className="text-sm text-gray-500">{mensaje}</span>}
        </div>
      </div>

      <div className="card space-y-3">
        <p className="font-semibold text-azul">Enviar mensaje de prueba</p>
        <div className="flex gap-2">
          <input
            className="input"
            placeholder="Su número, ej: 9999-9999"
            value={telefonoPrueba}
            onChange={(e) => setTelefonoPrueba(e.target.value)}
          />
          <button type="button"
            onClick={enviarPrueba}
            disabled={enviandoPrueba}
            className="btn-outline text-sm whitespace-nowrap flex items-center gap-1.5"
          >
            <Send size={14} /> {enviandoPrueba ? "Enviando..." : "Probar"}
          </button>
        </div>
        {resultadoPrueba && <p className="text-sm text-gray-600">{resultadoPrueba}</p>}
        <p className="text-xs text-gray-400">
          La prueba usa el canal que tenga seleccionado arriba (guárdelo primero). Si está
          probando WhatsApp con el sandbox de Twilio, primero debe "unir" ese número desde su
          WhatsApp con el código que le dio Twilio.
        </p>
      </div>

      <div className="card">
        <p className="font-semibold text-azul mb-3">Últimos mensajes</p>
        <div className="divide-y">
          {mensajesIniciales.map((m) => (
            <div key={m.id} className="py-2 flex items-start gap-2 text-sm">
              {m.estado === "ENVIADO" ? (
                <CheckCircle2 size={16} className="text-green-600 shrink-0 mt-0.5" />
              ) : (
                <XCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
              )}
              <div>
                <p>
                  {m.telefono} <span className="text-gray-400">· {m.canal}</span>
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(m.createdAt).toLocaleString("es-HN")}
                  {m.error && ` · ${m.error}`}
                </p>
              </div>
            </div>
          ))}
          {mensajesIniciales.length === 0 && (
            <p className="text-gray-400 text-sm py-2">Todavía no se ha enviado ningún mensaje.</p>
          )}
        </div>
      </div>
    </div>
  );
}
