"use client";

import { useState } from "react";

type Servicio = {
  id: string;
  nombre: string;
  precio: number;
  activo: boolean;
};

export default function ServiciosClient({
  serviciosIniciales,
}: {
  serviciosIniciales: Servicio[];
}) {
  const [servicios, setServicios] = useState(serviciosIniciales);
  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState("");
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [editPrecio, setEditPrecio] = useState("");
  const [guardando, setGuardando] = useState(false);

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre || !precio) return;
    setGuardando(true);
    const res = await fetch("/api/servicios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, precio }),
    });
    setGuardando(false);
    if (res.ok) {
      const nuevo = await res.json();
      setServicios([...servicios, nuevo].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      setNombre("");
      setPrecio("");
    }
  }

  function empezarEdicion(s: Servicio) {
    setEditandoId(s.id);
    setEditNombre(s.nombre);
    setEditPrecio(String(s.precio));
  }

  async function guardarEdicion(id: string) {
    const res = await fetch(`/api/servicios/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: editNombre, precio: editPrecio }),
    });
    if (res.ok) {
      const actualizado = await res.json();
      setServicios(servicios.map((s) => (s.id === id ? actualizado : s)));
      setEditandoId(null);
    }
  }

  async function toggleActivo(s: Servicio) {
    const res = await fetch(`/api/servicios/${s.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo: !s.activo }),
    });
    if (res.ok) {
      const actualizado = await res.json();
      setServicios(servicios.map((x) => (x.id === s.id ? actualizado : x)));
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <form onSubmit={crear} className="card flex flex-col md:flex-row gap-3 items-end">
        <div className="flex-1 w-full">
          <label className="label">Nombre del servicio</label>
          <input
            className="input"
            placeholder="Ej: Agua Potable"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
        </div>
        <div className="w-full md:w-40">
          <label className="label">Tarifa mensual (L)</label>
          <input
            type="number"
            step="0.01"
            className="input"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
          />
        </div>
        <button disabled={guardando} className="btn-primario whitespace-nowrap">
          + Agregar servicio
        </button>
      </form>

      <div className="card divide-y">
        {servicios.map((s) => (
          <div key={s.id} className="py-3 flex items-center justify-between gap-3">
            {editandoId === s.id ? (
              <div className="flex flex-1 flex-col md:flex-row gap-2">
                <input
                  className="input"
                  value={editNombre}
                  onChange={(e) => setEditNombre(e.target.value)}
                />
                <input
                  type="number"
                  step="0.01"
                  className="input md:w-32"
                  value={editPrecio}
                  onChange={(e) => setEditPrecio(e.target.value)}
                />
                <button
                  onClick={() => guardarEdicion(s.id)}
                  className="btn-primario text-sm"
                >
                  Guardar
                </button>
                <button
                  onClick={() => setEditandoId(null)}
                  className="btn-outline text-sm"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <>
                <div>
                  <p className="font-medium">{s.nombre}</p>
                  <p className="text-sm text-gray-500">L {s.precio.toFixed(2)} / mes</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={s.activo ? "badge-verde" : "badge-rojo"}>
                    {s.activo ? "Activo" : "Inactivo"}
                  </span>
                  <button
                    onClick={() => empezarEdicion(s)}
                    className="text-azul text-sm font-medium"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => toggleActivo(s)}
                    className="text-sm text-gray-500"
                  >
                    {s.activo ? "Desactivar" : "Activar"}
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
        {servicios.length === 0 && (
          <p className="text-gray-400 text-sm py-4">Aún no hay servicios registrados.</p>
        )}
      </div>
    </div>
  );
}
