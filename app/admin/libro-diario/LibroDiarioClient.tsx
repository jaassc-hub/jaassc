"use client";

import { useState, useEffect } from "react";
import { Printer, BookOpen } from "lucide-react";
import Image from "next/image";

const MESES_CORTOS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export default function LibroDiarioClient({
  barrios,
  juntaNombre,
}: {
  barrios: { id: string; nombre: string }[];
  juntaNombre: string;
}) {
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [barrioId, setBarrioId] = useState("");
  const [tamanoPapel, setTamanoPapel] = useState<"A4" | "CARTA">("A4");
  const [orientacion, setOrientacion] = useState<"horizontal" | "vertical">("horizontal");
  const [filas, setFilas] = useState<any[] | null>(null);
  const [cargando, setCargando] = useState(false);
  const [filtro, setFiltro] = useState<"TODOS" | "CORTADOS" | "INHABILITADOS" | "MORA">("TODOS");

  async function cargar() {
    setCargando(true);
    const params = new URLSearchParams({ anio: String(anio) });
    if (barrioId) params.set("barrioId", barrioId);
    const res = await fetch(`/api/libro-diario?${params.toString()}`);
    const data = await res.json();
    setCargando(false);
    setFilas(data.filas);
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const barrioNombre = barrios.find((b) => b.id === barrioId)?.nombre || "Todos los barrios";

  const filasFiltradas = (filas || []).filter((f) => {
    if (filtro === "CORTADOS") return f.meses.some((m: any) => m.cortado);
    if (filtro === "INHABILITADOS") return f.estado === "INACTIVO";
    if (filtro === "MORA") return f.mesesMora > 0;
    return true;
  });

  return (
    <div>
      <div className="no-imprimir">
        <div className="flex items-center gap-3 mb-1">
          <div className="bg-azul text-white rounded-xl p-3">
            <BookOpen size={24} strokeWidth={1.8} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-azul">Libro diario de pagos</h1>
            <p className="text-gray-500 text-sm">Control de meses pagados por abonado, para imprimir y archivar.</p>
          </div>
        </div>

        <div className="card max-w-3xl mt-6 flex flex-wrap items-end gap-3">
          <div>
            <label className="label">Año</label>
            <input type="number" className="input w-28" value={anio} onChange={(e) => setAnio(parseInt(e.target.value) || anio)} />
          </div>
          <div>
            <label className="label">Barrio</label>
            <select className="input w-48" value={barrioId} onChange={(e) => setBarrioId(e.target.value)}>
              <option value="">Todos los barrios</option>
              {barrios.map((b) => (
                <option key={b.id} value={b.id}>{b.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Tamaño de papel</label>
            <select className="input w-32" value={tamanoPapel} onChange={(e) => setTamanoPapel(e.target.value as any)}>
              <option value="A4">A4</option>
              <option value="CARTA">Carta</option>
            </select>
          </div>
          <div>
            <label className="label">Orientación</label>
            <select className="input w-32" value={orientacion} onChange={(e) => setOrientacion(e.target.value as any)}>
              <option value="horizontal">Horizontal</option>
              <option value="vertical">Vertical</option>
            </select>
          </div>
          <div>
            <label className="label">Mostrar</label>
            <select className="input w-40" value={filtro} onChange={(e) => setFiltro(e.target.value as any)}>
              <option value="TODOS">Todos</option>
              <option value="CORTADOS">Solo cortados</option>
              <option value="INHABILITADOS">Solo inhabilitados</option>
              <option value="MORA">Solo en mora</option>
            </select>
          </div>
          <button type="button" onClick={cargar} disabled={cargando} className="btn-outline text-sm">
            {cargando ? "Cargando..." : "Actualizar"}
          </button>
          <button type="button" onClick={() => window.print()} className="btn-primario text-sm flex items-center gap-1.5">
            <Printer size={14} /> Imprimir
          </button>
        </div>
      </div>

      {filas && (
        <>
          <style>{`
            @media print {
              @page { size: ${tamanoPapel === "A4" ? "A4" : "letter"} ${orientacion === "horizontal" ? "landscape" : "portrait"}; margin: 8mm; }
            }
          `}</style>
          <div
          className="libro-diario bg-white mx-auto mt-6 p-8"
          style={{
            width: orientacion === "horizontal"
              ? (tamanoPapel === "A4" ? "297mm" : "279.4mm")
              : (tamanoPapel === "A4" ? "210mm" : "215.9mm"),
          }}
        >
          <div className="flex items-center gap-3 border-b-2 border-azul pb-3 mb-4">
            <Image src="/logo.png" alt="Logo" width={48} height={48} />
            <div>
              <p className="font-bold text-azul text-lg">{juntaNombre}</p>
              <p className="text-sm text-gray-500">
                Libro de control de pagos — {barrioNombre} — {anio}
              </p>
            </div>
          </div>

          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-azul text-white">
                <th className="border border-azul/50 p-1 text-left">Código</th>
                <th className="border border-azul/50 p-1 text-left">Nombre</th>
                <th className="border border-azul/50 p-1 text-left">Servicios</th>
                <th className="border border-azul/50 p-1 text-right">Tarifa</th>
                {MESES_CORTOS.map((m) => (
                  <th key={m} className="border border-azul/50 p-1 w-9">{m}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filasFiltradas.map((f) => (
                <tr key={f.codigo} className={f.estado !== "ACTIVO" ? "bg-gray-50 text-gray-400" : ""}>
                  <td className="border border-gray-300 p-1 font-medium">{f.codigo}</td>
                  <td className="border border-gray-300 p-1">{f.nombre}</td>
                  <td className="border border-gray-300 p-1">{f.servicios}</td>
                  <td className="border border-gray-300 p-1 text-right">L {f.tarifa.toFixed(2)}</td>
                  {f.meses.map((m: { pagado: boolean; cortado: boolean; inhabilitado: boolean }, i: number) => {
                    let clase = "";
                    let simbolo = "";
                    let titulo = "";
                    if (m.cortado) {
                      clase = "bg-red-100 text-red-700 font-bold";
                      simbolo = "C";
                      titulo = "Cortado este mes";
                    } else if (m.inhabilitado) {
                      clase = "bg-yellow-100 text-yellow-700 font-bold";
                      simbolo = "I";
                      titulo = "Inhabilitado este mes";
                    } else if (m.pagado) {
                      clase = "bg-green-100 font-bold text-green-700";
                      simbolo = "✓";
                      titulo = "Pagado";
                    }
                    return (
                      <td key={i} className={`border border-gray-300 p-1 text-center ${clase}`} title={titulo}>
                        {simbolo}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {filasFiltradas.length === 0 && (
                <tr>
                  <td colSpan={16} className="text-center text-gray-400 py-4">Sin abonados que cumplan este filtro.</td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 bg-green-100 border border-green-300"></span> Pagado</span>
            <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 bg-red-100 border border-red-300"></span> Cortado (C)</span>
            <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 bg-yellow-100 border border-yellow-300"></span> Inhabilitado</span>
          </div>

          <p className="text-xs text-gray-400 mt-4">
            Generado el {new Date().toLocaleDateString("es-HN")} · {filasFiltradas.length} pegue(s)
          </p>
          </div>
        </>
      )}
    </div>
  );
}
