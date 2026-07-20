"use client";

export default function ImprimirBoton() {
  return (
    <button type="button" onClick={() => window.print()} className="btn-primario text-sm">
      🖨️ Descargar / Imprimir PDF
    </button>
  );
}
