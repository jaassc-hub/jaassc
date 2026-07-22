"use client";

import { useState, useEffect } from "react";
import { Printer } from "lucide-react";
import BotonAtras from "@/components/BotonAtras";
import EnviarWhatsApp from "@/components/EnviarWhatsApp";
import TicketRecibo from "@/components/TicketRecibo";
import { IMPRESORA_DEFAULT } from "@/lib/impresoraConfig";

export default function ReciboLoteClient({
  pagos,
  configInicial,
  mesesMoraActual,
  corteActual,
  mensajeWhatsApp,
}: {
  pagos: any[];
  configInicial: any;
  mesesMoraActual: number;
  corteActual: boolean;
  mensajeWhatsApp?: string;
}) {
  const [impresora, setImpresora] = useState(IMPRESORA_DEFAULT);
  const primero = pagos[0];
  const junta = process.env.NEXT_PUBLIC_JUNTA_NOMBRE || "Junta de Agua";

  useEffect(() => {
    fetch("/api/config/impresora").then((r) => r.ok && r.json()).then((d) => d && setImpresora(d));
  }, []);

  const totalServicios = pagos.reduce((s, p) => s + p.montoServicios, 0);
  const totalMora = pagos.reduce((s, p) => s + p.montoMora, 0);
  const totalReconexion = pagos.reduce((s, p) => s + p.montoReconexion, 0);
  const totalDescuento = pagos.reduce((s, p) => s + p.montoDescuento, 0);
  const motivoDescuento = pagos.find((p) => p.motivoDescuento)?.motivoDescuento || null;
  const totalGeneral = pagos.reduce((s, p) => s + p.total, 0);

  return (
    <div className="max-w-lg mx-auto p-4 md:p-8">
      <div className="no-imprimir flex items-center justify-between mb-4">
        <BotonAtras href="/admin/pagos" />
        <div className="flex gap-2">
          {mensajeWhatsApp && (
            <EnviarWhatsApp telefono={primero.pegue.abonado.telefono} mensaje={mensajeWhatsApp} texto="WhatsApp" />
          )}
          <button type="button" onClick={() => window.print()} className="btn-primario text-sm flex items-center gap-1.5">
            <Printer size={14} /> Imprimir
          </button>
        </div>
      </div>

      <div className="flex justify-center">
        <TicketRecibo
          numeroRecibo={primero.numeroRecibo || primero.loteId.slice(-6).toUpperCase()}
          fecha={new Date(primero.fechaPago)}
          juntaNombre={junta}
          juntaSubtitulo={configInicial.juntaSubtitulo}
          tituloRecibo={configInicial.tituloRecibo}
          abonadoNombre={primero.pegue.abonado.nombre}
          codigo={primero.pegue.codigo}
          identidad={primero.pegue.abonado.identidad}
          barrioNombre={primero.pegue.barrio.nombre}
          serviciosNombres={primero.pegue.servicios.filter((ps: any) => ps.habilitado).map((ps: any) => ps.servicio.nombre)}
          tarifaMensual={primero.montoServicios}
          meses={pagos.map((p) => ({ mes: p.mesPagado, anio: p.anioPagado, mesesMora: p.mesesMora, monto: p.total }))}
          montoServiciosTotal={totalServicios}
          montoMoraTotal={totalMora}
          montoReconexionTotal={totalReconexion}
          montoDescuentoTotal={totalDescuento}
          motivoDescuento={motivoDescuento}
          total={totalGeneral}
          metodoPago={primero.metodoPago}
          mesesMoraActual={mesesMoraActual}
          corte={corteActual}
          textoPie={configInicial.textoPie}
          emitidoPor={primero.emitidoPor}
          anchoColumnas={impresora.anchoColumnas}
          fuente={impresora.fuente}
          mostrarDNI={configInicial.mostrarDNI}
          mostrarBarrio={configInicial.mostrarBarrio}
          mostrarServicios={configInicial.mostrarServicios}
          mostrarTarifa={configInicial.mostrarTarifa}
          mostrarEmitidoPor={configInicial.mostrarEmitidoPor}
          pin={primero.pegue.abonado.pin}
          mostrarPin={configInicial.mostrarPin}
        />
      </div>
    </div>
  );
}
