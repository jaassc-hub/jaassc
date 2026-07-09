"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import BotonAtras from "@/components/BotonAtras";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    setCargando(false);
    if (res.ok) {
      router.push("/admin");
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error || "Error al iniciar sesión");
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-azul px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full"
      >
        <BotonAtras href="/" />
        <div className="flex justify-center mb-4">
          <Logo size={64} />
        </div>
        <h1 className="text-xl font-bold text-center text-azul mb-6">
          Acceso administrador
        </h1>

        <label className="label">Usuario</label>
        <input
          className="input mb-4"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoFocus
        />

        <label className="label">Contraseña</label>
        <input
          type="password"
          className="input mb-4"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        <button type="submit" disabled={cargando} className="btn-primario w-full">
          {cargando ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
    </main>
  );
}
