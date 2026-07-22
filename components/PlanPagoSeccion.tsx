"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Split } from "lucide-react";

export default function PlanPagoSeccion({ pegue, onActualizar }: { pegue: any; onActualizar: (planes: any[]) => void }) {
  const router = useRouter();
  const planActivo = (pegue.planesPago || []).find((p: any) => p.estado === "ACTIVO");

  const [mostrarPrevia, setMostrarPrevia] = useState(false);
  const [previa, setPrevia] = useState<any>(null);
  const [cargandoPrevia, setCargandoPrevia] = useState(false);
  const [creando, setCreando] = useState(false);
  const [error, setError] = useState("");
  const [cantidadCuotas, setCantidadCuotas] = useState(4);

  const [cuotaCobrando, setCuotaCobrando] = useState<string | null>(null);
  const [metodoPago, setMetodoPago] = useState("EFECTIVO");
  const [referencia, setReferencia] = useState("");
  const [guardandoCuota, setGuardandoCuota] = useState(false);

  async function verPrevia() {
    setMostrarPrevia(true);
    setCargandoPrevia(true);
    setError("");
    const res = await fetch(`/api/pegues/${pegue.id}/plan-pago?cuotas=${cantidadCuotas}`);
    setCargandoPrevia(false);
    if (res.ok) setPrevia(await res.json());
    else setError("No se pudo calcular la deuda de este pegue.");
  }

  async function cambiarCantidadCuotas(n: number) {
    setCantidadCuotas(n);
    setCargandoPrevia(true);
    const res = await fetch(`/api/pegues/${pegue.id}/plan-pago?cuotas=${n}`);
    setCargandoPrevia(false);
    if (res.ok) setPrevia(await res.json());
  }

  async function crearPlan() {
    setCreando(true);
    setError("");
    const res = await fetch(`/api/pegues/${pegue.id}/plan-pago`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cantidadCuotas }),
    });
    setCreando(false);
    if (res.ok) {
      const plan = await res.json();
      onActualizar([plan, ...(pegue.planesPago || [])]);
      setMostrarPrevia(false);
    } else {
      const data = await res.json();
      setError(data.error || "Error al crear el plan");
    }
  }

  async function cobrarCuota(cuotaId: string) {
    setGuardandoCuota(true);
    const res = await fetch(`/api/planes-pago/cuotas/${cuotaId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ metodoPago, referencia }),
    });
    setGuardandoCuota(false);
    if (res.ok) {
      router.push(`/admin/recibo/plan/${cuotaId}`);
    }
  }

  if (!planActivo && !mostrarPrevia) {
    return (
      <div className="card flex items-center justify-between">
        <div>
          <p className="font-semibold text-azul">Plan de pagos</p>
          <p className="text-sm text-gray-500">
            Si la deuda de este pegue es grande, se puede dividir en 4 cuotas.
          </p>
        </div>
        <button type="button" onClick={verPrevia} className="btn-outline text-sm flex items-center gap-1.5">
          <Split size={14} /> Revisar / crear plan
        </button>
      </div>
    );
  }

  if (!planActivo && mostrarPrevia) {
    return (
      <div className="card space-y-3">
        <p className="font-semibold text-azul">Dividir deuda en un plan de pagos</p>
        {cargandoPrevia && <p className="text-gray-400 text-sm">Calculando...</p>}
        {error && <p className="text-red-600 text-sm">{error}</p>}
        {previa && !previa.califica && (
          <p className="text-sm text-orange-600">
            La deuda actual (L{previa.deudaOriginal.toFixed(2)}) es menor a L{previa.montoMinimo}, el mínimo para
            poder dividirla en un plan de pagos.
          </p>
        )}
        {previa && previa.califica && (
          <>
            <div>
              <label className="label">¿En cuántas cuotas? (máximo {previa.cuotasMaximo})</label>
              <select
                className="input w-32"
                value={cantidadCuotas}
                onChange={(e) => cambiarCantidadCuotas(parseInt(e.target.value))}
              >
                {Array.from({ length: previa.cuotasMaximo }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <table className="w-full text-sm">
              <tbody>
                <tr><td className="py-1 text-gray-500">Deuda actual (capital)</td><td className="py-1 text-right">L {previa.deudaOriginal.toFixed(2)}</td></tr>
                <tr><td className="py-1 text-gray-500">Mora ya generada</td><td className="py-1 text-right">L {previa.moraOriginal.toFixed(2)}</td></tr>
                <tr><td className="py-1 text-gray-500">Tarifa mensual actual</td><td className="py-1 text-right">L {previa.montoServicios.toFixed(2)}</td></tr>
                <tr className="font-bold border-t"><td className="py-1">Cuota mensual (x{previa.cantidadCuotas})</td><td className="py-1 text-right">L {previa.montoCuota.toFixed(2)}</td></tr>
                <tr className="font-bold"><td className="py-1">Total del plan</td><td className="py-1 text-right">L {previa.totalPlan.toFixed(2)}</td></tr>
              </tbody>
            </table>
            <p className="text-xs text-gray-400">
              Cada una de las {previa.cantidadCuotas} cuotas incluye una parte de la deuda vieja, la tarifa del mes
              que va corriendo, y una parte de la mora — para que al terminar el plan la cuenta quede al día.
            </p>
            <div className="flex gap-2">
              <button type="button" onClick={crearPlan} disabled={creando} className="btn-primario text-sm">
                {creando ? "Creando..." : "Crear plan de pagos"}
              </button>
              <button type="button" onClick={() => setMostrarPrevia(false)} className="btn-outline text-sm">
                Cancelar
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  const cuotasPagadas = planActivo.cuotas.filter((c: any) => c.pagada).length;
  const totalPagado = planActivo.cuotas.filter((c: any) => c.pagada).reduce((s: number, c: any) => s + c.monto, 0);
  const totalPlan = planActivo.montoCuota * planActivo.cantidadCuotas;

  return (
    <div className="card">
      <p className="font-semibold text-azul mb-1">Plan de pagos activo</p>
      <p className="text-sm text-gray-500 mb-3">
        {cuotasPagadas} de {planActivo.cantidadCuotas} cuotas pagadas · L {totalPagado.toFixed(2)} de L {totalPlan.toFixed(2)}
      </p>
      <div className="divide-y border rounded-lg">
        {planActivo.cuotas.map((c: any) => (
          <div key={c.id} className="px-3 py-2">
            <div className="flex items-center justify-between text-sm">
              <span>Cuota {c.numero} — {c.mesEtiqueta}</span>
              <div className="flex items-center gap-2">
                <span className="font-medium">L {c.monto.toFixed(2)}</span>
                {c.pagada ? (
                  <span className="badge-verde">Pagada</span>
                ) : cuotaCobrando === c.id ? null : (
                  <button type="button" onClick={() => setCuotaCobrando(c.id)} className="btn-outline text-xs">
                    Cobrar
                  </button>
                )}
              </div>
            </div>
            {cuotaCobrando === c.id && (
              <div className="mt-2 bg-gray-50 border rounded-lg p-3 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <select className="input text-sm" value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)}>
                    <option value="EFECTIVO">Efectivo</option>
                    <option value="TRANSFERENCIA">Transferencia</option>
                    <option value="DEPOSITO">Depósito bancario</option>
                    <option value="OTRO">Otro</option>
                  </select>
                  <input className="input text-sm" placeholder="Referencia (opcional)" value={referencia} onChange={(e) => setReferencia(e.target.value)} />
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => cobrarCuota(c.id)} disabled={guardandoCuota} className="btn-primario text-xs">
                    {guardandoCuota ? "Guardando..." : `Confirmar cobro de L ${c.monto.toFixed(2)}`}
                  </button>
                  <button type="button" onClick={() => setCuotaCobrando(null)} className="btn-outline text-xs">
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
