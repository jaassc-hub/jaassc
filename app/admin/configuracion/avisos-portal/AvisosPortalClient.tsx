"use client";

import { useState } from "react";
import { Plus, Trash2, ArrowUp, ArrowDown, Image as ImageIcon, Type } from "lucide-react";
import type { AvisoPortal } from "@/lib/avisosPortalConfig";

export default function AvisosPortalClient({ configInicial }: { configInicial: { avisos: AvisoPortal[] } }) {
  const [avisos, setAvisos] = useState<AvisoPortal[]>(
    [...configInicial.avisos].sort((a, b) => a.orden - b.orden)
  );
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  function agregar(tipo: "TEXTO" | "IMAGEN") {
    setAvisos([
      ...avisos,
      {
        id: `av${Date.now()}`,
        tipo,
        titulo: "",
        cuerpo: "",
        imagenUrl: "",
        enlaceUrl: "",
        activo: true,
        orden: avisos.length,
      },
    ]);
  }

  function actualizar(id: string, cambios: Partial<AvisoPortal>) {
    setAvisos(avisos.map((a) => (a.id === id ? { ...a, ...cambios } : a)));
  }

  function quitar(id: string) {
    setAvisos(avisos.filter((a) => a.id !== id));
  }

  function mover(id: string, dir: -1 | 1) {
    const idx = avisos.findIndex((a) => a.id === id);
    const nuevoIdx = idx + dir;
    if (nuevoIdx < 0 || nuevoIdx >= avisos.length) return;
    const copia = [...avisos];
    [copia[idx], copia[nuevoIdx]] = [copia[nuevoIdx], copia[idx]];
    setAvisos(copia.map((a, i) => ({ ...a, orden: i })));
  }

  async function guardar() {
    setGuardando(true);
    setMensaje("");
    const res = await fetch("/api/config/avisos-portal", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ avisos: avisos.map((a, i) => ({ ...a, orden: i })) }),
    });
    setGuardando(false);
    setMensaje(res.ok ? "Guardado." : "Error al guardar.");
  }

  return (
    <div className="max-w-2xl space-y-4">
      {avisos.map((a, i) => (
        <div key={a.id} className="card space-y-2">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-azul">
              {a.tipo === "IMAGEN" ? <ImageIcon size={14} /> : <Type size={14} />}
              {a.tipo === "IMAGEN" ? "Imagen" : "Texto"}
            </span>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 text-xs text-gray-500">
                <input type="checkbox" checked={a.activo} onChange={(e) => actualizar(a.id, { activo: e.target.checked })} />
                Activo
              </label>
              <button type="button" onClick={() => mover(a.id, -1)} disabled={i === 0} className="text-gray-400 disabled:opacity-30">
                <ArrowUp size={15} />
              </button>
              <button type="button" onClick={() => mover(a.id, 1)} disabled={i === avisos.length - 1} className="text-gray-400 disabled:opacity-30">
                <ArrowDown size={15} />
              </button>
              <button type="button" onClick={() => quitar(a.id)} className="text-red-500">
                <Trash2 size={15} />
              </button>
            </div>
          </div>

          <input
            className="input text-sm"
            placeholder="Título (ej: Próximo cobro)"
            value={a.titulo}
            onChange={(e) => actualizar(a.id, { titulo: e.target.value })}
          />

          {a.tipo === "TEXTO" ? (
            <textarea
              className="input text-sm"
              placeholder="Texto del aviso (ej: El próximo cobro será el 25 de agosto en el punto de siempre)"
              value={a.cuerpo}
              onChange={(e) => actualizar(a.id, { cuerpo: e.target.value })}
            />
          ) : (
            <input
              className="input text-sm"
              placeholder="Enlace de la imagen (ej: https://i.imgur.com/xxxxx.jpg)"
              value={a.imagenUrl}
              onChange={(e) => actualizar(a.id, { imagenUrl: e.target.value })}
            />
          )}

          <input
            className="input text-sm"
            placeholder="Enlace opcional (ej: https://facebook.com/...)"
            value={a.enlaceUrl}
            onChange={(e) => actualizar(a.id, { enlaceUrl: e.target.value })}
          />
        </div>
      ))}

      <div className="flex gap-2">
        <button type="button" onClick={() => agregar("TEXTO")} className="btn-outline text-sm flex items-center gap-1.5">
          <Plus size={14} /> Aviso de texto
        </button>
        <button type="button" onClick={() => agregar("IMAGEN")} className="btn-outline text-sm flex items-center gap-1.5">
          <Plus size={14} /> Aviso con imagen
        </button>
      </div>

      <div className="flex items-center gap-3 pt-2 border-t">
        <button type="button" onClick={guardar} disabled={guardando} className="btn-primario text-sm">
          {guardando ? "Guardando..." : "Guardar"}
        </button>
        {mensaje && <span className="text-sm text-gray-500">{mensaje}</span>}
      </div>
    </div>
  );
}
