"use client";

import { useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import { nombreMes } from "@/lib/mora";
import { CreditCard } from "lucide-react";

const badgeEstado: Record<string, string> = {
  ACTIVO: "badge-verde",
  CORTADO: "badge-rojo",
  INACTIVO: "badge-naranja",
};

export default function EstadoCuentaClient({
  pegue: pegueInicial,
  montoServicios,
  pendiente,
  mesesMora,
  montoMora,
  corte,
  clave,
}: {
  pegue: any;
  montoServicios: number;
  pendiente: { mes: number; anio: number };
  mesesMora: number;
  montoMora: number;
  corte: boolean;
  clave: string;
}) {
  const [pegue, setPegue] = useState(pegueInicial);

  const [mostrarFormIdentidad, setMostrarFormIdentidad] = useState(false);
  const [nuevaIdentidad, setNuevaIdentidad] = useState("");
  const [guardandoIdentidad, setGuardandoIdentidad] = useState(false);
  const [errorIdentidad, setErrorIdentidad] = useState("");
  const [exitoIdentidad, setExitoIdentidad] = useState(false);

  async function guardarIdentidad(e: React.FormEvent) {
    e.preventDefault();
    setGuardandoIdentidad(true);
    setErrorIdentidad("");
    const res = await fetch(`/api/portal/${pegue.codigo}/identidad`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clave, nuevaIdentidad }),
    });
    setGuardandoIdentidad(false);
    const data = await res.json();
    if (res.ok) {
      setPegue({ ...pegue, abonado: { ...pegue.abonado, identidad: data.identidad } });
      setExitoIdentidad(true);
      setMostrarFormIdentidad(false);
    } else {
      setErrorIdentidad(data.error || "No se pudo guardar. Revise el formato.");
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-10">
      <div className="bg-azul text-white p-5 flex items-center gap-3">
        <Logo size={40} />
        <div>
          <p className="font-semibold">{process.env.NEXT_PUBLIC_JUNTA_NOMBRE || "Junta de Agua"}</p>
          <p className="text-sm text-white/80">Estado de cuenta</p>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4">
        <div className="card">
          <p className="text-sm text-gray-400">Abonado</p>
          <p className="font-semibold text-lg">{pegue.abonado.nombre}</p>
          <p className="text-sm text-gray-500">
            Pegue {pegue.codigo} · {pegue.barrio.nombre}
          </p>
          <span className={`${badgeEstado[pegue.estado]} inline-block mt-2`}>{pegue.estado}</span>
        </div>

        {exitoIdentidad && (
          <div className="card border-green-300 bg-green-50">
            <p className="text-sm text-green-700 font-medium">
              ✓ Identidad guardada. Gracias — ya no la necesitará para futuras consultas.
            </p>
          </div>
        )}

        {!pegue.abonado.identidad && !exitoIdentidad && (
          <div className="card border-azul/20 bg-azul/5">
            <p className="font-semibold text-azul flex items-center gap-2">
              <CreditCard size={18} /> Agregue su número de identidad
            </p>
            <p className="text-sm text-gray-600 mt-1 mb-3">
              Es opcional, pero le da una forma extra (y más segura) de entrar a su cuenta más
              adelante, sin depender solo del código de acceso.
            </p>
            {mostrarFormIdentidad ? (
              <form onSubmit={guardarIdentidad} className="space-y-2">
                <input
                  className="input"
                  placeholder="Ej: 0801-1990-01234"
                  value={nuevaIdentidad}
                  onChange={(e) => setNuevaIdentidad(e.target.value)}
                  autoFocus
                />
                {errorIdentidad && <p className="text-red-600 text-xs">{errorIdentidad}</p>}
                <div className="flex gap-2">
                  <button disabled={guardandoIdentidad} className="btn-primario text-sm">
                    {guardandoIdentidad ? "Guardando..." : "Guardar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMostrarFormIdentidad(false)}
                    className="btn-outline text-sm"
                  >
                    Ahora no
                  </button>
                </div>
              </form>
            ) : (
              <button onClick={() => setMostrarFormIdentidad(true)} className="btn-primario text-sm">
                Agregar mi identidad
              </button>
            )}
          </div>
        )}

        <div className={`card ${corte ? "border-red-300 bg-red-50" : mesesMora > 0 ? "border-orange-300 bg-orange-50" : "border-green-300 bg-green-50"}`}>
          <p className="text-sm text-gray-500">Próximo mes a pagar</p>
          <p className="font-semibold">{nombreMes(pendiente.mes)} {pendiente.anio}</p>
          {mesesMora > 0 ? (
            <>
              <p className="text-sm mt-2">Meses en mora: <b>{mesesMora}</b></p>
              <p className="text-sm">Multa por mora: <b>L {montoMora.toFixed(2)}</b></p>
              {corte && <p className="text-red-700 font-semibold mt-2">⚠ Sujeto a corte de servicio</p>}
            </>
          ) : (
            <p className="text-green-700 font-medium mt-1">✓ Al día</p>
          )}
          <p className="font-bold text-azul mt-3">
            Total estimado a pagar: L {(montoServicios + montoMora).toFixed(2)}
          </p>
        </div>

        {pegue.cuotas && pegue.cuotas.length > 0 && (
          <div
            className={`card ${
              pegue.cuotas.some((c: any) => !c.pagada) ? "border-orange-300 bg-orange-50" : "border-green-300 bg-green-50"
            }`}
          >
            <p className="font-semibold text-azul mb-1">Derecho de conexión</p>
            {(() => {
              const pendientes = pegue.cuotas.filter((c: any) => !c.pagada);
              const totalPendiente = pendientes.reduce((s: number, c: any) => s + c.monto, 0);
              return pendientes.length > 0 ? (
                <p className="text-sm text-orange-700">
                  Tiene {pendientes.length} cuota(s) pendiente(s) de conexión, por un total de{" "}
                  <b>L {totalPendiente.toFixed(2)}</b>. Puede pagarlas cuando la Junta haga su
                  cobro habitual.
                </p>
              ) : (
                <p className="text-sm text-green-700">✓ Derecho de conexión pagado por completo.</p>
              );
            })()}

            <div className="mt-2 space-y-1">
              {pegue.cuotas.filter((c: any) => c.pagada).map((c: any) => (
                <div key={c.id} className="flex items-center justify-between text-sm">
                  <span>
                    Cuota {c.numero} de {c.totalCuotas} · L {c.monto.toFixed(2)}
                  </span>
                  <Link
                    href={`/portal/recibo/cuota/${c.id}?clave=${encodeURIComponent(clave)}`}
                    className="text-azul font-medium"
                  >
                    Ver / PDF
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="card">
          <p className="font-semibold text-azul mb-2">Servicios habilitados</p>
          <ul className="text-sm space-y-1">
            {pegue.servicios.filter((s: any) => s.habilitado).map((s: any) => (
              <li key={s.servicio.id} className="flex justify-between">
                <span>{s.servicio.nombre}</span>
                <span>L {s.servicio.precio.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="card">
          <p className="font-semibold text-azul mb-3">Historial de pagos</p>
          <div className="space-y-2">
            {pegue.pagos.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                <div>
                  <p className="text-sm font-medium">{nombreMes(p.mesPagado)} {p.anioPagado}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(p.fechaPago).toLocaleDateString("es-HN")} · L {p.total.toFixed(2)}
                  </p>
                </div>
                <Link
                  href={
                    p.loteId
                      ? `/portal/recibo/lote/${p.loteId}?clave=${encodeURIComponent(clave)}`
                      : `/portal/recibo/${p.id}?clave=${encodeURIComponent(clave)}`
                  }
                  className="text-azul text-sm font-medium"
                >
                  Ver / PDF
                </Link>
              </div>
            ))}
            {pegue.pagos.length === 0 && (
              <p className="text-gray-400 text-sm">Aún no hay pagos registrados.</p>
            )}
          </div>
        </div>

        <Link href="/portal" className="text-azul text-sm block text-center">
          ← Consultar otro pegue
        </Link>
      </div>
    </main>
  );
}
