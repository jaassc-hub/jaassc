"use client";

import { useState } from "react";
import { FUENTES_DISPONIBLES } from "@/components/NotaMora";
import { Upload } from "lucide-react";

export default function NotaMoraTextoClient({ configInicial }: { configInicial: any }) {
  const [config, setConfig] = useState(configInicial);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  function set(campo: string, valor: any) {
    setConfig({ ...config, [campo]: valor });
  }

  function subirLogo(archivo: File) {
    if (archivo.size > 1024 * 1024) {
      setMensaje("La imagen es muy pesada (máximo 1 MB).");
      return;
    }
    const lector = new FileReader();
    lector.onload = () => set("logoBase64", lector.result as string);
    lector.readAsDataURL(archivo);
  }

  async function guardar() {
    setGuardando(true);
    setMensaje("");
    const res = await fetch("/api/config/nota-mora", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    setGuardando(false);
    setMensaje(res.ok ? "Guardado." : "Error al guardar.");
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div className="card space-y-3">
        <div>
          <label className="label">Título</label>
          <input className="input" value={config.titulo} onChange={(e) => set("titulo", e.target.value)} />
        </div>
        <div>
          <label className="label">Subtítulo</label>
          <input className="input" value={config.subtitulo} onChange={(e) => set("subtitulo", e.target.value)} />
        </div>
        <div>
          <label className="label">Saludo</label>
          <input className="input" value={config.saludo} onChange={(e) => set("saludo", e.target.value)} />
        </div>
        <div>
          <label className="label">Párrafo de introducción</label>
          <textarea className="input min-h-[80px]" value={config.introduccion} onChange={(e) => set("introduccion", e.target.value)} />
        </div>
        <div>
          <label className="label">Párrafo del reglamento (corte por mora)</label>
          <textarea className="input min-h-[80px]" value={config.reglamento} onChange={(e) => set("reglamento", e.target.value)} />
        </div>
        <div>
          <label className="label">Párrafo de cierre 1</label>
          <textarea className="input min-h-[80px]" value={config.cierre1} onChange={(e) => set("cierre1", e.target.value)} />
        </div>
        <div>
          <label className="label">Párrafo de cierre 2</label>
          <textarea className="input min-h-[80px]" value={config.cierre2} onChange={(e) => set("cierre2", e.target.value)} />
        </div>
        <div>
          <label className="label">Pie de página (nombre y dirección)</label>
          <input className="input" value={config.piePagina} onChange={(e) => set("piePagina", e.target.value)} />
        </div>
        <div>
          <label className="label">Teléfonos</label>
          <input className="input" value={config.telefonos} onChange={(e) => set("telefonos", e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Reconexión por defecto (L)</label>
            <input type="number" className="input" value={config.montoReconexionDefault} onChange={(e) => set("montoReconexionDefault", parseFloat(e.target.value) || 0)} />
          </div>
          <div>
            <label className="label">A partir de cuántos meses se manda la nota</label>
            <input type="number" className="input" value={config.umbralMesesDefault} onChange={(e) => set("umbralMesesDefault", parseInt(e.target.value) || 1)} />
          </div>
        </div>
      </div>

      <div className="card space-y-3">
        <p className="font-semibold text-azul">Apariencia</p>
        <p className="text-sm text-gray-500">
          Estas opciones controlan cómo se ve la nota, sin tocar código — útiles si más
          adelante cambian el logo o los colores de la Junta.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Fuente</label>
            <select className="input" value={config.fuente || "GEORGIA"} onChange={(e) => set("fuente", e.target.value)}>
              {Object.keys(FUENTES_DISPONIBLES).map((k) => (
                <option key={k} value={k}>{k.charAt(0) + k.slice(1).toLowerCase()}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Estilo</label>
            <select className="input" value={config.estilo || "CLASICO"} onChange={(e) => set("estilo", e.target.value)}>
              <option value="CLASICO">Clásico (línea de color)</option>
              <option value="MINIMALISTA">Minimalista (sin color, ahorra tinta)</option>
              <option value="RECUADRO">Con recuadro completo</option>
            </select>
          </div>
        </div>

        <div>
          <label className="label">Color de acento</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              className="w-12 h-10 border rounded cursor-pointer"
              value={config.colorAcento || "#0F40BC"}
              onChange={(e) => set("colorAcento", e.target.value)}
            />
            <input
              className="input w-32"
              value={config.colorAcento || "#0F40BC"}
              onChange={(e) => set("colorAcento", e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="label">Logo de la nota (opcional, PNG)</label>
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 border rounded-lg bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
              {config.logoBase64 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={config.logoBase64} alt="Logo" className="max-w-full max-h-full object-contain" />
              ) : (
                <span className="text-[10px] text-gray-400 text-center px-1">Sello por defecto</span>
              )}
            </div>
            <label className="btn-outline text-xs cursor-pointer flex items-center gap-1.5 w-fit">
              <Upload size={14} /> Subir logo
              <input
                type="file"
                accept="image/png"
                className="hidden"
                onChange={(e) => e.target.files && subirLogo(e.target.files[0])}
              />
            </label>
            {config.logoBase64 && (
              <button type="button" onClick={() => set("logoBase64", null)} className="text-xs text-red-500">
                Quitar (usar sello por defecto)
              </button>
            )}
          </div>
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
