"use client";

import { useState } from "react";

export default function ImpresoraClient({ configInicial }: { configInicial: any }) {
  const [config, setConfig] = useState(configInicial);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  async function guardar() {
    setGuardando(true);
    setMensaje("");
    const res = await fetch("/api/config/impresora", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    setGuardando(false);
    setMensaje(res.ok ? "Guardado." : "Error al guardar.");
  }

  return (
    <div className="max-w-md space-y-4">
      <div className="card space-y-4">
        <div>
          <label className="label">Ancho de papel (columnas de texto)</label>
          <select
            className="input"
            value={config.anchoColumnas}
            onChange={(e) => setConfig({ ...config, anchoColumnas: parseInt(e.target.value) })}
          >
            <option value={32}>32 columnas (papel angosto)</option>
            <option value={40}>40 columnas (matricial Epson, modo condensado)</option>
            <option value={48}>48 columnas</option>
            <option value={80}>80 columnas (papel de rollo ancho / factura completa)</option>
          </select>
          <p className="text-xs text-gray-400 mt-1">
            Si el recibo sale cortado o desalineado en su impresora, pruebe con menos columnas.
          </p>
        </div>

        <div>
          <label className="label">Fuente</label>
          <select
            className="input"
            value={config.fuente}
            onChange={(e) => setConfig({ ...config, fuente: e.target.value })}
          >
            <option value="monospace">Monoespaciada (recomendada para matricial)</option>
            <option value="'Courier New', monospace">Courier New</option>
          </select>
        </div>

        <button onClick={guardar} disabled={guardando} className="btn-primario text-sm">
          {guardando ? "Guardando..." : "Guardar"}
        </button>
        {mensaje && <span className="text-sm text-gray-500 ml-3">{mensaje}</span>}
      </div>

      <p className="text-xs text-gray-400">
        Nota: para imprimir, use el diálogo de impresión del navegador (Ctrl+P) y elija su
        impresora Epson. Si tiene un driver de "modo texto" o "borrador rápido" en las
        propiedades de la impresora, actívelo — así ahorra cinta e imprime más rápido.
      </p>
    </div>
  );
}
