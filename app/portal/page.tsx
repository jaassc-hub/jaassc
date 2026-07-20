"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import BotonAtras from "@/components/BotonAtras";
import { CheckCircle2, MapPin, User } from "lucide-react";

export default function PortalPage() {
  const router = useRouter();

  // Paso 1: solo el codigo, para confirmar de quien es antes de pedir la clave
  const [paso, setPaso] = useState<1 | 2>(1);
  const [codigo, setCodigo] = useState("");
  const [datosPegue, setDatosPegue] = useState<{ nombre: string; barrio: string } | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [errorBusqueda, setErrorBusqueda] = useState("");

  // Paso 2: la clave, ya con el pegue confirmado
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function buscarPegue(e: React.FormEvent) {
    e.preventDefault();
    setBuscando(true);
    setErrorBusqueda("");
    const res = await fetch(`/api/portal/verificar-codigo?codigo=${encodeURIComponent(codigo)}`);
    setBuscando(false);
    if (res.ok) {
      const data = await res.json();
      setDatosPegue({ nombre: data.nombre, barrio: data.barrio });
      setPaso(2);
    } else {
      const data = await res.json();
      setErrorBusqueda(data.error || "No se encontró ese código de pegue");
    }
  }

  function noEsMiPegue() {
    setPaso(1);
    setDatosPegue(null);
    setCodigo("");
    setClave("");
    setError("");
  }

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
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full">
        <BotonAtras href="/" />
        <div className="flex justify-center mb-4">
          <Logo size={64} />
        </div>

        {paso === 1 && (
          <>
            <h1 className="text-xl font-bold text-center text-azul mb-1">Consulte su cuenta</h1>
            <p className="text-center text-gray-500 text-sm mb-6">
              Primero, escriba el código de su pegue
            </p>

            <form onSubmit={buscarPegue}>
              <label className="label">Código de pegue</label>
              <input
                className="input mb-1 uppercase"
                placeholder="Ej: GUA001"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                autoFocus
              />
              <p className="text-xs text-gray-400 mb-4">
                Aparece impreso en su recibo. Si no está seguro, pregúntele a la Junta.
              </p>

              {errorBusqueda && <p className="text-red-600 text-sm mb-3">{errorBusqueda}</p>}

              <button disabled={buscando} className="btn-secundario w-full">
                {buscando ? "Buscando..." : "Continuar"}
              </button>
            </form>
          </>
        )}

        {paso === 2 && datosPegue && (
          <>
            <h1 className="text-xl font-bold text-center text-azul mb-1">¿Es este su pegue?</h1>
            <p className="text-center text-gray-500 text-sm mb-4">Confirme antes de seguir</p>

            <div className="bg-azul/5 border border-azul/20 rounded-xl p-4 mb-4 space-y-2">
              <p className="text-center font-bold text-azul text-lg mb-2">{codigo}</p>
              <div className="flex items-center gap-2 text-sm">
                <User size={16} className="text-azul shrink-0" />
                <span>{datosPegue.nombre}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin size={16} className="text-azul shrink-0" />
                <span>{datosPegue.barrio}</span>
              </div>
            </div>

            <button type="button" onClick={noEsMiPegue} className="text-sm text-gray-500 underline mb-4 block mx-auto">
              No es mi pegue, corregir código
            </button>

            <form onSubmit={consultar}>

              <input
                className="input mb-1 mt-1"
                value={clave}
                onChange={(e) => setClave(e.target.value)}
                placeholder="Su número de identidad o el código que le dieron"
                autoFocus
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
          </>
        )}
      </div>
    </main>
  );
}
