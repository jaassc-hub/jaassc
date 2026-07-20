"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";

export default function CambiarPasswordPage() {
  const router = useRouter();
  const [passwordActual, setPasswordActual] = useState("");
  const [passwordNueva, setPasswordNueva] = useState("");
  const [passwordConfirmar, setPasswordConfirmar] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (passwordNueva !== passwordConfirmar) {
      setError("Las contraseñas nuevas no coinciden.");
      return;
    }
    setCargando(true);
    const res = await fetch("/api/auth/cambiar-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passwordActual, passwordNueva }),
    });
    setCargando(false);
    if (res.ok) {
      router.push("/admin");
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error || "Error al cambiar la contraseña");
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-azul px-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full">
        <div className="flex justify-center mb-4">
          <Logo size={64} />
        </div>
        <h1 className="text-xl font-bold text-center text-azul mb-2">Cambie su contraseña</h1>
        <p className="text-sm text-gray-500 text-center mb-6">
          Por seguridad, debe poner una contraseña nueva antes de continuar.
        </p>

        <label className="label">Contraseña actual (la temporal que le dieron)</label>
        <input
          type="password"
          className="input mb-4"
          value={passwordActual}
          onChange={(e) => setPasswordActual(e.target.value)}
          autoFocus
        />

        <label className="label">Contraseña nueva</label>
        <input
          type="password"
          className="input mb-1"
          value={passwordNueva}
          onChange={(e) => setPasswordNueva(e.target.value)}
        />
        <p className="text-xs text-gray-400 mb-4">Mínimo 8 caracteres, mezclando letras y números.</p>

        <label className="label">Confirmar contraseña nueva</label>
        <input
          type="password"
          className="input mb-4"
          value={passwordConfirmar}
          onChange={(e) => setPasswordConfirmar(e.target.value)}
        />

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        <button type="submit" disabled={cargando} className="btn-primario w-full">
          {cargando ? "Guardando..." : "Cambiar contraseña"}
        </button>
      </form>
    </main>
  );
}
