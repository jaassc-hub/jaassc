"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import BotonAtras from "@/components/BotonAtras";

export default function PortalPage() {
  const router = useRouter();
  const [codigo, setCodigo] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function consultar(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    setError("");
    const res = await fetch(
      `/api/portal/${encodeURIComponent(codigo)}?clave=${encodeURIComponent(clave)}`
    );
    setCargando(false);
    if (res.ok) {
      router.push(`/portal/${encodeURIComponent(codigo)}?clave=${encodeURIComponent(clave)}`);
    } else {
      const data = await res.json();
      setError(data.error || "No se encontró ninguna cuenta con esos datos");
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-azul px-4">
      <form onSubmit={consultar} className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full">
        <BotonAtras href="/" />
        <div className="flex justify-center mb-4">
          <Logo size={64} />
        </div>
        <h1 className="text-xl font-bold text-center text-azul mb-1">Consulte su cuenta</h1>
        <p className="text-center text-gray-500 text-sm mb-6">
          Ingrese el código de su pegue y su identidad o código de acceso
        </p>

        <label className="label">Código de pegue</label>
        <input
          className="input mb-4 uppercase"
          placeholder="Ej: GUA001"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value.toUpperCase())}
          autoFocus
        />

        <label className="label">Identidad o código de acceso</label>
        <input
          className="input mb-1"
          value={clave}
          onChange={(e) => setClave(e.target.value)}
          placeholder="Su número de identidad o el código que le dieron"
        />
        <p className="text-xs text-gray-400 mb-4">
          Si no tiene su número de identidad registrado, use el código de acceso que le dio la
          Junta (aparece en su recibo).
        </p>

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        <button disabled={cargando} className="btn-secundario w-full">
          {cargando ? "Consultando..." : "Consultar"}
        </button>
      </form>
    </main>
  );
}
