"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Wallet, History, Pencil, Ban, PauseCircle, PlayCircle, FileSignature } from "lucide-react";
import BotonAtras from "@/components/BotonAtras";
import { nombreMes } from "@/lib/mora";

type Servicio = { id: string; nombre: string; precio: number };
type Barrio = { id: string; nombre: string; prefijo: string };

const badgeEstado: Record<string, string> = {
  ACTIVO: "badge-verde",
  CORTADO: "badge-rojo",
  INACTIVO: "badge-naranja",
};
const nombreEstado: Record<string, string> = {
  ACTIVO: "Activo",
  CORTADO: "Cortado",
  INACTIVO: "Inhabilitado",
};

export default function PegueDetalleClient({
  pegueInicial,
  barrios,
  servicios,
  estadoCuenta,
}: {
  pegueInicial: any;
  barrios: Barrio[];
  servicios: Servicio[];
  estadoCuenta: {
    montoServicios: number;
    pendiente: { mes: number; anio: number };
    mesesMora: number;
    montoMora: number;
    corte: boolean;
    totalEstimado: number;
  };
}) {
  const router = useRouter();
  const [pegue, setPegue] = useState(pegueInicial);
  const [editando, setEditando] = useState(false);
  const [codigo, setCodigo] = useState(pegue.codigo);
  const [barrioId, setBarrioId] = useState(pegue.barrioId);
  const [serviciosSel, setServiciosSel] = useState<string[]>(
    pegue.servicios.filter((ps: any) => ps.habilitado).map((ps: any) => ps.servicioId)
  );
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  function toggleServicio(id: string) {
    setServiciosSel((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function guardarEdicion() {
    setGuardando(true);
    setError("");
    const res = await fetch(`/api/pegues/${pegue.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ codigo, barrioId, servicioIds: serviciosSel }),
    });
    setGuardando(false);
    if (res.ok) {
      const actualizado = await res.json();
      setPegue({ ...pegue, ...actualizado });
      setEditando(false);
    } else {
      const data = await res.json();
      setError(data.error || "Error al guardar");
    }
  }

  const [estadoPendiente, setEstadoPendiente] = useState<string | null>(null);
  const [motivoEstado, setMotivoEstado] = useState("");
  const [guardandoEstado, setGuardandoEstado] = useState(false);
  const [errorEstado, setErrorEstado] = useState("");

  async function confirmarCambioEstado() {
    if (!motivoEstado.trim()) {
      setErrorEstado("Escriba un motivo para este cambio.");
      return;
    }
    setGuardandoEstado(true);
    setErrorEstado("");
    const res = await fetch(`/api/pegues/${pegue.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado: estadoPendiente, motivo: motivoEstado }),
    });
    setGuardandoEstado(false);
    if (res.ok) {
      const actualizado = await res.json();
      setPegue({ ...pegue, ...actualizado });
      setEstadoPendiente(null);
      setMotivoEstado("");
    } else {
      const data = await res.json();
      setErrorEstado(data.error || "Error al guardar");
    }
  }

  // --- Cuotas de conexion ---
  const [cuotaCobrando, setCuotaCobrando] = useState<string | null>(null);
  const [metodoPagoCuota, setMetodoPagoCuota] = useState("EFECTIVO");
  const [referenciaCuota, setReferenciaCuota] = useState("");
  const [guardandoCuota, setGuardandoCuota] = useState(false);

  async function cobrarCuota(cuotaId: string) {
    setGuardandoCuota(true);
    const res = await fetch(`/api/cuotas/${cuotaId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ metodoPago: metodoPagoCuota, referencia: referenciaCuota }),
    });
    setGuardandoCuota(false);
    if (res.ok) {
      router.push(`/admin/recibo/cuota/${cuotaId}`);
    }
  }

  const barrioActual = barrios.find((b) => b.id === pegue.barrioId);

  return (
    <div className="max-w-2xl space-y-6">
      <BotonAtras href="/admin/abonados" />

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-azul">{pegue.codigo}</h1>
            <span className={badgeEstado[pegue.estado]}>{nombreEstado[pegue.estado]}</span>
          </div>
          <p className="text-gray-500">{barrioActual?.nombre}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href={`/admin/pagos/nuevo?pegue=${pegue.codigo}`} className="btn-primario text-sm flex items-center gap-1.5">
            <Wallet size={16} /> Registrar pago
          </Link>
          <Link href={`/admin/pegues/${pegue.id}/historial`} className="btn-outline text-sm flex items-center gap-1.5">
            <History size={16} /> Historial
          </Link>
          <Link href={`/admin/pegues/${pegue.id}/acta`} className="btn-outline text-sm flex items-center gap-1.5">
            <FileSignature size={16} /> Acta de instalación
          </Link>
        </div>
      </div>

      {/* Estado de cuenta */}
      <div
        className={`card ${
          estadoCuenta.corte
            ? "border-red-300 bg-red-50"
            : estadoCuenta.mesesMora > 0
            ? "border-orange-300 bg-orange-50"
            : "border-green-300 bg-green-50"
        }`}
      >
        <p className="font-semibold text-azul mb-1">Estado de cuenta</p>
        <p className="text-sm text-gray-600">
          Próximo mes a pagar: <b>{nombreMes(estadoCuenta.pendiente.mes)} {estadoCuenta.pendiente.anio}</b>
        </p>
        {estadoCuenta.mesesMora > 0 ? (
          <>
            <p className="text-sm mt-1">Meses en mora: <b>{estadoCuenta.mesesMora}</b></p>
            <p className="text-sm">Multa por mora: <b>L {estadoCuenta.montoMora.toFixed(2)}</b></p>
            {estadoCuenta.corte && <p className="text-red-700 font-semibold mt-1">⚠ Sujeto a corte de servicio</p>}
          </>
        ) : (
          <p className="text-green-700 font-medium mt-1">✓ Al día</p>
        )}
        <p className="font-bold text-azul mt-2">
          Total estimado a pagar: L {estadoCuenta.totalEstimado.toFixed(2)}
        </p>
      </div>

      {/* Datos del pegue */}
      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-azul">Datos del pegue</p>
          <button onClick={() => setEditando(!editando)} className="text-azul text-sm font-medium flex items-center gap-1.5">
            <Pencil size={14} /> {editando ? "Cancelar" : "Editar"}
          </button>
        </div>

        {editando ? (
          <div className="space-y-3">
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="label">Código</label>
                <input className="input uppercase" value={codigo} onChange={(e) => setCodigo(e.target.value.toUpperCase())} />
              </div>
              <div>
                <label className="label">Barrio</label>
                <select className="input" value={barrioId} onChange={(e) => setBarrioId(e.target.value)}>
                  {barrios.map((b) => (
                    <option key={b.id} value={b.id}>{b.nombre} ({b.prefijo})</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="label">Servicios habilitados</label>
              <div className="flex flex-wrap gap-2">
                {servicios.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 text-sm bg-gray-50 border rounded-lg px-3 py-2">
                    <input type="checkbox" checked={serviciosSel.includes(s.id)} onChange={() => toggleServicio(s.id)} />
                    {s.nombre} (L {s.precio.toFixed(2)})
                  </label>
                ))}
              </div>
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button onClick={guardarEdicion} disabled={guardando} className="btn-primario text-sm">
              {guardando ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        ) : (
          <p className="text-sm text-gray-600">
            {pegue.servicios.filter((ps: any) => ps.habilitado).map((ps: any) => ps.servicio.nombre).join(", ") || "Sin servicios habilitados"}
          </p>
        )}

        <div className="border-t pt-3 flex flex-wrap gap-2">
          {pegue.estado !== "CORTADO" && (
            <button onClick={() => setEstadoPendiente("CORTADO")} className="btn-outline text-xs flex items-center gap-1.5 border-red-300 text-red-600">
              <Ban size={14} /> Cortar por mora
            </button>
          )}
          {pegue.estado !== "INACTIVO" && (
            <button onClick={() => setEstadoPendiente("INACTIVO")} className="btn-outline text-xs flex items-center gap-1.5 border-orange-300 text-orange-600">
              <PauseCircle size={14} /> Inhabilitar (ausencia larga)
            </button>
          )}
          {pegue.estado !== "ACTIVO" && (
            <button onClick={() => setEstadoPendiente("ACTIVO")} className="btn-outline text-xs flex items-center gap-1.5 border-green-300 text-green-700">
              <PlayCircle size={14} /> Reactivar
            </button>
          )}
        </div>

        {estadoPendiente && (
          <div className="border rounded-lg p-3 bg-gray-50 space-y-2 mt-1">
            <p className="text-sm font-medium">
              {estadoPendiente === "CORTADO" && "Cortar este pegue — motivo:"}
              {estadoPendiente === "INACTIVO" && "Inhabilitar este pegue — motivo:"}
              {estadoPendiente === "ACTIVO" && "Reactivar este pegue — motivo:"}
            </p>
            <textarea
              className="input text-sm"
              placeholder="Ej: Ausencia por 6 meses, viaje al extranjero..."
              value={motivoEstado}
              onChange={(e) => setMotivoEstado(e.target.value)}
              autoFocus
            />
            {errorEstado && <p className="text-red-600 text-xs">{errorEstado}</p>}
            <div className="flex gap-2">
              <button onClick={confirmarCambioEstado} disabled={guardandoEstado} className="btn-primario text-xs">
                {guardandoEstado ? "Guardando..." : "Confirmar"}
              </button>
              <button
                onClick={() => { setEstadoPendiente(null); setMotivoEstado(""); setErrorEstado(""); }}
                className="btn-outline text-xs"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Cuotas de conexion */}
      {pegue.cuotas && pegue.cuotas.length > 0 && (
        <div className="card">
          <p className="font-semibold text-azul mb-1">Derecho de conexión</p>
          {(() => {
            const pendientes = pegue.cuotas.filter((c: any) => !c.pagada);
            const totalCuota = pegue.cuotas.reduce((s: number, c: any) => s + c.monto, 0);
            const totalPendiente = pendientes.reduce((s: number, c: any) => s + c.monto, 0);
            return (
              <p className="text-sm text-gray-500 mb-3">
                Total L {totalCuota.toFixed(2)}
                {pendientes.length > 0 ? (
                  <> · pendiente L {totalPendiente.toFixed(2)} ({pendientes.length} de {pegue.cuotas[0].totalCuotas} cuota(s))</>
                ) : (
                  <> · pagado por completo</>
                )}
              </p>
            );
          })()}

          <div className="divide-y border rounded-lg">
            {pegue.cuotas.map((c: any) => (
              <div key={c.id} className="px-3 py-2">
                <div className="flex items-center justify-between text-sm">
                  <span>
                    Cuota {c.numero} de {c.totalCuotas}
                    {c.pagada && c.fechaPago && (
                      <span className="text-gray-400"> · pagada {new Date(c.fechaPago).toLocaleDateString("es-HN")}</span>
                    )}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">L {c.monto.toFixed(2)}</span>
                    {c.pagada ? (
                      <>
                        <span className="badge-verde">Pagada</span>
                        <Link href={`/admin/recibo/cuota/${c.id}`} className="text-azul text-xs font-medium">
                          Ver recibo
                        </Link>
                      </>
                    ) : cuotaCobrando === c.id ? null : (
                      <button onClick={() => setCuotaCobrando(c.id)} className="btn-outline text-xs">
                        Cobrar
                      </button>
                    )}
                  </div>
                </div>

                {cuotaCobrando === c.id && (
                  <div className="mt-2 bg-gray-50 border rounded-lg p-3 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <select className="input text-sm" value={metodoPagoCuota} onChange={(e) => setMetodoPagoCuota(e.target.value)}>
                        <option value="EFECTIVO">Efectivo</option>
                        <option value="TRANSFERENCIA">Transferencia</option>
                        <option value="DEPOSITO">Depósito bancario</option>
                        <option value="OTRO">Otro</option>
                      </select>
                      <input
                        className="input text-sm"
                        placeholder="Referencia (opcional)"
                        value={referenciaCuota}
                        onChange={(e) => setReferenciaCuota(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => cobrarCuota(c.id)}
                        disabled={guardandoCuota}
                        className="btn-primario text-xs"
                      >
                        {guardandoCuota ? "Guardando..." : `Confirmar cobro de L ${c.monto.toFixed(2)}`}
                      </button>
                      <button onClick={() => setCuotaCobrando(null)} className="btn-outline text-xs">
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dueño del pegue */}
      <div className="card">
        <p className="font-semibold text-azul mb-2">Abonado dueño de este pegue</p>
        <p className="font-medium">{pegue.abonado.nombre}</p>
        <p className="text-sm text-gray-500">
          {pegue.abonado.identidad || "sin identidad registrada"}
          {pegue.abonado.identidadAutocompletada && (
            <span className="badge-verde ml-2">agregada por el abonado</span>
          )}
        </p>
        {pegue.abonado.pin && (
          <p className="text-sm text-gray-500">
            Código de acceso al portal: <b className="text-azul">{pegue.abonado.pin}</b>
          </p>
        )}
        {pegue.abonado.telefono && <p className="text-sm text-gray-500">Tel: {pegue.abonado.telefono}</p>}
        {pegue.abonado.direccion && <p className="text-sm text-gray-500">{pegue.abonado.direccion}</p>}
        <Link href={`/admin/abonados/detalle/${pegue.abonado.id}`} className="text-azul text-sm font-medium mt-2 inline-block">
          Ver ficha completa del abonado (otros pegues, editar datos)
        </Link>
      </div>
    </div>
  );
}
