"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, History, AlertTriangle, CreditCard, Printer, Banknote, Gift, Settings2 } from "lucide-react";
import {
  mesesDeMora,
  calcularMontoMora,
  sujetoACorte,
  nombreMes,
  siguienteMesPendiente,
  mesesConsecutivos,
  TramoMora,
} from "@/lib/mora";
import { MORA_DEFAULT } from "@/lib/moraConfig";
import { DESCUENTOS_DEFAULT } from "@/lib/descuentosConfig";
import { calificaTerceraEdad, calificaPagoAdelantado } from "@/lib/descuentos";

function RegistrarPagoInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [q, setQ] = useState(searchParams.get("pegue") || "");
  const [resultadosLista, setResultadosLista] = useState<any[]>([]);
  const [pegue, setPegue] = useState<any>(null);
  const [error, setError] = useState("");
  const [buscando, setBuscando] = useState(false);

  const [tramosMora, setTramosMora] = useState<TramoMora[]>(MORA_DEFAULT.tramos);
  const [reglasDescuento, setReglasDescuento] = useState(DESCUENTOS_DEFAULT);

  const [cantidadMeses, setCantidadMeses] = useState(1);
  const [mesManual, setMesManual] = useState(new Date().getMonth() + 1);
  const [anioManual, setAnioManual] = useState(new Date().getFullYear());
  const [metodoPago, setMetodoPago] = useState("EFECTIVO");
  const [referencia, setReferencia] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [incluyeReconexion, setIncluyeReconexion] = useState(false);
  const [montoReconexion, setMontoReconexion] = useState("200");
  const [fechaPago, setFechaPago] = useState(() => new Date().toISOString().slice(0, 10));
  const [guardando, setGuardando] = useState(false);

  // --- Descuentos / regalias ---
  const [usarTerceraEdad, setUsarTerceraEdad] = useState(false);
  const [usarPagoAdelantado, setUsarPagoAdelantado] = useState(false);
  const [descManualTipo, setDescManualTipo] = useState<"monto" | "porcentaje">("monto");
  const [descManualValor, setDescManualValor] = useState("");
  const [descManualMotivo, setDescManualMotivo] = useState("");

  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [historial, setHistorial] = useState<any>(null);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);

  const [editandoIdentidad, setEditandoIdentidad] = useState(false);
  const [nuevaIdentidad, setNuevaIdentidad] = useState("");
  const [guardandoIdentidad, setGuardandoIdentidad] = useState(false);

  useEffect(() => {
    fetch("/api/config/mora").then((r) => r.ok && r.json()).then((d) => d && setTramosMora(d.tramos));
    fetch("/api/config/descuentos").then((r) => r.ok && r.json()).then((d) => d && setReglasDescuento(d));
  }, []);

  function prepararPegue(data: any) {
    setPegue(data);
    setResultadosLista([]);
    setQ(data.codigo);
    setCantidadMeses(1);
    setNuevaIdentidad(data.abonado.identidad || "");
    if (data.pagos.length === 0) {
      const alta = new Date(data.createdAt);
      setMesManual(alta.getMonth() + 1);
      setAnioManual(alta.getFullYear());
    }
    // sugerir automaticamente los descuentos que apliquen
    setUsarTerceraEdad(calificaTerceraEdad(data.abonado.identidad, reglasDescuento.terceraEdad));
  }

  async function buscarPorCodigoDirecto(codigo: string) {
    setBuscando(true);
    setError("");
    setPegue(null);
    setHistorial(null);
    setMostrarHistorial(false);
    const res = await fetch(`/api/pegues?codigo=${encodeURIComponent(codigo)}`);
    setBuscando(false);
    if (res.ok) {
      prepararPegue(await res.json());
    } else {
      const data = await res.json();
      setError(data.error || "No encontrado");
    }
  }

  async function buscar(e?: React.FormEvent) {
    e?.preventDefault();
    if (!q.trim()) return;
    setBuscando(true);
    setError("");
    setPegue(null);
    setResultadosLista([]);
    setHistorial(null);
    setMostrarHistorial(false);
    const res = await fetch(`/api/pegues/buscar?q=${encodeURIComponent(q.trim())}`);
    const data = await res.json();
    setBuscando(false);
    if (!res.ok) {
      setError(data.error || "No se encontró nada");
      return;
    }
    if (data.tipo === "pegue") {
      prepararPegue(data.pegue);
    } else {
      setResultadosLista(data.abonados);
    }
  }

  useEffect(() => {
    if (searchParams.get("pegue")) buscarPorCodigoDirecto(searchParams.get("pegue")!);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function cargarHistorial() {
    if (!pegue) return;
    setMostrarHistorial(!mostrarHistorial);
    if (!historial) {
      setCargandoHistorial(true);
      const res = await fetch(`/api/pegues/${pegue.id}/historial`);
      setCargandoHistorial(false);
      if (res.ok) setHistorial(await res.json());
    }
  }

  async function guardarIdentidad() {
    if (!pegue) return;
    setGuardandoIdentidad(true);
    const res = await fetch(`/api/abonados/${pegue.abonado.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identidad: nuevaIdentidad }),
    });
    setGuardandoIdentidad(false);
    if (res.ok) {
      const actualizado = await res.json();
      setPegue({ ...pegue, abonado: { ...pegue.abonado, identidad: actualizado.identidad } });
      setEditandoIdentidad(false);
    }
  }

  const sinPagosPrevios = pegue ? pegue.pagos.length === 0 : false;

  const pendiente = pegue
    ? sinPagosPrevios
      ? { mes: mesManual, anio: anioManual }
      : siguienteMesPendiente(pegue.pagos[0], new Date(pegue.createdAt))
    : null;

  const listaMeses = pendiente ? mesesConsecutivos(pendiente.mes, pendiente.anio, cantidadMeses) : [];

  const montoServicios = pegue
    ? pegue.tipoConexion === "BIEN_COMUN"
      ? 0
      : pegue.servicios
          .filter((ps: any) => ps.habilitado)
          .reduce((s: number, ps: any) => s + ps.servicio.precio, 0)
    : 0;

  // Mora: se calcula UNA vez sobre el total adeudado, no mes por mes
  const mesesMoraBase = pendiente ? mesesDeMora(pendiente.mes, pendiente.anio, new Date(fechaPago)) : 0;
  const mesesVencidosEnEsteCobro = Math.min(cantidadMeses, mesesMoraBase);
  const montoAdeudado = montoServicios * mesesVencidosEnEsteCobro;
  const montoMoraTotal = calcularMontoMora(montoAdeudado, mesesMoraBase, tramosMora);
  const corteMax = sujetoACorte(mesesMoraBase);

  const totalServicios = montoServicios * listaMeses.length;
  const totalReconexion = incluyeReconexion ? parseFloat(montoReconexion || "0") : 0;

  // Descuentos
  const calificaTercera = pegue ? calificaTerceraEdad(pegue.abonado.identidad, reglasDescuento.terceraEdad) : false;
  const calificaAdelantado = calificaPagoAdelantado(cantidadMeses, new Date(fechaPago), reglasDescuento.pagoAdelantado);
  const descTerceraEdad = usarTerceraEdad && calificaTercera ? totalServicios * (reglasDescuento.terceraEdad.porcentaje / 100) : 0;
  const descAdelantado = usarPagoAdelantado && calificaAdelantado ? totalServicios * (reglasDescuento.pagoAdelantado.porcentaje / 100) : 0;
  const descManual = descManualValor
    ? descManualTipo === "monto"
      ? parseFloat(descManualValor) || 0
      : totalServicios * ((parseFloat(descManualValor) || 0) / 100)
    : 0;
  const descuentoTotal = descTerceraEdad + descAdelantado + descManual;

  const motivosDescuento = [
    usarTerceraEdad && calificaTercera ? "Tercera edad" : null,
    usarPagoAdelantado && calificaAdelantado ? "Pago adelantado" : null,
    descManual > 0 && descManualMotivo ? descManualMotivo : null,
  ].filter(Boolean);

  const totalGeneral = totalServicios + montoMoraTotal + totalReconexion - descuentoTotal;

  const otrosPeguesAlerta = pegue
    ? pegue.abonado.pegues
        .filter((p: any) => p.id !== pegue.id)
        .map((p: any) => {
          const pend = siguienteMesPendiente(p.pagos[0] || null, new Date(p.createdAt));
          const meses = mesesDeMora(pend.mes, pend.anio);
          return { ...p, mesesMora: meses };
        })
        .filter((p: any) => p.mesesMora >= 3 || p.estado === "CORTADO")
    : [];

  async function confirmarPago() {
    setGuardando(true);
    setError("");
    const res = await fetch("/api/pagos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pegueId: pegue.id,
        mesPagado: pendiente!.mes,
        anioPagado: pendiente!.anio,
        cantidadMeses,
        metodoPago,
        referencia,
        observaciones,
        incluyeReconexion,
        montoReconexion,
        montoDescuento: descuentoTotal > 0 ? descuentoTotal : undefined,
        motivoDescuento: motivosDescuento.length ? motivosDescuento.join(" + ") : undefined,
        fechaPago,
      }),
    });
    setGuardando(false);
    if (res.ok) {
      const data = await res.json();
      router.push(data.loteId ? `/admin/recibo/lote/${data.loteId}` : `/admin/recibo/${data.pago.id}`);
    } else {
      const data = await res.json();
      setError(data.error || "Error al registrar el pago");
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="bg-azul text-white rounded-xl p-3">
          <Banknote size={24} strokeWidth={1.8} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-azul">Cobrar</h1>
          <p className="text-gray-500 text-sm">Busque al abonado por código, identidad o nombre.</p>
        </div>
      </div>

      <form onSubmit={buscar} className="card">
        <div className="relative">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full border-2 border-azul/20 focus:border-azul rounded-xl pl-12 pr-4 py-4 text-lg outline-none"
            placeholder="Código de pegue, identidad o nombre del abonado..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            autoFocus
          />
        </div>
        <button type="submit" disabled={buscando} className="btn-primario w-full mt-3 flex items-center justify-center gap-2 text-base py-3">
          <Search size={18} /> {buscando ? "Buscando..." : "Buscar"}
        </button>
      </form>

      {error && !pegue && <p className="text-red-600 text-sm">{error}</p>}

      {resultadosLista.length > 0 && (
        <div className="card">
          <p className="text-sm text-gray-500 mb-2">Varias coincidencias, elija el pegue a cobrar:</p>
          <div className="divide-y">
            {resultadosLista.map((a) => (
              <div key={a.id} className="py-2">
                <p className="font-medium text-sm">{a.nombre}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {a.pegues.map((p: any) => (
                    <button type="button"
                      key={p.id}
                      onClick={() => buscarPorCodigoDirecto(p.codigo)}
                      className="text-xs bg-azul/10 text-azul px-2 py-1 rounded-md hover:bg-azul/20"
                    >
                      {p.codigo} ({p.barrio.nombre})
                    </button>
                  ))}
                  {a.pegues.length === 0 && <span className="text-xs text-gray-400">Sin pegues</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {pegue && (
        <>
          {pegue.abonado.pin && (
            <div className="card border-azul/20 bg-azul/5 flex items-center justify-between flex-wrap gap-2">
              <p className="text-sm text-azul">
                Código de acceso al portal para <b>{pegue.abonado.nombre}</b>:{" "}
                <b className="text-lg">{pegue.abonado.pin}</b>
              </p>
              <p className="text-xs text-gray-500">
                Dele este código junto con el código de pegue ({pegue.codigo}) para que consulte
                su cuenta en línea, aunque no tenga identidad registrada.
              </p>
            </div>
          )}

          {!pegue.abonado.identidad && (
            <div className="card border-orange-300 bg-orange-50">
              <p className="font-semibold text-orange-700 flex items-center gap-2">
                <CreditCard size={18} /> Este abonado no tiene número de identidad registrado
              </p>
              <p className="text-sm text-orange-700 mb-2 mt-1">
                No es obligatorio (ya puede entrar al portal con el código de acceso de arriba),
                pero es una buena idea completarla si el abonado se la da.
              </p>
              {editandoIdentidad ? (
                <div className="flex gap-2">
                  <input
                    className="input"
                    value={nuevaIdentidad}
                    onChange={(e) => setNuevaIdentidad(e.target.value)}
                    placeholder="Número de identidad"
                  />
                  <button type="button" onClick={guardarIdentidad} disabled={guardandoIdentidad} className="btn-primario text-sm whitespace-nowrap">
                    Guardar
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => setEditandoIdentidad(true)} className="btn-outline text-sm">
                  + Agregar identidad ahora
                </button>
              )}
            </div>
          )}

          {otrosPeguesAlerta.length > 0 && (
            <div className="card border-red-300 bg-red-50">
              <p className="font-semibold text-red-700 mb-2 flex items-center gap-2">
                <AlertTriangle size={18} /> Este abonado tiene otro(s) pegue(s) que requieren atención
              </p>
              <ul className="text-sm space-y-1">
                {otrosPeguesAlerta.map((p: any) => (
                  <li key={p.id} className="flex items-center justify-between">
                    <span>
                      {p.codigo} ({p.barrio.nombre}) —{" "}
                      {p.estado === "CORTADO" ? "cortado" : `${p.mesesMora} mes(es) en mora`}
                    </span>
                    <button type="button" onClick={() => buscarPorCodigoDirecto(p.codigo)} className="text-azul font-medium">
                      Cobrar este también
                    </button>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-red-600 mt-2">
                No deje ir al abonado sin avisarle de esta otra deuda.
              </p>
            </div>
          )}

          <div className="card space-y-4 border-2 border-azul/10">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-bold text-xl text-azul">{pegue.codigo}</p>
                <p className="text-gray-700">{pegue.abonado.nombre}</p>
                <p className="text-sm text-gray-400">{pegue.barrio.nombre}</p>
                {pegue.estado === "CORTADO" && (
                  <span className="badge-rojo mt-1 inline-block">Pegue actualmente cortado</span>
                )}
                {pegue.estado === "INACTIVO" && (
                  <span className="badge-naranja mt-1 inline-block">Pegue inhabilitado</span>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                <Link
                  href={`/admin/pegues/${pegue.id}`}
                  target="_blank"
                  className="btn-outline text-xs whitespace-nowrap flex items-center gap-1.5"
                >
                  <Settings2 size={14} /> Ver / administrar pegue
                </Link>
                <button type="button" onClick={cargarHistorial} className="btn-outline text-xs whitespace-nowrap flex items-center gap-1.5">
                  <History size={14} /> {mostrarHistorial ? "Ocultar historial" : "Ver historial"}
                </button>
              </div>
            </div>

            {pegue.cuotas && pegue.cuotas.some((c: any) => !c.pagada) && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm text-orange-700 flex items-center justify-between flex-wrap gap-2">
                <span>
                  Este pegue tiene {pegue.cuotas.filter((c: any) => !c.pagada).length} cuota(s) de
                  conexión pendiente(s). El cobro de la tarifa mensual no las incluye.
                </span>
                <Link href={`/admin/pegues/${pegue.id}`} className="text-azul font-medium whitespace-nowrap">
                  Cobrar cuota
                </Link>
              </div>
            )}

            {mostrarHistorial && (
              <div className="border rounded-lg p-3 bg-gray-50 max-h-64 overflow-y-auto text-sm">
                {cargandoHistorial && <p className="text-gray-400">Cargando...</p>}
                {historial &&
                  historial.linea.map((item: any, i: number) => (
                    <div key={i} className="border-b last:border-0 py-1.5">
                      {item.tipo === "PAGO" ? (
                        <div className="flex justify-between">
                          <span>
                            Pago {nombreMes(item.detalle.mesPagado)} {item.detalle.anioPagado}
                            {item.detalle.montoMora > 0 && " (con mora)"}
                            {item.detalle.montoReconexion > 0 && " · reconexión"}
                          </span>
                          <span className="text-gray-500">
                            {new Date(item.fecha).toLocaleDateString("es-HN")} · L {item.detalle.total.toFixed(2)}
                          </span>
                        </div>
                      ) : (
                        <div className="flex justify-between text-orange-700">
                          <span>
                            {item.detalle.tipo === "CORTE" && "Servicio cortado"}
                            {item.detalle.tipo === "RECONEXION" && "Reconexión pagada"}
                            {item.detalle.tipo === "REACTIVACION" && "Reactivado manualmente"}
                            {item.detalle.tipo === "INHABILITACION" && "Pegue inhabilitado"}
                          </span>
                          <span className="text-gray-500">
                            {new Date(item.fecha).toLocaleDateString("es-HN")}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                {historial && historial.linea.length === 0 && (
                  <p className="text-gray-400">Sin movimientos registrados aún.</p>
                )}
              </div>
            )}

            {sinPagosPrevios && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm text-orange-700">
                Este pegue no tiene ningún pago registrado. Elija manualmente desde qué mes empieza a
                deber, para no forzarlo a pagar desde el mes actual si tiene meses pendientes anteriores.
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">
                  {sinPagosPrevios ? "Mes desde el que empieza a pagar" : "Próximo mes pendiente"}
                </label>
                {sinPagosPrevios ? (
                  <select
                    className="input"
                    value={mesManual}
                    onChange={(e) => setMesManual(parseInt(e.target.value))}
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={m}>{nombreMes(m)}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    className="input bg-gray-100"
                    readOnly
                    value={pendiente ? `${nombreMes(pendiente.mes)} ${pendiente.anio}` : ""}
                  />
                )}
              </div>
              <div>
                <label className="label">{sinPagosPrevios ? "Año" : "¿Cuántos meses va a pagar?"}</label>
                {sinPagosPrevios ? (
                  <input
                    type="number"
                    className="input"
                    value={anioManual}
                    onChange={(e) => setAnioManual(parseInt(e.target.value))}
                  />
                ) : (
                  <input
                    type="number"
                    min={1}
                    max={24}
                    className="input"
                    value={cantidadMeses}
                    onChange={(e) => setCantidadMeses(Math.max(1, parseInt(e.target.value) || 1))}
                  />
                )}
              </div>
            </div>

            {sinPagosPrevios && (
              <div>
                <label className="label">¿Cuántos meses va a pagar?</label>
                <input
                  type="number"
                  min={1}
                  max={24}
                  className="input w-32"
                  value={cantidadMeses}
                  onChange={(e) => setCantidadMeses(Math.max(1, parseInt(e.target.value) || 1))}
                />
              </div>
            )}

            <p className="text-xs text-gray-500 -mt-2">
              Se cobrarán: {listaMeses.map((m) => `${nombreMes(m.mes)} ${m.anio}`).join(", ")}
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Fecha real de pago</label>
                <input
                  type="date"
                  className="input"
                  value={fechaPago}
                  onChange={(e) => setFechaPago(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Método de pago</label>
                <select className="input" value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)}>
                  <option value="EFECTIVO">Efectivo</option>
                  <option value="TRANSFERENCIA">Transferencia</option>
                  <option value="DEPOSITO">Depósito bancario</option>
                  <option value="OTRO">Otro</option>
                </select>
              </div>
            </div>

            {metodoPago !== "EFECTIVO" && (
              <div>
                <label className="label">Referencia / número de comprobante</label>
                <input className="input" value={referencia} onChange={(e) => setReferencia(e.target.value)} />
              </div>
            )}

            <label className="flex items-center gap-2 text-sm bg-gray-50 border rounded-lg px-3 py-2">
              <input
                type="checkbox"
                checked={incluyeReconexion}
                onChange={(e) => setIncluyeReconexion(e.target.checked)}
              />
              Incluir pago de reconexión
              {incluyeReconexion && (
                <input
                  type="number"
                  className="input w-28 ml-auto"
                  value={montoReconexion}
                  onChange={(e) => setMontoReconexion(e.target.value)}
                />
              )}
            </label>

            {/* Descuentos y regalias */}
            <div className="border rounded-lg p-3 bg-gray-50 space-y-2">
              <p className="text-sm font-semibold text-azul flex items-center gap-1.5">
                <Gift size={16} /> Descuentos y regalías
              </p>

              {calificaTercera && (
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={usarTerceraEdad} onChange={(e) => setUsarTerceraEdad(e.target.checked)} />
                  Aplicar tercera edad ({reglasDescuento.terceraEdad.porcentaje}% — este abonado califica por edad)
                </label>
              )}
              {calificaAdelantado && (
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={usarPagoAdelantado} onChange={(e) => setUsarPagoAdelantado(e.target.checked)} />
                  Aplicar pago adelantado ({reglasDescuento.pagoAdelantado.porcentaje}% — califica por pagar {cantidadMeses} meses de una vez)
                </label>
              )}

              <div className="grid grid-cols-[auto_1fr] gap-2 items-center pt-1">
                <select
                  className="input w-auto text-sm"
                  value={descManualTipo}
                  onChange={(e) => setDescManualTipo(e.target.value as "monto" | "porcentaje")}
                >
                  <option value="monto">L (monto fijo)</option>
                  <option value="porcentaje">%</option>
                </select>
                <input
                  type="number"
                  className="input text-sm"
                  placeholder="Descuento manual"
                  value={descManualValor}
                  onChange={(e) => setDescManualValor(e.target.value)}
                />
              </div>
              {parseFloat(descManualValor) > 0 && (
                <input
                  className="input text-sm"
                  placeholder="Motivo del descuento/regalía (obligatorio si es manual)"
                  value={descManualMotivo}
                  onChange={(e) => setDescManualMotivo(e.target.value)}
                />
              )}
            </div>

            <div>
              <label className="label">Observaciones (opcional)</label>
              <input className="input" value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
            </div>

            <div className="bg-azul text-white rounded-xl p-4 space-y-1">
              <div className="flex justify-between text-sm text-white/85">
                <span>Servicios ({listaMeses.length} mes(es))</span>
                <span>L {totalServicios.toFixed(2)}</span>
              </div>
              {montoMoraTotal > 0 && (
                <div className="flex justify-between text-sm text-white/85">
                  <span>Mora ({mesesMoraBase} mes(es) de atraso)</span>
                  <span>L {montoMoraTotal.toFixed(2)}</span>
                </div>
              )}
              {incluyeReconexion && (
                <div className="flex justify-between text-sm text-white/85">
                  <span>Reconexión</span>
                  <span>L {totalReconexion.toFixed(2)}</span>
                </div>
              )}
              {descuentoTotal > 0 && (
                <div className="flex justify-between text-sm text-white/85">
                  <span>Descuento</span>
                  <span>- L {descuentoTotal.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-2xl border-t border-white/20 pt-2 mt-2">
                <span>TOTAL</span>
                <span>L {totalGeneral.toFixed(2)}</span>
              </div>
              {corteMax && (
                <p className="bg-red-500 inline-block px-2 py-0.5 rounded-full text-xs font-semibold mt-2">
                  ⚠ Sujeto a corte por mora (más de 3 meses)
                </p>
              )}
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}

            {pegue.estado === "INACTIVO" ? (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm text-orange-700 text-center">
                Este pegue está <b>inhabilitado</b> — no se le puede cobrar hasta que lo reactive
                (con un motivo) desde <Link href={`/admin/pegues/${pegue.id}`} className="underline font-medium">su ficha</Link>.
              </div>
            ) : (
              <button type="button" onClick={confirmarPago} disabled={guardando} className="btn-primario w-full flex items-center justify-center gap-2 text-base py-3.5">
                <Printer size={18} />
                {guardando ? "Guardando..." : `Cobrar L ${totalGeneral.toFixed(2)} e imprimir recibo`}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function RegistrarPagoClient() {
  return (
    <Suspense fallback={<p>Cargando...</p>}>
      <RegistrarPagoInner />
    </Suspense>
  );
}
