"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";

export default function GenerarPinsBoton() {
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  async function generar() {
    setCargando(true);
    setMensaje("");
    const res = await fetch("/api/abonados/generar-pins-faltantes", { method: "POST" });
    setCargando(false);
    if (res.ok) {
      const data = await res.json();
      setMensaje(
        data.generados > 0
          ? `Listo: se generaron ${data.generados} código(s) nuevo(s).`
          : "Todos los abonados ya tenían su código de acceso."
      );
    } else {
      setMensaje("Error al generar los códigos.");
    }
  }

  return (
    <div className="card">
      <p className="font-semibold text-azul flex items-center gap-2">
        <KeyRound size={20} strokeWidth={1.8} /> Códigos de acceso al portal
      </p>
      <p className="text-sm text-gray-500 mt-1 mb-3">
        A cada abonado se le genera un código de acceso automáticamente la primera vez que
        se abre su ficha o se le cobra. Si prefiere generarlos todos de una vez (por ejemplo,
        para repartirlos en una reunión), use este botón.
      </p>
      <button type="button" onClick={generar} disabled={cargando} className="btn-outline text-sm">
        {cargando ? "Generando..." : "Generar códigos faltantes ahora"}
      </button>
      {mensaje && <p className="text-sm text-gray-500 mt-2">{mensaje}</p>}
    </div>
  );
}
