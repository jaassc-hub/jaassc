"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Printer, Search, Plus } from "lucide-react";
import { nombreMes } from "@/lib/mora";

export default function PagosClient({
  recibos,
  mesInicial,
  anioInicial,
  qInicial,
}: {
  recibos: any[];
  mesInicial?: number;
  anioInicial: number;
  qInicial: string;
}) {
  const [q, setQ] = useState(qInicial);

  const filtrados = useMemo(() => {
    if (!q.trim()) return recibos;
    const s = q.trim().toLowerCase();
    return recibos.filter(
      (r) =>
        r.numeroRecibo.toLowerCase().includes(s) ||
        r.pegueCodigo.toLowerCase().includes(s) ||
        r.abonadoNombre.toLowerCase().includes(s) ||
        (r.abonadoIdentidad || "").toLowerCase().includes(s)
    );
  }, [q, recibos]);

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
        <form className="flex gap-2 flex-wrap">
          <select name="mes" defaultValue={mesInicial || ""} className="input w-auto">
            <option value="">Todos los meses</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>{nombreMes(m)}</option>
            ))}
          </select>
          <input name="anio" type="number" defaultValue={anioInicial} className="input w-28" />
          <button className="btn-outline text-sm">Filtrar</button>
        </form>
        <Link href="/admin/pagos/nuevo" className="btn-primario text-sm flex items-center gap-1.5 whitespace-nowrap">
          <Plus size={16} /> Registrar pago
        </Link>
      </div>

      <div className="relative mb-4 max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="input pl-9"
          placeholder="Buscar por correlativo, código de pegue o abonado..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="pb-2 pr-3">Recibo #</th>
              <th className="pb-2 pr-3">Fecha</th>
              <th className="pb-2 pr-3">Pegue</th>
              <th className="pb-2 pr-3">Abonado</th>
              <th className="pb-2 pr-3">Mes(es) pagado(s)</th>
              <th className="pb-2 pr-3">Método</th>
              <th className="pb-2 pr-3 text-right">Total</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((r) => (
              <tr key={r.clave} className="border-b last:border-0">
                <td className="py-2 pr-3 font-medium">{r.numeroRecibo}</td>
                <td className="py-2 pr-3">{new Date(r.fecha).toLocaleDateString("es-HN")}</td>
                <td className="py-2 pr-3 font-medium">{r.pegueCodigo}</td>
                <td className="py-2 pr-3">{r.abonadoNombre}</td>
                <td className="py-2 pr-3">{r.meses}</td>
                <td className="py-2 pr-3">{r.metodoPago}</td>
                <td className="py-2 pr-3 text-right font-semibold">L {r.total.toFixed(2)}</td>
                <td className="py-2 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <Link
                      href={r.loteId ? `/admin/recibo/lote/${r.loteId}` : `/admin/recibo/${r.pagoId}`}
                      target="_blank"
                      title="Imprimir recibo"
                      className="text-azul"
                    >
                      <Printer size={16} />
                    </Link>
                    <Link href={`/admin/pagos/${r.pagoId}`} className="text-azul text-xs font-medium">
                      Detalle
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
            {filtrados.length === 0 && (
              <tr><td colSpan={8} className="text-gray-400 py-6 text-center">Sin pagos que coincidan.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
