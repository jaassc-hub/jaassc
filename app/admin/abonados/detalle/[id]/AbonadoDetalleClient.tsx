"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil, Plus, Wallet, History } from "lucide-react";
import BotonAtras from "@/components/BotonAtras";

type Servicio = { id: string; nombre: string; precio: number };
type Barrio = { id: string; nombre: string; prefijo: string };
type Pegue = {
  id: string;
  codigo: string;
  estado: string;
  barrio: Barrio;
  servicios: { servicio: Servicio; habilitado: boolean }[];
};
type Abonado = {
  id: string;
  nombre: string;
  identidad: string | null;
  identidadAutocompletada: boolean;
  pin: string | null;
  telefono: string | null;
  direccion: string | null;
  activo: boolean;
  pegues: Pegue[];
};

const badgeEstado: Record<string, string> = {
  ACTIVO: "badge-verde",
  CORTADO: "badge-rojo",
  INACTIVO: "badge-naranja",
};
const nombreEstado: Record<string, string> = {
  ACTIVO: "Activo",
  CORTADO: "Cortado",
  INACTIVO: "Inhabilitado",
};

export default function AbonadoDetalleClient({
  abonadoInicial,
  barrios,
  servicios,
}: {
  abonadoInicial: Abonado;
  barrios: Barrio[];
  servicios: Servicio[];
}) {
  const [abonado, setAbonado] = useState(abonadoInicial);

  // --- Edicion de datos del abonado ---
  const [editando, setEditando] = useState(false);
  const [nombre, setNombre] = useState(abonado.nombre);
  const [identidad, setIdentidad] = useState(abonado.identidad || "");
  const [telefono, setTelefono] = useState(abonado.telefono || "");
  const [direccion, setDireccion] = useState(abonado.direccion || "");
  const [guardandoDatos, setGuardandoDatos] = useState(false);
  const [errorDatos, setErrorDatos] = useState("");

  async function guardarDatos() {
    setGuardandoDatos(true);
    setErrorDatos("");
    const res = await fetch(`/api/abonados/${abonado.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, identidad, telefono, direccion }),
    });
    setGuardandoDatos(false);
    if (res.ok) {
      const actualizado = await res.json();
      setAbonado({ ...abonado, ...actualizado });
      setEditando(false);
    } else {
      const data = await res.json();
      setErrorDatos(data.error || "Error al guardar");
    }
  }

  async function toggleActivo() {
    const res = await fetch(`/api/abonados/${abonado.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo: !abonado.activo }),
    });
    if (res.ok) {
      const actualizado = await res.json();
      setAbonado({ ...abonado, ...actualizado });
    }
  }

  const [regenerando, setRegenerando] = useState(false);
  async function regenerarPin() {
    if (!confirm("¿Generar un nuevo código de acceso? El anterior dejará de funcionar.")) return;
    setRegenerando(true);
    const res = await fetch(`/api/abonados/${abonado.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ regenerarPin: true }),
    });
    setRegenerando(false);
    if (res.ok) {
      const actualizado = await res.json();
      setAbonado({ ...abonado, ...actualizado });
    }
  }

  // --- Crear pegue rapido desde aqui ---
  const [mostrarForm, setMostrarForm] = useState(false);
  const [barrioId, setBarrioId] = useState(barrios[0]?.id || "");
  const [codigoManual, setCodigoManual] = useState("");
  const [serviciosSel, setServiciosSel] = useState<string[]>(servicios.map((s) => s.id));
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  const barrioActual = barrios.find((b) => b.id === barrioId);

  // --- Derecho de conexion (opcional) ---
  const [costoConexion, setCostoConexion] = useState("");
  const [formaPagoConexion, setFormaPagoConexion] = useState<"CONTADO" | "CUOTAS">("CONTADO");
  const [cantidadCuotas, setCantidadCuotas] = useState(2);

  function toggleServicio(id: string) {
    setServiciosSel((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function crearPegue(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setError("");
    const res = await fetch("/api/pegues", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        abonadoId: abonado.id,
        barrioId,
        servicioIds: serviciosSel,
        codigoManual: codigoManual || undefined,
        costoConexion: costoConexion || undefined,
        formaPagoConexion: costoConexion ? formaPagoConexion : "SIN_COBRO",
        cantidadCuotas,
      }),
    });
    setGuardando(false);
    if (res.ok) {
      const nuevoPegue = await res.json();
      setAbonado({ ...abonado, pegues: [...abonado.pegues, nuevoPegue] });
      setMostrarForm(false);
      setCodigoManual("");
    } else {
      const data = await res.json();
      setError(data.error || "Error al crear el pegue");
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <BotonAtras href="/admin/abonados" />

      <div className="card">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-azul">{abonado.nombre}</h1>
              <span className={abonado.activo ? "badge-verde" : "badge-rojo"}>
                {abonado.activo ? "Activo" : "Inactivo"}
              </span>
            </div>
            {abonado.identidad ? (
              <p className="text-gray-500 mt-1">
                Identidad: {abonado.identidad}
                {abonado.identidadAutocompletada && (
                  <span className="badge-verde ml-2">agregada por el abonado</span>
                )}
              </p>
            ) : (
              <span className="badge-naranja inline-block mt-1">⚠ Sin número de identidad</span>
            )}
            <p className="text-gray-500 flex items-center gap-2">
              Código de acceso al portal: <b className="text-azul">{abonado.pin}</b>
              <button type="button" onClick={regenerarPin} disabled={regenerando} className="text-xs text-azul underline">
                {regenerando ? "Generando..." : "Regenerar"}
              </button>
            </p>
            {abonado.telefono && <p className="text-gray-500">Tel: {abonado.telefono}</p>}
            {abonado.direccion && <p className="text-gray-500">{abonado.direccion}</p>}
          </div>
          <button type="button" onClick={() => setEditando(!editando)} className="btn-outline text-sm flex items-center gap-1.5">
            <Pencil size={14} /> {editando ? "Cancelar" : "Editar datos"}
          </button>
        </div>

        {editando && (
          <div className="mt-4 pt-4 border-t space-y-3">
            <div>
              <label className="label">Nombre completo</label>
              <input className="input" value={nombre} onChange={(e) => setNombre(e.target.value)} />
            </div>
            <div>
              <label className="label">Identidad</label>
              <input className="input" value={identidad} onChange={(e) => setIdentidad(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Teléfono</label>
                <input className="input" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
              </div>
              <div>
                <label className="label">Dirección</label>
                <input className="input" value={direccion} onChange={(e) => setDireccion(e.target.value)} />
              </div>
            </div>
            {errorDatos && <p className="text-red-600 text-sm">{errorDatos}</p>}
            <div className="flex items-center gap-3">
              <button type="button" onClick={guardarDatos} disabled={guardandoDatos} className="btn-primario text-sm">
                {guardandoDatos ? "Guardando..." : "Guardar cambios"}
              </button>
              <button type="button" onClick={toggleActivo} className="text-sm text-gray-500">
                {abonado.activo ? "Marcar como inactivo" : "Marcar como activo"}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-azul">Pegues de este abonado</h2>
          <button type="button" onClick={() => setMostrarForm(!mostrarForm)} className="btn-primario text-sm flex items-center gap-1.5">
            <Plus size={14} /> {mostrarForm ? "Cancelar" : "Agregar pegue"}
          </button>
        </div>

        {mostrarForm && (
          <form onSubmit={crearPegue} className="border rounded-lg p-4 mb-4 space-y-3 bg-gray-50">
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="label">Barrio</label>
                <select className="input" value={barrioId} onChange={(e) => setBarrioId(e.target.value)}>
                  {barrios.map((b) => (
                    <option key={b.id} value={b.id}>{b.nombre} ({b.prefijo})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">
                  Código (vacío = automático{barrioActual ? `, ej. ${barrioActual.prefijo}00X` : ""})
                </label>
                <input
                  className="input"
                  placeholder="Automático"
                  value={codigoManual}
                  onChange={(e) => setCodigoManual(e.target.value.toUpperCase())}
                />
              </div>
            </div>

            <div>
              <label className="label">Servicios habilitados</label>
              <div className="flex flex-wrap gap-3">
                {servicios.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 text-sm bg-white border rounded-lg px-3 py-2">
                    <input type="checkbox" checked={serviciosSel.includes(s.id)} onChange={() => toggleServicio(s.id)} />
                    {s.nombre} (L {s.precio.toFixed(2)})
                  </label>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-3">
              <div>
                <label className="label">Derecho de conexión (L, opcional)</label>
                <input
                  type="number"
                  className="input"
                  placeholder="0.00"
                  value={costoConexion}
                  onChange={(e) => setCostoConexion(e.target.value)}
                />
              </div>
              {parseFloat(costoConexion) > 0 && (
                <>
                  <div>
                    <label className="label">Forma de pago</label>
                    <select className="input" value={formaPagoConexion} onChange={(e) => setFormaPagoConexion(e.target.value as any)}>
                      <option value="CONTADO">De contado</option>
                      <option value="CUOTAS">En cuotas</option>
                    </select>
                  </div>
                  {formaPagoConexion === "CUOTAS" && (
                    <div>
                      <label className="label">Cantidad de cuotas</label>
                      <input
                        type="number"
                        min={2}
                        max={24}
                        className="input"
                        value={cantidadCuotas}
                        onChange={(e) => setCantidadCuotas(Math.max(2, parseInt(e.target.value) || 2))}
                      />
                    </div>
                  )}
                </>
              )}
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button type="submit" disabled={guardando} className="btn-primario">
              Guardar pegue
            </button>
          </form>
        )}

        <div className="space-y-3">
          {abonado.pegues.map((p) => (
            <div key={p.id} className="border rounded-lg p-3 flex items-center justify-between flex-wrap gap-2">
              <div>
                <p className="font-semibold">{p.codigo}</p>
                <p className="text-sm text-gray-500">
                  {p.barrio.nombre} ·{" "}
                  {p.servicios.filter((ps) => ps.habilitado).map((ps) => ps.servicio.nombre).join(", ")}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={badgeEstado[p.estado]}>{nombreEstado[p.estado]}</span>
                <Link href={`/admin/pagos/nuevo?pegue=${p.codigo}`} title="Registrar pago" className="text-azul">
                  <Wallet size={16} />
                </Link>
                <Link href={`/admin/pegues/${p.id}/historial`} title="Historial" className="text-azul">
                  <History size={16} />
                </Link>
                <Link href={`/admin/pegues/${p.id}`} className="text-azul text-sm font-medium">
                  Ver pegue
                </Link>
              </div>
            </div>
          ))}
          {abonado.pegues.length === 0 && (
            <p className="text-gray-400 text-sm">Este abonado aún no tiene pegues.</p>
          )}
        </div>
      </div>
    </div>
  );
}
