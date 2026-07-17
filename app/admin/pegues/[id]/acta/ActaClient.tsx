"use client";

import { useState } from "react";
import Image from "next/image";
import { Printer, Plus, Trash2, Save } from "lucide-react";
import BotonAtras from "@/components/BotonAtras";
import { nombreMes } from "@/lib/mora";

export default function ActaClient({
  pegue,
  clausulasIniciales,
  firmantes,
  juntaNombre,
}: {
  pegue: any;
  clausulasIniciales: string[];
  firmantes: any[];
  juntaNombre: string;
}) {
  const [ubicacion, setUbicacion] = useState(pegue.ubicacion || "");
  const [guardandoUbicacion, setGuardandoUbicacion] = useState(false);
  const [clausulas, setClausulas] = useState<string[]>(clausulasIniciales);
  const [tamanoPapel, setTamanoPapel] = useState<"A4" | "CARTA">("A4");
  const [firmantesSel, setFirmantesSel] = useState<string[]>(firmantes.map((f: any) => f.id));
  const [mostrarImagenesFirma, setMostrarImagenesFirma] = useState(true);

  const totalCuota = pegue.cuotas.reduce((s: number, c: any) => s + c.monto, 0);
  const esContado = pegue.cuotas.length === 1;
  const todasPagadas = pegue.cuotas.every((c: any) => c.pagada);
  const cuotasPendientes = pegue.cuotas.filter((c: any) => !c.pagada).length;
  const fecha = new Date(pegue.createdAt);

  async function guardarUbicacion() {
    setGuardandoUbicacion(true);
    await fetch(`/api/pegues/${pegue.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ubicacion }),
    });
    setGuardandoUbicacion(false);
  }

  function actualizarClausula(i: number, valor: string) {
    setClausulas(clausulas.map((c, idx) => (idx === i ? valor : c)));
  }
  function agregarClausula() {
    setClausulas([...clausulas, ""]);
  }
  function quitarClausula(i: number) {
    setClausulas(clausulas.filter((_, idx) => idx !== i));
  }

  function toggleFirmante(id: string) {
    setFirmantesSel((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  const firmantesParaImprimir = firmantes.filter((f: any) => firmantesSel.includes(f.id));

  return (
    <div>
      <div className="no-imprimir max-w-2xl mx-auto mb-4">
        <BotonAtras href={`/admin/pegues/${pegue.id}`} />
        <h1 className="text-2xl font-bold text-azul mb-4">Acta de instalación — {pegue.codigo}</h1>

        <div className="card space-y-3 mb-4">
          <div>
            <label className="label">Ubicación donde se instaló (dirección o referencia)</label>
            <div className="flex gap-2">
              <input className="input" value={ubicacion} onChange={(e) => setUbicacion(e.target.value)} />
              <button onClick={guardarUbicacion} disabled={guardandoUbicacion} className="btn-outline text-sm flex items-center gap-1.5 whitespace-nowrap">
                <Save size={14} /> Guardar
              </button>
            </div>
          </div>

          <div>
            <label className="label">Cláusulas para esta acta</label>
            <div className="space-y-2">
              {clausulas.map((c, i) => (
                <div key={i} className="flex gap-2">
                  <textarea className="input text-sm" value={c} onChange={(e) => actualizarClausula(i, e.target.value)} />
                  <button onClick={() => quitarClausula(i)} className="text-red-500 shrink-0"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
            <button onClick={agregarClausula} className="btn-outline text-xs mt-2 flex items-center gap-1.5">
              <Plus size={14} /> Agregar cláusula
            </button>
            <p className="text-xs text-gray-400 mt-1">
              Estos cambios son solo para esta acta. Para cambiar las cláusulas por defecto, vaya a
              Configuración → Cláusulas del acta de instalación.
            </p>
          </div>

          <div>
            <label className="label">Tamaño de papel</label>
            <select className="input w-40" value={tamanoPapel} onChange={(e) => setTamanoPapel(e.target.value as any)}>
              <option value="A4">A4</option>
              <option value="CARTA">Carta</option>
            </select>
          </div>

          <div>
            <label className="label">Firmas a incluir</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {firmantes.map((f: any) => (
                <label key={f.id} className="flex items-center gap-1.5 text-sm bg-gray-50 border rounded-lg px-2 py-1">
                  <input type="checkbox" checked={firmantesSel.includes(f.id)} onChange={() => toggleFirmante(f.id)} />
                  {f.nombre || f.cargo}
                </label>
              ))}
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={mostrarImagenesFirma} onChange={(e) => setMostrarImagenesFirma(e.target.checked)} />
              Incluir imagen de firma escaneada
            </label>
          </div>

          <button onClick={() => window.print()} className="btn-primario text-sm flex items-center gap-1.5">
            <Printer size={14} /> Imprimir
          </button>
        </div>
      </div>

      <div
        className="nota-mora bg-white text-gray-900 mx-auto p-10"
        style={{
          width: tamanoPapel === "A4" ? "210mm" : "215.9mm",
          minHeight: tamanoPapel === "A4" ? "297mm" : "279.4mm",
          fontFamily: "Georgia, 'Times New Roman', serif",
        }}
      >
        <div className="flex items-center gap-4 border-b-2 border-azul pb-4 mb-6">
          <Image src="/sello.png" alt="Sello" width={72} height={72} />
          <div>
            <h1 className="text-2xl font-bold text-azul leading-tight">Acta de Instalación de Pegue</h1>
            <p className="text-sm text-gray-500">{juntaNombre}</p>
          </div>
        </div>

        <p className="text-xs font-bold text-azul uppercase mb-2">Datos generales</p>
        <table className="w-full text-sm mb-4">
          <tbody>
            <tr><td className="py-1 text-gray-500 w-48">Fecha de instalación</td><td className="py-1 font-medium">{fecha.toLocaleDateString("es-HN")}</td></tr>
            <tr><td className="py-1 text-gray-500">Código de pegue</td><td className="py-1 font-medium">{pegue.codigo}</td></tr>
            <tr><td className="py-1 text-gray-500">Abonado</td><td className="py-1 font-medium">{pegue.abonado.nombre}</td></tr>
            {pegue.abonado.identidad && <tr><td className="py-1 text-gray-500">Identidad</td><td className="py-1 font-medium">{pegue.abonado.identidad}</td></tr>}
            <tr><td className="py-1 text-gray-500">Barrio</td><td className="py-1 font-medium">{pegue.barrio.nombre}</td></tr>
            <tr><td className="py-1 text-gray-500">Ubicación</td><td className="py-1 font-medium">{ubicacion || "—"}</td></tr>
            <tr>
              <td className="py-1 text-gray-500">Servicios habilitados</td>
              <td className="py-1 font-medium">
                {pegue.servicios.filter((ps: any) => ps.habilitado).map((ps: any) => ps.servicio.nombre).join(", ") || "Ninguno"}
              </td>
            </tr>
          </tbody>
        </table>

        <p className="text-xs font-bold text-azul uppercase mb-2">Derecho de conexión</p>
        {pegue.cuotas.length === 0 ? (
          <p className="text-sm mb-4">No se cobró derecho de conexión por este pegue.</p>
        ) : (
          <div className="text-sm mb-4">
            <p>
              Costo total: <b>L {totalCuota.toFixed(2)}</b> — Forma de pago:{" "}
              <b>{esContado ? "De contado" : `En ${pegue.cuotas.length} cuotas`}</b>
            </p>
            {!esContado && (
              <table className="w-full text-sm mt-2 border border-gray-300">
                <thead>
                  <tr className="border-b border-gray-300 bg-azul/5">
                    <th className="text-left p-1">Cuota</th>
                    <th className="text-right p-1">Monto</th>
                    <th className="text-right p-1">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {pegue.cuotas.map((c: any) => (
                    <tr key={c.id} className="border-b border-gray-200">
                      <td className="p-1">{c.numero} de {c.totalCuotas}</td>
                      <td className="p-1 text-right">L {c.monto.toFixed(2)}</td>
                      <td className="p-1 text-right">{c.pagada ? "Pagada" : "Pendiente"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {!todasPagadas && (
              <p className="text-xs text-orange-600 mt-1">
                Quedan {cuotasPendientes} cuota(s) pendiente(s) al momento de generar esta acta.
              </p>
            )}
          </div>
        )}

        <p className="text-xs font-bold text-azul uppercase mb-2">Cláusulas</p>
        <ol className="text-sm list-decimal pl-5 mb-8 space-y-1.5">
          {clausulas.filter((c) => c.trim()).map((c, i) => (
            <li key={i}>{c}</li>
          ))}
        </ol>

        <p className="text-sm mb-10">
          El abonado declara haber leído y aceptado las condiciones anteriores para la instalación
          y uso de este pegue.
        </p>

        <div className="flex justify-between gap-6 mt-12">
          <div className="flex-1 text-center">
            <div className="h-12"></div>
            <div className="border-t border-gray-400 pt-1">
              <p className="text-sm font-semibold">{pegue.abonado.nombre}</p>
              <p className="text-xs text-gray-500">Firma del abonado</p>
            </div>
          </div>
          {firmantesParaImprimir.map((f: any) => (
            <div key={f.id} className="flex-1 text-center">
              <div className="h-12 flex items-end justify-center">
                {mostrarImagenesFirma && f.imagenBase64 && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={f.imagenBase64} alt={f.nombre} className="max-h-12 max-w-full object-contain" />
                )}
              </div>
              <div className="border-t border-gray-400 pt-1">
                <p className="text-sm font-semibold">{f.nombre}</p>
                <p className="text-xs text-gray-500">{f.cargo}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
