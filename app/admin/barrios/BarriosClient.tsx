"use client";

import { useState } from "react";

type Barrio = {
  id: string;
  nombre: string;
  prefijo: string;
  ultimoNum: number;
  _count: { pegues: number };
};

export default function BarriosClient({
  barriosIniciales,
}: {
  barriosIniciales: Barrio[];
}) {
  const [barrios, setBarrios] = useState(barriosIniciales);
  const [nombre, setNombre] = useState("");
  const [prefijo, setPrefijo] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editNum, setEditNum] = useState("");

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre || !prefijo) return;
    const res = await fetch("/api/barrios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, prefijo }),
    });
    if (res.ok) {
      const nuevo = await res.json();
      setBarrios([...barrios, { ...nuevo, _count: { pegues: 0 } }]);
      setNombre("");
      setPrefijo("");
    }
  }

  async function guardarCorrelativo(id: string) {
    const res = await fetch(`/api/barrios/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ultimoNum: editNum }),
    });
    if (res.ok) {
      const actualizado = await res.json();
      setBarrios(
        barrios.map((b) => (b.id === id ? { ...actualizado, _count: b._count } : b))
      );
      setEditId(null);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <form onSubmit={crear} className="card flex flex-col md:flex-row gap-3 items-end">
        <div className="flex-1 w-full">
          <label className="label">Nombre del barrio</label>
          <input
            className="input"
            placeholder="Ej: Nueva Esperanza"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
        </div>
        <div className="w-full md:w-32">
          <label className="label">Prefijo</label>
          <input
            className="input uppercase"
            placeholder="Ej: NES"
            maxLength={5}
            value={prefijo}
            onChange={(e) => setPrefijo(e.target.value.toUpperCase())}
          />
        </div>
        <button className="btn-primario whitespace-nowrap">+ Agregar barrio</button>
      </form>

      <div className="card divide-y">
        {barrios.map((b) => (
          <div key={b.id} className="py-3 flex items-center justify-between gap-3">
            <div>
              <p className="font-medium">
                {b.nombre} <span className="text-gray-400">({b.prefijo})</span>
              </p>
              <p className="text-sm text-gray-500">
                {b._count.pegues} pegues registrados · próximo código:{" "}
                <b>
                  {b.prefijo}
                  {String(b.ultimoNum + 1).padStart(3, "0")}
                </b>
              </p>
            </div>

            {editId === b.id ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  className="input w-24"
                  value={editNum}
                  onChange={(e) => setEditNum(e.target.value)}
                />
                <button
                  onClick={() => guardarCorrelativo(b.id)}
                  className="btn-primario text-sm"
                >
                  Guardar
                </button>
                <button onClick={() => setEditId(null)} className="btn-outline text-sm">
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setEditId(b.id);
                  setEditNum(String(b.ultimoNum));
                }}
                className="text-azul text-sm font-medium"
              >
                Corregir correlativo
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
