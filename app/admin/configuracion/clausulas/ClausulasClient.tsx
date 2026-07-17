"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

export default function ClausulasClient({ configInicial }: { configInicial: { clausulas: string[] } }) {
  const [clausulas, setClausulas] = useState<string[]>(configInicial.clausulas);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  function actualizar(i: number, valor: string) {
    setClausulas(clausulas.map((c, idx) => (idx === i ? valor : c)));
  }
  function agregar() {
    setClausulas([...clausulas, ""]);
  }
  function quitar(i: number) {
    setClausulas(clausulas.filter((_, idx) => idx !== i));
  }

  async function guardar() {
    setGuardando(true);
    setMensaje("");
    const res = await fetch("/api/config/clausulas", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clausulas }),
    });
    setGuardando(false);
    setMensaje(res.ok ? "Guardado." : "Error al guardar.");
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div className="card space-y-3">
        {clausulas.map((c, i) => (
          <div key={i} className="flex gap-2">
            <span className="text-sm text-gray-400 pt-2 w-5">{i + 1}.</span>
            <textarea
              className="input text-sm flex-1"
              value={c}
              onChange={(e) => actualizar(i, e.target.value)}
            />
            <button onClick={() => quitar(i)} className="text-red-500 shrink-0 pt-2">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        <button onClick={agregar} className="btn-outline text-xs flex items-center gap-1.5">
          <Plus size={14} /> Agregar cláusula
        </button>
        <div className="flex items-center gap-3 pt-2 border-t">
          <button onClick={guardar} disabled={guardando} className="btn-primario text-sm">
            {guardando ? "Guardando..." : "Guardar"}
          </button>
          {mensaje && <span className="text-sm text-gray-500">{mensaje}</span>}
        </div>
      </div>
    </div>
  );
}
