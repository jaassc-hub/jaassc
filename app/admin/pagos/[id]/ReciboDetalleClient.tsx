"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Trash2, Printer, Plus, X } from "lucide-react";
import BotonAtras from "@/components/BotonAtras";
import { nombreMes } from "@/lib/mora";

export default function ReciboDetalleClient({ pegue, recibo: reciboInicial }: { pegue: any; recibo: any[] }) {
  const router = useRouter();
  const [recibo, setRecibo] = useState(reciboInicial);
  const primero = recibo[0];

  const [metodoPago, setMetodoPago] = useState(primero.metodoPago);
  const [referencia, setReferencia] = useState(primero.referencia || "");
  const [observaciones, setObservaciones] = useState(primero.observaciones || "");
  const [fechaPago, setFechaPago] = useState(primero.fechaPago.slice(0, 10));
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [agregando, setAgregando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);
  const [quitandoId, setQuitandoId] = useState<string | null>(null);

  const totalRecibo = recibo.reduce((s, p) => s + p.total, 0);
  const numeroRecibo = primero.numeroRecibo;
  const loteId = primero.loteId;

  async function guardar() {
    setGuardando(true);
    setMensaje("");
    const res = await fetch(`/api/pagos/${primero.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ metodoPago, referencia, observaciones, fechaPago }),
    });
    setGuardando(false);
    setMensaje(res.ok ? "Guardado." : "Error al guardar.");
  }

  async function quitarMes(pagoId: string) {
    setQuitandoId(pagoId);
    setMensaje("");
    const res = await fetch(`/api/pagos/${pagoId}/mes`, { method: "DELETE" });
    setQuitandoId(null);
    if (res.ok) {
      router.refresh();
      setRecibo(recibo.filter((p) => p.id !== pagoId));
    } else {
      const data = await res.json();
      setMensaje(data.error || "Error al quitar el mes.");
    }
  }

  async function agregarMes() {
    setAgregando(true);
    setMensaje("");
    const res = await fetch(`/api/pagos/${primero.id}/agregar-mes`, { method: "POST" });
    setAgregando(false);
    if (res.ok) {
      router.refresh();
      setMensaje("Mes agregado. Actualizando...");
      setTimeout(() => window.location.reload(), 500);
    } else {
      const data = await res.json();
      setMensaje(data.error || "Error al agregar el mes.");
    }
  }

  async function eliminarRecibo() {
    setEliminando(true);
    const res = await fetch(`/api/pagos/${primero.id}`, { method: "DELETE" });
    setEliminando(false);
    if (res.ok) {
      router.push("/admin/pagos");
    } else {
      setMensaje("Error al eliminar.");
    }
  }

  return (
    <div className="max-w-lg">
      <BotonAtras href="/admin/pagos" />
      <h1 className="text-2xl font-bold text-azul mb-1">
        Recibo {numeroRecibo ? `#${numeroRecibo}` : ""}
      </h1>
      <p className="text-gray-500 mb-6">
        {pegue.codigo} · {pegue.abonado.nombre}
      </p>

      <div className="card space-y-4">
        <div>
          <p className="font-semibold text-azul mb-2">Meses incluidos en este recibo</p>
          <div className="divide-y border rounded-lg">
            {recibo.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-3 py-2 text-sm">
                <span>
                  {nombreMes(p.mesPagado)} {p.anioPagado}
                  {p.montoMora > 0 && ` · mora L${p.montoMora.toFixed(2)}`}
                </span>
                <div className="flex items-center gap-3">
                  <span className="font-medium">L {p.total.toFixed(2)}</span>
                  {recibo.length > 1 && (
                    <button
                      onClick={() => quitarMes(p.id)}
                      disabled={quitandoId === p.id}
                      title="Quitar este mes del recibo"
                      className="text-red-500"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={agregarMes}
            disabled={agregando}
            className="btn-outline text-xs mt-2 flex items-center gap-1.5"
          >
            <Plus size={14} /> {agregando ? "Agregando..." : "Agregar el siguiente mes pendiente a este recibo"}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm bg-gray-50 rounded-lg p-3">
          <div><p className="text-gray-400">Meses</p><p className="font-medium">{recibo.length}</p></div>
          <div><p className="text-gray-400">Total del recibo</p><p className="font-bold text-azul">L {totalRecibo.toFixed(2)}</p></div>
          {primero.emitidoPor && (
            <div className="col-span-2"><p className="text-gray-400">Emitido por</p><p className="font-medium">{primero.emitidoPor}</p></div>
          )}
        </div>

        <p className="text-xs text-gray-400">
          El mes/año y las tarifas no se editan aquí porque afectan el cálculo de mora. Use
          "Quitar este mes" o "Agregar mes" para corregir la cantidad de meses sin perder el
          número de recibo.
        </p>

        <div>
          <label className="label">Fecha real de pago</label>
          <input type="date" className="input" value={fechaPago} onChange={(e) => setFechaPago(e.target.value)} />
        </div>
        <div>
          <label className="label">Método de pago</label>
          <select className="input" value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)}>
            <option value="EFECTIVO">Efectivo</option>
            <option value="TRANSFERENCIA">Transferencia</option>
            <option value="DEPOSITO">Depósito bancario</option>
            <option value="OTRO">Otro</option>
          </select>
        </div>
        <div>
          <label className="label">Referencia</label>
          <input className="input" value={referencia} onChange={(e) => setReferencia(e.target.value)} />
        </div>
        <div>
          <label className="label">Observaciones</label>
          <input className="input" value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
        </div>

        {mensaje && <p className="text-sm text-gray-500">{mensaje}</p>}

        <div className="flex gap-2">
          <button onClick={guardar} disabled={guardando} className="btn-primario text-sm">
            {guardando ? "Guardando..." : "Guardar cambios"}
          </button>
          <Link
            href={loteId ? `/admin/recibo/lote/${loteId}` : `/admin/recibo/${primero.id}`}
            className="btn-outline text-sm flex items-center gap-1.5"
          >
            <Printer size={14} /> Ver recibo
          </Link>
        </div>

        <div className="border-t pt-3">
          {!confirmarEliminar ? (
            <button
              onClick={() => setConfirmarEliminar(true)}
              className="text-sm text-red-600 font-medium flex items-center gap-1.5"
            >
              <Trash2 size={14} /> Eliminar recibo completo
            </button>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700 mb-2">
                ¿Seguro? Se eliminarán los {recibo.length} mes(es) de este recibo y todos
                volverán a quedar pendientes para este pegue. Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-2">
                <button onClick={eliminarRecibo} disabled={eliminando} className="btn-primario text-sm bg-red-600 hover:bg-red-700">
                  {eliminando ? "Eliminando..." : "Sí, eliminar todo el recibo"}
                </button>
                <button onClick={() => setConfirmarEliminar(false)} className="btn-outline text-sm">
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
