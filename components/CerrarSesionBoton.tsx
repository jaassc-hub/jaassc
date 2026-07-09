"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export default function CerrarSesionBoton() {
  const router = useRouter();

  async function salir() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={salir}
      className="text-sm text-white/80 hover:text-white flex items-center gap-2"
    >
      <LogOut size={16} strokeWidth={1.8} />
      Cerrar sesión
    </button>
  );
}
