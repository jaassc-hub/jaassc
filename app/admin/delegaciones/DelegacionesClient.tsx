"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { UserCog, CheckCircle2 } from "lucide-react";

const NOMBRE_TIPO: Record<string, string> = {
  COBRO_CUOTA: "Cobrar cuota de conexión",
  CORTE_MORA: "Dar seguimiento a corte por mora",
};

export default function DelegacionesClient({ usuarioActualId }: { usuarioActualId: string }) {
  const [vista, setVista] = useState<"mias" | "todas">("mias");
  const [incluirResueltas, setIncluirResueltas] = useState(false);
  const [delegaciones, setDelegaciones] = useState<any[] | null>(null);
  const [cargando, setCargando] = useState(true);
  const [resolviendo, setResolviendo] = useState<string | null>(null);

  async function cargar() {
    setCargando(true);
    const params = new URLSearchParams();
    if (vista === "mias") params.set("mias", "true");
    if (incluirResueltas) params.set("resueltas", "true");
    const res = await fetch(`/api/delegaciones?${params.toString()}`);
    if (res.ok) setDelegaciones(await res.json());
    setCargando(false);
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vista, incluirResueltas]);

  async function resolver(id: string) {
    setResolviendo(id);
    const res = await fetch(`/api/delegaciones/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    setResolviendo(null);
    if (res.ok) cargar();
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-azul text-white rounded-xl p-3">
          <UserCog size={24} strokeWidth={1.8} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-azul">Delegaciones</h1>
          <p className="text-gray-500 text-sm">Casos puntuales asignados a alguien en concreto.</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <button type="button" onClick={() => setVista("mias")} className={vista === "mias" ? "btn-primario text-sm" : "btn-outline text-sm"}>
          Asignadas a mí
        </button>
        <button type="button" onClick={() => setVista("todas")} className={vista === "todas" ? "btn-primario text-sm" : "btn-outline text-sm"}>
          Todas
        </button>
        <label className="flex items-center gap-1.5 text-sm text-gray-500">
          <input type="checkbox" checked={incluirResueltas} onChange={(e) => setIncluirResueltas(e.target.checked)} />
          Incluir resueltas
        </label>
      </div>

      {cargando && <p className="text-gray-400">Cargando...</p>}

      {!cargando && delegaciones && delegaciones.length === 0 && (
        <div className="card text-center py-8 text-gray-400">No hay delegaciones pendientes.</div>
      )}

      {!cargando && delegaciones && delegaciones.length > 0 && (
        <div className="card divide-y">
          {delegaciones.map((d) => (
            <div key={d.id} className="py-3 flex items-center justify-between flex-wrap gap-2">
              <div>
                <p className="font-medium">
                  {NOMBRE_TIPO[d.tipo] || d.tipo} — {d.pegue.codigo} ({d.pegue.abonado.nombre})
                </p>
                <p className="text-xs text-gray-500">
                  {d.pegue.barrio.nombre} · asignado a <b>{d.asignadoA.nombre || d.asignadoA.username}</b>
                  {d.asignadoPor && ` por ${d.asignadoPor}`}
                  {d.nota && ` · "${d.nota}"`}
                </p>
                {d.resuelto && (
                  <p className="text-xs text-green-600 flex items-center gap-1 mt-0.5">
                    <CheckCircle2 size={12} /> Resuelto
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Link href={`/admin/pegues/${d.pegueId}`} className="btn-outline text-xs">
                  Ver pegue
                </Link>
                {!d.resuelto && (
                  <button
                    type="button"
                    onClick={() => resolver(d.id)}
                    disabled={resolviendo === d.id}
                    className="btn-primario text-xs"
                  >
                    {resolviendo === d.id ? "Guardando..." : "Marcar resuelto"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
