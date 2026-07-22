"use client";

import { useState, useEffect } from "react";
import { Printer, Pencil } from "lucide-react";
import BotonAtras from "@/components/BotonAtras";
import EnviarWhatsApp from "@/components/EnviarWhatsApp";
import TicketRecibo from "@/components/TicketRecibo";
import { IMPRESORA_DEFAULT } from "@/lib/impresoraConfig";

export default function ReciboClient({
  pago,
  configInicial,
  mesesMoraActual,
  corteActual,
  mensajeWhatsApp,
}: {
  pago: any;
  configInicial: any;
  mesesMoraActual: number;
  corteActual: boolean;
  mensajeWhatsApp?: string;
}) {
  const [config, setConfig] = useState(configInicial);
  const [impresora, setImpresora] = useState(IMPRESORA_DEFAULT);
  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    fetch("/api/config/impresora").then((r) => r.ok && r.json()).then((d) => d && setImpresora(d));
  }, []);

  const junta = process.env.NEXT_PUBLIC_JUNTA_NOMBRE || "Junta de Agua";

  async function guardarConfig() {
    setGuardando(true);
    setMensaje("");
    const res = await fetch("/api/config/recibo", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    setGuardando(false);
    setMensaje(res.ok ? "Guardado. Se usará en todos los recibos." : "Error al guardar.");
  }

  return (
    <div className="max-w-lg mx-auto p-4 md:p-8">
      <div className="no-imprimir flex items-center justify-between mb-4">
        <BotonAtras href="/admin/pagos" />
        <div className="flex gap-2">
          {mensajeWhatsApp && (
            <EnviarWhatsApp telefono={pago.pegue.abonado.telefono} mensaje={mensajeWhatsApp} texto="WhatsApp" />
          )}
          <button type="button" onClick={() => setEditando(!editando)} className="btn-outline text-sm flex items-center gap-1.5">
            <Pencil size={14} /> {editando ? "Cerrar" : "Editar formato"}
          </button>
          <button type="button" onClick={() => window.print()} className="btn-primario text-sm flex items-center gap-1.5">
            <Printer size={14} /> Imprimir
          </button>
        </div>
      </div>

      {editando && (
        <div className="no-imprimir card mb-6 space-y-3">
          <p className="text-sm text-gray-500">
            Estos ajustes se aplican a todos los recibos. El ancho de papel se ajusta desde
            Configuración → Impresora.
          </p>
          <div>
            <label className="label">Título del recibo</label>
            <input
              className="input"
              value={config.tituloRecibo}
              onChange={(e) => setConfig({ ...config, tituloRecibo: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Subtítulo bajo el nombre de la junta (opcional)</label>
            <input
              className="input"
              placeholder="Ej: Directiva 2025-2027"
              value={config.juntaSubtitulo}
              onChange={(e) => setConfig({ ...config, juntaSubtitulo: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Texto grande al final (ej. un lema)</label>
            <input
              className="input"
              value={config.textoPie}
              onChange={(e) => setConfig({ ...config, textoPie: e.target.value })}
            />
          </div>

          <div>
            <label className="label">Información que se muestra en el recibo</label>
            <div className="flex flex-wrap gap-2">
              {[
                { key: "mostrarDNI", label: "DNI del abonado" },
                { key: "mostrarBarrio", label: "Barrio" },
                { key: "mostrarServicios", label: "Servicios" },
                { key: "mostrarTarifa", label: "Tarifa" },
                { key: "mostrarEmitidoPor", label: "Emitido por" },
                { key: "mostrarPin", label: "Código de acceso al portal" },
              ].map((op) => (
                <label key={op.key} className="flex items-center gap-2 text-sm bg-gray-50 border rounded-lg px-3 py-2">
                  <input
                    type="checkbox"
                    checked={config[op.key]}
                    onChange={(e) => setConfig({ ...config, [op.key]: e.target.checked })}
                  />
                  {op.label}
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button type="button" onClick={guardarConfig} disabled={guardando} className="btn-primario text-sm">
              {guardando ? "Guardando..." : "Guardar"}
            </button>
            {mensaje && <span className="text-sm text-gray-500">{mensaje}</span>}
          </div>
        </div>
      )}

      <div className="flex justify-center">
        <TicketRecibo
          numeroRecibo={pago.numeroRecibo || pago.id.slice(-6).toUpperCase()}
          fecha={new Date(pago.fechaPago)}
          juntaNombre={junta}
          juntaSubtitulo={config.juntaSubtitulo}
          tituloRecibo={config.tituloRecibo}
          abonadoNombre={pago.pegue.abonado.nombre}
          codigo={pago.pegue.codigo}
          identidad={pago.pegue.abonado.identidad}
          barrioNombre={pago.pegue.barrio.nombre}
          serviciosNombres={pago.pegue.servicios.filter((ps: any) => ps.habilitado).map((ps: any) => ps.servicio.nombre)}
          tarifaMensual={pago.montoServicios}
          meses={[{ mes: pago.mesPagado, anio: pago.anioPagado, mesesMora: pago.mesesMora, monto: pago.total }]}
          montoServiciosTotal={pago.montoServicios}
          montoMoraTotal={pago.montoMora}
          montoReconexionTotal={pago.montoReconexion}
          montoDescuentoTotal={pago.montoDescuento}
          motivoDescuento={pago.motivoDescuento}
          total={pago.total}
          metodoPago={pago.metodoPago}
          mesesMoraActual={mesesMoraActual}
          corte={corteActual}
          textoPie={config.textoPie}
          emitidoPor={pago.emitidoPor}
          pin={pago.pegue.abonado.pin}
          anchoColumnas={impresora.anchoColumnas}
          fuente={impresora.fuente}
          mostrarDNI={config.mostrarDNI}
          mostrarBarrio={config.mostrarBarrio}
          mostrarServicios={config.mostrarServicios}
          mostrarTarifa={config.mostrarTarifa}
          mostrarEmitidoPor={config.mostrarEmitidoPor}
          mostrarPin={config.mostrarPin}
        />
      </div>
    </div>
  );
}
