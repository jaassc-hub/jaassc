"use client";

import { useState } from "react";

export default function NotificacionesConfigClient({ configInicial }: { configInicial: any }) {
  const [config, setConfig] = useState(configInicial);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  async function guardar() {
    setGuardando(true);
    setMensaje("");
    const res = await fetch("/api/config/notificaciones", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    setGuardando(false);
    setMensaje(res.ok ? "Guardado." : "Error al guardar.");
  }

  return (
    <div className="max-w-lg space-y-4">
      <div className="card space-y-3">
        <div>
          <label className="label">
            Avisar si un pegue lleva cortado por mora sin reconectarse (meses)
          </label>
          <input
            type="number"
            min={1}
            className="input w-32"
            value={config.umbralMesesCorteSinReconexion}
            onChange={(e) => setConfig({ ...config, umbralMesesCorteSinReconexion: parseInt(e.target.value) || 1 })}
          />
          <p className="text-xs text-gray-400 mt-1">
            Es raro que alguien pase tanto tiempo cortado sin reconectarse — puede ser señal de
            que el pegue debería estar inhabilitado, o de algún error.
          </p>
        </div>

        <div>
          <label className="label">
            Avisar si una cuota de conexión lleva atrasada (meses)
          </label>
          <input
            type="number"
            min={1}
            className="input w-32"
            value={config.umbralMesesCuotaAtrasada}
            onChange={(e) => setConfig({ ...config, umbralMesesCuotaAtrasada: parseInt(e.target.value) || 1 })}
          />
        </div>

        <div>
          <label className="label">Multa por cuota atrasada (L)</label>
          <input
            type="number"
            min={0}
            className="input w-32"
            value={config.montoMultaCuotaAtrasada}
            onChange={(e) => setConfig({ ...config, montoMultaCuotaAtrasada: parseFloat(e.target.value) || 0 })}
          />
          <p className="text-xs text-gray-400 mt-1">
            Esta multa no se cobra sola — desde el apartado de Notificaciones usted decide si
            aplicarla a cada caso.
          </p>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button type="button" onClick={guardar} disabled={guardando} className="btn-primario text-sm">
            {guardando ? "Guardando..." : "Guardar"}
          </button>
          {mensaje && <span className="text-sm text-gray-500">{mensaje}</span>}
        </div>
      </div>
    </div>
  );
}
