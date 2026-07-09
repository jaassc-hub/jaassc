"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

type Tramo = { id: string; mesesDesde: number; mesesHasta: number; porcentaje: number };

export default function MoraClient({ configInicial }: { configInicial: { tramos: Tramo[] } }) {
  const [tramos, setTramos] = useState<Tramo[]>(configInicial.tramos);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  function actualizarTramo(id: string, campo: keyof Tramo, valor: number) {
    setTramos(tramos.map((t) => (t.id === id ? { ...t, [campo]: valor } : t)));
  }

  function agregarTramo() {
    const ultimo = tramos[tramos.length - 1];
    const desde = ultimo ? ultimo.mesesHasta + 1 : 1;
    setTramos([
      ...tramos,
      { id: `t${Date.now()}`, mesesDesde: desde, mesesHasta: desde + 2, porcentaje: 10 },
    ]);
  }

  function quitarTramo(id: string) {
    setTramos(tramos.filter((t) => t.id !== id));
  }

  async function guardar() {
    setGuardando(true);
    setMensaje("");
    const res = await fetch("/api/config/mora", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tramos }),
    });
    setGuardando(false);
    setMensaje(res.ok ? "Guardado." : "Error al guardar.");
  }

  return (
    <div className="max-w-xl space-y-4">
      <div className="card space-y-3">
        <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 text-xs text-gray-400 font-medium px-1">
          <span>Desde (meses)</span>
          <span>Hasta (meses)</span>
          <span>Porcentaje (%)</span>
          <span></span>
        </div>
        {tramos.map((t) => (
          <div key={t.id} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center">
            <input
              type="number"
              className="input"
              value={t.mesesDesde}
              onChange={(e) => actualizarTramo(t.id, "mesesDesde", parseInt(e.target.value) || 0)}
            />
            <input
              type="number"
              className="input"
              value={t.mesesHasta}
              onChange={(e) => actualizarTramo(t.id, "mesesHasta", parseInt(e.target.value) || 0)}
            />
            <input
              type="number"
              step="0.5"
              className="input"
              value={t.porcentaje}
              onChange={(e) => actualizarTramo(t.id, "porcentaje", parseFloat(e.target.value) || 0)}
            />
            <button onClick={() => quitarTramo(t.id)} className="text-red-500">
              <Trash2 size={16} />
            </button>
          </div>
        ))}

        <button onClick={agregarTramo} className="btn-outline text-sm flex items-center gap-1.5 w-fit">
          <Plus size={14} /> Agregar tramo
        </button>

        <div className="flex items-center gap-3 pt-2 border-t">
          <button onClick={guardar} disabled={guardando} className="btn-primario text-sm">
            {guardando ? "Guardando..." : "Guardar"}
          </button>
          {mensaje && <span className="text-sm text-gray-500">{mensaje}</span>}
        </div>
      </div>

      <p className="text-xs text-gray-400">
        Ejemplo: si un abonado debe L700 (7 meses a L100) y el tramo de 7 a 9 meses tiene
        10%, la mora de ese recibo será L70 — se cobra una sola vez, no por cada mes.
      </p>
    </div>
  );
}
