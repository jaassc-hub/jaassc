"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NuevoAbonadoClient() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [identidad, setIdentidad] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setError("");
    const res = await fetch("/api/abonados", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, identidad, telefono, direccion }),
    });
    setGuardando(false);
    if (res.ok) {
      const abonado = await res.json();
      router.push(`/admin/abonados/detalle/${abonado.id}`);
    } else {
      const data = await res.json();
      setError(data.error || "Error al guardar");
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-azul mb-6">Nuevo abonado</h1>
      <form onSubmit={guardar} className="card space-y-4">
        <div>
          <label className="label">Nombre completo</label>
          <input className="input" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
        </div>
        <div>
          <label className="label">Número de identidad (opcional, pero muy recomendado)</label>
          <input
            className="input"
            value={identidad}
            onChange={(e) => setIdentidad(e.target.value)}
          />
          <p className="text-xs text-gray-400 mt-1">
            Se usará para que el abonado consulte su estado de cuenta en el portal público. Si
            no la tiene a mano ahora, puede dejarla vacía y agregarla después — el sistema se lo
            recordará.
          </p>
        </div>
        <div>
          <label className="label">Teléfono (opcional)</label>
          <input className="input" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
        </div>
        <div>
          <label className="label">Dirección (opcional)</label>
          <input className="input" value={direccion} onChange={(e) => setDireccion(e.target.value)} />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button disabled={guardando} className="btn-primario w-full">
          {guardando ? "Guardando..." : "Guardar abonado"}
        </button>
      </form>
    </div>
  );
}
