"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, UserPlus, Check } from "lucide-react";

type Servicio = { id: string; nombre: string; precio: number };
type Barrio = { id: string; nombre: string; prefijo: string };

export default function NuevoPegueClient({
  barrios,
  servicios,
}: {
  barrios: Barrio[];
  servicios: Servicio[];
}) {
  const router = useRouter();

  // --- Seleccion / creacion del abonado ---
  const [queryAbonado, setQueryAbonado] = useState("");
  const [resultados, setResultados] = useState<any[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [abonadoSeleccionado, setAbonadoSeleccionado] = useState<any>(null);
  const [mostrarFormNuevo, setMostrarFormNuevo] = useState(false);

  const [nombreNuevo, setNombreNuevo] = useState("");
  const [identidadNueva, setIdentidadNueva] = useState("");
  const [telefonoNuevo, setTelefonoNuevo] = useState("");
  const [direccionNueva, setDireccionNueva] = useState("");
  const [creandoAbonado, setCreandoAbonado] = useState(false);

  // --- Datos del pegue ---
  const [barrioId, setBarrioId] = useState(barrios[0]?.id || "");
  const [codigoManual, setCodigoManual] = useState("");
  const [serviciosSel, setServiciosSel] = useState<string[]>(servicios.map((s) => s.id));
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  // --- Derecho de conexion ---
  const [costoConexion, setCostoConexion] = useState("");
  const [formaPagoConexion, setFormaPagoConexion] = useState<"SIN_COBRO" | "CONTADO" | "CUOTAS">("SIN_COBRO");
  const [cantidadCuotas, setCantidadCuotas] = useState(2);
  const [metodoPagoContado, setMetodoPagoContado] = useState("EFECTIVO");
  const [referenciaContado, setReferenciaContado] = useState("");

  const barrioActual = barrios.find((b) => b.id === barrioId);

  async function buscarAbonados(e: React.FormEvent) {
    e.preventDefault();
    if (!queryAbonado) return;
    setBuscando(true);
    const res = await fetch(`/api/abonados?q=${encodeURIComponent(queryAbonado)}`);
    setBuscando(false);
    if (res.ok) setResultados(await res.json());
  }

  async function crearAbonado() {
    if (!nombreNuevo) {
      setError("El nombre del abonado es requerido");
      return;
    }
    setCreandoAbonado(true);
    setError("");
    const res = await fetch("/api/abonados", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: nombreNuevo,
        identidad: identidadNueva,
        telefono: telefonoNuevo,
        direccion: direccionNueva,
      }),
    });
    setCreandoAbonado(false);
    if (res.ok) {
      const abonado = await res.json();
      setAbonadoSeleccionado({ ...abonado, pegues: [] });
      setMostrarFormNuevo(false);
    } else {
      const data = await res.json();
      setError(data.error || "Error al crear el abonado");
    }
  }

  function toggleServicio(id: string) {
    setServiciosSel((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function crearPegue() {
    if (!abonadoSeleccionado) {
      setError("Primero busque o cree el abonado dueño de este pegue");
      return;
    }
    setGuardando(true);
    setError("");
    const res = await fetch("/api/pegues", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        abonadoId: abonadoSeleccionado.id,
        barrioId,
        servicioIds: serviciosSel,
        codigoManual: codigoManual || undefined,
        costoConexion: costoConexion || undefined,
        formaPagoConexion,
        cantidadCuotas,
        metodoPagoContado,
        referenciaContado,
      }),
    });
    setGuardando(false);
    if (res.ok) {
      const nuevoPegue = await res.json();
      router.push(`/admin/pegues/${nuevoPegue.id}`);
    } else {
      const data = await res.json();
      setError(data.error || "Error al crear el pegue");
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-azul">Nuevo pegue</h1>

      {/* Paso 1: abonado dueño del pegue */}
      <div className="card space-y-3">
        <h2 className="font-semibold text-azul">1. Abonado dueño de este pegue</h2>

        {abonadoSeleccionado ? (
          <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Check size={18} className="text-green-600" />
              <div>
                <p className="font-medium text-sm">{abonadoSeleccionado.nombre}</p>
                {abonadoSeleccionado.identidad && (
                  <p className="text-xs text-gray-500">{abonadoSeleccionado.identidad}</p>
                )}
              </div>
            </div>
            <button type="button"
              onClick={() => setAbonadoSeleccionado(null)}
              className="text-sm text-azul font-medium"
            >
              Cambiar
            </button>
          </div>
        ) : (
          <>
            <form onSubmit={buscarAbonados} className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="label">Buscar abonado existente (nombre o identidad)</label>
                <input
                  className="input"
                  value={queryAbonado}
                  onChange={(e) => setQueryAbonado(e.target.value)}
                  placeholder="Ej: Juan Pérez"
                  autoFocus
                />
              </div>
              <button type="submit" disabled={buscando} className="btn-primario flex items-center gap-1.5">
                <Search size={16} /> Buscar
              </button>
            </form>

            {resultados.length > 0 && (
              <div className="border rounded-lg divide-y max-h-56 overflow-y-auto">
                {resultados.map((a) => (
                  <button type="button"
                    key={a.id}
                    onClick={() => setAbonadoSeleccionado(a)}
                    className="w-full text-left p-2 hover:bg-gray-50 text-sm"
                  >
                    <p className="font-medium">{a.nombre}</p>
                    <p className="text-xs text-gray-400">
                      {a.identidad || "sin identidad"} · {a.pegues.length} pegue(s)
                    </p>
                  </button>
                ))}
              </div>
            )}

            <div className="border-t pt-3">
              {!mostrarFormNuevo ? (
                <button type="button"
                  onClick={() => setMostrarFormNuevo(true)}
                  className="btn-outline text-sm flex items-center gap-1.5"
                >
                  <UserPlus size={16} /> No lo encontré, crear abonado nuevo
                </button>
              ) : (
                <div className="space-y-3 bg-gray-50 border rounded-lg p-4">
                  <div>
                    <label className="label">Nombre completo</label>
                    <input className="input" value={nombreNuevo} onChange={(e) => setNombreNuevo(e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Identidad (opcional)</label>
                    <input className="input" value={identidadNueva} onChange={(e) => setIdentidadNueva(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Teléfono</label>
                      <input className="input" value={telefonoNuevo} onChange={(e) => setTelefonoNuevo(e.target.value)} />
                    </div>
                    <div>
                      <label className="label">Dirección</label>
                      <input className="input" value={direccionNueva} onChange={(e) => setDireccionNueva(e.target.value)} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={crearAbonado} disabled={creandoAbonado} className="btn-primario text-sm">
                      {creandoAbonado ? "Creando..." : "Crear abonado y continuar"}
                    </button>
                    <button type="button" onClick={() => setMostrarFormNuevo(false)} className="btn-outline text-sm">
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Paso 2: datos del pegue */}
      <div className="card space-y-3">
        <h2 className="font-semibold text-azul">2. Datos del pegue</h2>
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
              <label key={s.id} className="flex items-center gap-2 text-sm bg-gray-50 border rounded-lg px-3 py-2">
                <input type="checkbox" checked={serviciosSel.includes(s.id)} onChange={() => toggleServicio(s.id)} />
                {s.nombre} (L {s.precio.toFixed(2)})
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Paso 3: derecho de conexion (opcional) */}
      <div className="card space-y-3">
        <h2 className="font-semibold text-azul">3. Derecho de conexión (opcional)</h2>
        <p className="text-sm text-gray-500">
          Si va a cobrar por instalar este pegue nuevo, indique el costo y si se paga de
          contado o en cuotas.
        </p>

        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="label">Costo de conexión (L, vacío = no cobrar)</label>
            <input
              type="number"
              className="input"
              placeholder="0.00"
              value={costoConexion}
              onChange={(e) => {
                setCostoConexion(e.target.value);
                if (!e.target.value) setFormaPagoConexion("SIN_COBRO");
                else if (formaPagoConexion === "SIN_COBRO") setFormaPagoConexion("CONTADO");
              }}
            />
          </div>
          {parseFloat(costoConexion) > 0 && (
            <div>
              <label className="label">Forma de pago</label>
              <select
                className="input"
                value={formaPagoConexion}
                onChange={(e) => setFormaPagoConexion(e.target.value as any)}
              >
                <option value="CONTADO">De contado (ya se cobró)</option>
                <option value="CUOTAS">En cuotas</option>
              </select>
            </div>
          )}
        </div>

        {parseFloat(costoConexion) > 0 && formaPagoConexion === "CONTADO" && (
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="label">Método de pago</label>
              <select className="input" value={metodoPagoContado} onChange={(e) => setMetodoPagoContado(e.target.value)}>
                <option value="EFECTIVO">Efectivo</option>
                <option value="TRANSFERENCIA">Transferencia</option>
                <option value="DEPOSITO">Depósito bancario</option>
                <option value="OTRO">Otro</option>
              </select>
            </div>
            <div>
              <label className="label">Referencia (opcional)</label>
              <input className="input" value={referenciaContado} onChange={(e) => setReferenciaContado(e.target.value)} />
            </div>
          </div>
        )}

        {parseFloat(costoConexion) > 0 && formaPagoConexion === "CUOTAS" && (
          <div>
            <label className="label">¿En cuántas cuotas?</label>
            <input
              type="number"
              min={2}
              max={24}
              className="input w-32"
              value={cantidadCuotas}
              onChange={(e) => setCantidadCuotas(Math.max(2, parseInt(e.target.value) || 2))}
            />
            <p className="text-xs text-gray-500 mt-1">
              Quedarían {cantidadCuotas} cuotas de aproximadamente L{" "}
              {(parseFloat(costoConexion) / cantidadCuotas).toFixed(2)} cada una, cobrables
              desde la ficha del pegue.
            </p>
          </div>
        )}

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button type="button" onClick={crearPegue} disabled={guardando} className="btn-primario w-full">
          {guardando ? "Guardando..." : "Guardar pegue"}
        </button>
      </div>
    </div>
  );
}
