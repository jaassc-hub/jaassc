"use client";

import { useState } from "react";
import { Plus, Trash2, Upload } from "lucide-react";

type Firmante = {
  id: string;
  nombre: string;
  cargo: string;
  periodo: string;
  imagenBase64: string | null;
};

export default function FirmasClient({ configInicial }: { configInicial: { firmantes: Firmante[] } }) {
  const [firmantes, setFirmantes] = useState<Firmante[]>(configInicial.firmantes);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  function actualizar(id: string, campo: keyof Firmante, valor: string) {
    setFirmantes(firmantes.map((f) => (f.id === id ? { ...f, [campo]: valor } : f)));
  }

  function agregar() {
    setFirmantes([
      ...firmantes,
      { id: `f${Date.now()}`, nombre: "", cargo: "", periodo: "2025-2027", imagenBase64: null },
    ]);
  }

  function quitar(id: string) {
    setFirmantes(firmantes.filter((f) => f.id !== id));
  }

  function subirImagen(id: string, archivo: File) {
    if (archivo.size > 1024 * 1024) {
      setMensaje("La imagen es muy pesada (máximo 1 MB). Use una firma recortada y comprimida.");
      return;
    }
    const lector = new FileReader();
    lector.onload = () => {
      actualizar(id, "imagenBase64", lector.result as string);
    };
    lector.readAsDataURL(archivo);
  }

  async function guardar() {
    setGuardando(true);
    setMensaje("");
    const res = await fetch("/api/config/firmas", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firmantes }),
    });
    setGuardando(false);
    setMensaje(res.ok ? "Guardado." : "Error al guardar.");
  }

  return (
    <div className="max-w-2xl space-y-4">
      {firmantes.map((f) => (
        <div key={f.id} className="card space-y-3">
          <div className="flex items-start gap-4">
            <div className="w-32 h-20 border rounded-lg bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
              {f.imagenBase64 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={f.imagenBase64} alt="Firma" className="max-w-full max-h-full object-contain" />
              ) : (
                <span className="text-xs text-gray-400">Sin firma</span>
              )}
            </div>
            <div className="flex-1 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <input
                  className="input text-sm"
                  placeholder="Nombre completo"
                  value={f.nombre}
                  onChange={(e) => actualizar(f.id, "nombre", e.target.value)}
                />
                <input
                  className="input text-sm"
                  placeholder="Cargo (ej. Presidente)"
                  value={f.cargo}
                  onChange={(e) => actualizar(f.id, "cargo", e.target.value)}
                />
              </div>
              <input
                className="input text-sm w-40"
                placeholder="Período (ej. 2025-2027)"
                value={f.periodo}
                onChange={(e) => actualizar(f.id, "periodo", e.target.value)}
              />
              <div className="flex items-center gap-3">
                <label className="btn-outline text-xs cursor-pointer flex items-center gap-1.5 w-fit">
                  <Upload size={14} /> Subir firma PNG
                  <input
                    type="file"
                    accept="image/png"
                    className="hidden"
                    onChange={(e) => e.target.files && subirImagen(f.id, e.target.files[0])}
                  />
                </label>
                <button onClick={() => quitar(f.id)} className="text-red-500 text-xs flex items-center gap-1">
                  <Trash2 size={14} /> Quitar firmante
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}

      <button onClick={agregar} className="btn-outline text-sm flex items-center gap-1.5">
        <Plus size={14} /> Agregar firmante
      </button>

      <div className="flex items-center gap-3 pt-2">
        <button onClick={guardar} disabled={guardando} className="btn-primario text-sm">
          {guardando ? "Guardando..." : "Guardar"}
        </button>
        {mensaje && <span className="text-sm text-gray-500">{mensaje}</span>}
      </div>
    </div>
  );
}
