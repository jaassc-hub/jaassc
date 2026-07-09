"use client";

import { Printer } from "lucide-react";

export default function BotonImprimir() {
  return (
    <button onClick={() => window.print()} className="btn-primario text-sm flex items-center gap-1.5">
      <Printer size={14} /> Imprimir
    </button>
  );
}
