"use client";

import { Home, TreePine, Warehouse, Landmark } from "lucide-react";

export default function IconoTipoConexion({ tipo, size = 16 }: { tipo: string; size?: number }) {
  switch (tipo) {
    case "SOLAR":
      return <TreePine size={size} className="text-green-600" />;
    case "CORRAL":
      return <Warehouse size={size} className="text-amber-700" />;
    case "BIEN_COMUN":
      return <Landmark size={size} className="text-azul" />;
    default:
      return <Home size={size} className="text-gray-500" />;
  }
}
