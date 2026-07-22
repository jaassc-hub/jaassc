"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Bell, Ban, CreditCard } from "lucide-react";

export default function NotificacionesClient() {
  const [datos, setDatos] = useState<{ alertasCorte: any[]; alertasCuota: any[] } | null>(null);
  const [cargando, setCargando] = useState(true);
  const [aplicando, setAplicando] = useState<string | null>(null);

  async function cargar() {
    setCargando(true);
    const res = await fetch("/api/notificaciones");
    if (res.ok) setDatos(await res.json());
    setCargando(false);
  }

  useEffect(() => {
    cargar();
  }, []);

  async function aplicarMulta(cuotaId: string) {
    if (!confirm("¿Aplicar la multa configurada a esta cuota atrasada?")) return;
    setAplicando(cuotaId);
    const res = await fetch(`/api/cuotas/${cuotaId}/multa`, { method: "POST" });
    setAplicando(null);
    if (res.ok) cargar();
  }

  const totalAlertas = (datos?.alertasCorte.length || 0) + (datos?.alertasCuota.length || 0);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-azul text-white rounded-xl p-3">
          <Bell size={24} strokeWidth={1.8} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-azul">Notificaciones</h1>
          <p className="text-gray-500 text-sm">
            Irregularidades que vale la pena revisar — no significan que algo esté mal
            necesariamente, solo que es poco común.
          </p>
        </div>
      </div>

      {cargando && <p className="text-gray-400">Cargando...</p>}

      {!cargando && totalAlertas === 0 && (
        <div className="card text-center py-8 text-gray-400">
          No hay ninguna irregularidad que revisar por ahora.
        </div>
      )}

      {!cargando && datos && datos.alertasCorte.length > 0 && (
        <div className="mb-6">
          <p className="font-semibold text-red-700 flex items-center gap-1.5 mb-2">
            <Ban size={16} /> Cortados sin reconectarse hace tiempo
          </p>
          <div className="card divide-y">
            {datos.alertasCorte.map((a) => (
              <div key={a.pegueId} className="py-3 flex items-center justify-between flex-wrap gap-2">
                <div>
                  <p className="font-medium">{a.codigo} — {a.abonadoNombre}</p>
                  <p className="text-xs text-gray-500">
                    {a.barrio} · cortado hace {a.mesesSinReconectar} mes(es), sin reconexión
                  </p>
                </div>
                <Link href={`/admin/pegues/${a.pegueId}`} className="btn-outline text-xs">
                  Revisar pegue
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {!cargando && datos && datos.alertasCuota.length > 0 && (
        <div>
          <p className="font-semibold text-orange-700 flex items-center gap-1.5 mb-2">
            <CreditCard size={16} /> Cuotas de conexión atrasadas
          </p>
          <div className="card divide-y">
            {datos.alertasCuota.map((a) => (
              <div key={a.cuotaId} className="py-3 flex items-center justify-between flex-wrap gap-2">
                <div>
                  <p className="font-medium">{a.codigo} — {a.abonadoNombre}</p>
                  <p className="text-xs text-gray-500">
                    {a.barrio} · cuota {a.cuotaNumero} de {a.cuotaTotal} sin pagar hace {a.mesesAtraso} mes(es) ·
                    monto actual L {a.montoCuota.toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {a.multaAplicada ? (
                    <span className="text-xs text-gray-400">Ya se le aplicó multa</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => aplicarMulta(a.cuotaId)}
                      disabled={aplicando === a.cuotaId}
                      className="btn-outline text-xs border-orange-300 text-orange-700 flex items-center gap-1.5"
                    >
                      <AlertTriangle size={13} />
                      {aplicando === a.cuotaId ? "Aplicando..." : `Aplicar multa (L ${a.montoMultaConfigurado})`}
                    </button>
                  )}
                  <Link href={`/admin/pegues/${a.pegueId}`} className="btn-outline text-xs">
                    Ver pegue
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
