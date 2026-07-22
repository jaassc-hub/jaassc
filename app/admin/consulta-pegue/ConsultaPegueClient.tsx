"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Wallet, ExternalLink } from "lucide-react";
import { mesesDeMora, calcularMontoMora, sujetoACorte, siguienteMesPendiente, nombreMes } from "@/lib/mora";
import { MORA_DEFAULT } from "@/lib/moraConfig";

export default function ConsultaPegueClient() {
  const [q, setQ] = useState("");
  const [pegue, setPegue] = useState<any>(null);
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState("");

  const [lista, setLista] = useState<any[] | null>(null);

  async function buscar(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    setBuscando(true);
    setError("");
    setPegue(null);
    setLista(null);
    const res = await fetch(`/api/pegues/buscar?q=${encodeURIComponent(q)}`);
    setBuscando(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "No se encontró");
      return;
    }
    const data = await res.json();
    if (data.tipo === "pegue") {
      setPegue(data.pegue);
    } else if (data.tipo === "lista") {
      // aplanar todos los pegues de todos los abonados encontrados, para elegir
      const opciones = data.abonados.flatMap((a: any) =>
        a.pegues.map((p: any) => ({ ...p, abonadoNombre: a.nombre }))
      );
      if (opciones.length === 1) {
        seleccionarPegue(opciones[0].codigo);
      } else {
        setLista(opciones);
      }
    }
  }

  async function seleccionarPegue(codigo: string) {
    setBuscando(true);
    setLista(null);
    const res = await fetch(`/api/pegues/buscar?q=${encodeURIComponent(codigo)}`);
    setBuscando(false);
    if (res.ok) {
      const data = await res.json();
      if (data.tipo === "pegue") setPegue(data.pegue);
    }
  }

  const montoServicios = pegue
    ? pegue.tipoConexion === "BIEN_COMUN"
      ? 0
      : pegue.servicios.filter((ps: any) => ps.habilitado).reduce((s: number, ps: any) => s + ps.servicio.precio, 0)
    : 0;
  const pendiente = pegue ? siguienteMesPendiente(pegue.pagos[0] || null, new Date(pegue.createdAt)) : null;
  const mesesMora = pendiente ? mesesDeMora(pendiente.mes, pendiente.anio) : 0;
  const montoAdeudado = montoServicios * mesesMora;
  const montoMora = calcularMontoMora(montoAdeudado, mesesMora, MORA_DEFAULT.tramos);
  const corte = sujetoACorte(mesesMora);
  const sinPagos = pegue && pegue.pagos.length === 0;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-azul text-white rounded-xl p-3">
          <Search size={24} strokeWidth={1.8} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-azul">Consultar estado de cuenta</h1>
          <p className="text-gray-500 text-sm">
            Vea exactamente lo mismo que ve el abonado al consultar en línea, sin necesitar su clave.
          </p>
        </div>
      </div>

      <form onSubmit={buscar} className="card max-w-lg mb-6">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-10"
            placeholder="Código de pegue, identidad o nombre..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            autoFocus
          />
        </div>
        <button type="submit" disabled={buscando} className="btn-primario w-full mt-3">
          {buscando ? "Buscando..." : "Buscar"}
        </button>
        {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
      </form>

      {lista && (
        <div className="card max-w-lg mb-6 divide-y">
          <p className="text-sm text-gray-500 pb-2">Varios resultados, elija uno:</p>
          {lista.map((p) => (
            <button
              type="button"
              key={p.id}
              onClick={() => seleccionarPegue(p.codigo)}
              className="w-full text-left py-2 hover:bg-gray-50 flex justify-between"
            >
              <span>{p.codigo} — {p.abonadoNombre}</span>
              <span className="text-gray-400">{p.barrio.nombre}</span>
            </button>
          ))}
        </div>
      )}

      {pegue && (
        <div className="max-w-lg space-y-4">
          <div className="card">
            <div className="flex items-center justify-between mb-1">
              <p className="font-bold text-azul text-lg">{pegue.codigo}</p>
              <div className="flex gap-2">
                <Link href={`/admin/pagos/nuevo?pegue=${pegue.codigo}`} className="btn-primario text-xs flex items-center gap-1">
                  <Wallet size={13} /> Cobrar
                </Link>
                <Link href={`/admin/pegues/${pegue.id}`} className="btn-outline text-xs flex items-center gap-1">
                  <ExternalLink size={13} /> Ficha completa
                </Link>
              </div>
            </div>
            <p className="text-sm text-gray-600">{pegue.abonado.nombre}</p>
            <p className="text-sm text-gray-500">{pegue.barrio.nombre}</p>
          </div>

          <div className={`card ${corte ? "border-red-300 bg-red-50" : sinPagos ? "border-orange-300 bg-orange-50" : mesesMora > 0 ? "border-orange-300 bg-orange-50" : "border-green-300 bg-green-50"}`}>
            <p className="text-sm text-gray-500">Próximo mes a pagar</p>
            {pendiente && <p className="font-semibold">{nombreMes(pendiente.mes)} {pendiente.anio}</p>}
            {sinPagos ? (
              <p className="text-orange-700 font-medium mt-1">⚠ No se ha registrado ningún pago para este pegue todavía</p>
            ) : mesesMora > 0 ? (
              <>
                <p className="text-sm mt-2">Meses en mora: <b>{mesesMora}</b></p>
                <p className="text-sm">Multa por mora: <b>L {montoMora.toFixed(2)}</b></p>
                {corte && <p className="text-red-700 font-semibold mt-2">⚠ Sujeto a corte de servicio</p>}
              </>
            ) : (
              <p className="text-green-700 font-medium mt-1">✓ Al día</p>
            )}
            <p className="font-bold text-azul mt-3">
              Total estimado a pagar: L {(montoServicios + montoMora).toFixed(2)}
            </p>
          </div>

          <div className="card">
            <p className="font-semibold text-azul mb-2">Servicios habilitados</p>
            <ul className="text-sm space-y-1">
              {pegue.servicios.filter((s: any) => s.habilitado).map((s: any) => (
                <li key={s.servicio.id} className="flex justify-between">
                  <span>{s.servicio.nombre}</span>
                  <span>L {s.servicio.precio.toFixed(2)}</span>
                </li>
              ))}
              {pegue.servicios.filter((s: any) => s.habilitado).length === 0 && (
                <li className="text-gray-400">Ninguno</li>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
