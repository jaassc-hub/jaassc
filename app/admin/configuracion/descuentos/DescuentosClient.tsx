"use client";

import { useState } from "react";

export default function DescuentosClient({ configInicial }: { configInicial: any }) {
  const [config, setConfig] = useState(configInicial);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  async function guardar() {
    setGuardando(true);
    setMensaje("");
    const res = await fetch("/api/config/descuentos", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    setGuardando(false);
    setMensaje(res.ok ? "Guardado." : "Error al guardar.");
  }

  return (
    <div className="max-w-xl space-y-4">
      <div className="card space-y-3">
        <label className="flex items-center gap-2 font-semibold text-azul">
          <input
            type="checkbox"
            checked={config.terceraEdad.activo}
            onChange={(e) =>
              setConfig({ ...config, terceraEdad: { ...config.terceraEdad, activo: e.target.checked } })
            }
          />
          Descuento por tercera edad
        </label>
        <p className="text-xs text-gray-400">
          Se calcula la edad a partir del número de identidad del abonado (formato
          hondureño DDDD-AAAA-NNNNN).
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Edad mínima</label>
            <input
              type="number"
              className="input"
              value={config.terceraEdad.edadMinima}
              onChange={(e) =>
                setConfig({
                  ...config,
                  terceraEdad: { ...config.terceraEdad, edadMinima: parseInt(e.target.value) || 0 },
                })
              }
            />
          </div>
          <div>
            <label className="label">Porcentaje de descuento</label>
            <input
              type="number"
              className="input"
              value={config.terceraEdad.porcentaje}
              onChange={(e) =>
                setConfig({
                  ...config,
                  terceraEdad: { ...config.terceraEdad, porcentaje: parseFloat(e.target.value) || 0 },
                })
              }
            />
          </div>
        </div>
      </div>

      <div className="card space-y-3">
        <label className="flex items-center gap-2 font-semibold text-azul">
          <input
            type="checkbox"
            checked={config.pagoAdelantado.activo}
            onChange={(e) =>
              setConfig({ ...config, pagoAdelantado: { ...config.pagoAdelantado, activo: e.target.checked } })
            }
          />
          Descuento por pago adelantado a inicio de año
        </label>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="label">Meses mínimos</label>
            <input
              type="number"
              className="input"
              value={config.pagoAdelantado.mesesMinimos}
              onChange={(e) =>
                setConfig({
                  ...config,
                  pagoAdelantado: { ...config.pagoAdelantado, mesesMinimos: parseInt(e.target.value) || 0 },
                })
              }
            />
          </div>
          <div>
            <label className="label">Hasta qué mes del año</label>
            <input
              type="number"
              min={1}
              max={12}
              className="input"
              value={config.pagoAdelantado.mesLimiteAnio}
              onChange={(e) =>
                setConfig({
                  ...config,
                  pagoAdelantado: { ...config.pagoAdelantado, mesLimiteAnio: parseInt(e.target.value) || 1 },
                })
              }
            />
          </div>
          <div>
            <label className="label">Porcentaje</label>
            <input
              type="number"
              className="input"
              value={config.pagoAdelantado.porcentaje}
              onChange={(e) =>
                setConfig({
                  ...config,
                  pagoAdelantado: { ...config.pagoAdelantado, porcentaje: parseFloat(e.target.value) || 0 },
                })
              }
            />
          </div>
        </div>
        <p className="text-xs text-gray-400">
          Ejemplo: si pone 6 meses mínimos y "hasta el mes 3", un abonado que pague 6 o más
          meses de una vez entre enero y marzo calificará para el descuento.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={guardar} disabled={guardando} className="btn-primario text-sm">
          {guardando ? "Guardando..." : "Guardar"}
        </button>
        {mensaje && <span className="text-sm text-gray-500">{mensaje}</span>}
      </div>
    </div>
  );
}
