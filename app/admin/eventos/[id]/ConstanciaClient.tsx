"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Printer } from "lucide-react";
import BotonAtras from "@/components/BotonAtras";
import { IMPRESORA_DEFAULT } from "@/lib/impresoraConfig";

const TITULOS: Record<string, string> = {
  CORTE: "Constancia de Corte de Servicio",
  INHABILITACION: "Constancia de Inhabilitación de Pegue",
  REACTIVACION: "Constancia de Reactivación de Pegue",
};

export default function ConstanciaClient({ evento, juntaNombre }: { evento: any; juntaNombre: string }) {
  const [formato, setFormato] = useState<"CARTA" | "A4" | "MATRICIAL">("CARTA");
  const [impresora, setImpresora] = useState(IMPRESORA_DEFAULT);

  useEffect(() => {
    fetch("/api/config/impresora").then((r) => r.ok && r.json()).then((d) => d && setImpresora(d));
  }, []);

  const titulo = TITULOS[evento.tipo] || "Constancia";
  const fecha = new Date(evento.fecha);

  return (
    <div>
      <div className="no-imprimir flex items-center justify-between mb-4 max-w-2xl mx-auto">
        <BotonAtras href={`/admin/pegues/${evento.pegueId}/historial`} />
        <div className="flex items-center gap-2">
          <select className="input w-auto text-sm" value={formato} onChange={(e) => setFormato(e.target.value as any)}>
            <option value="CARTA">Tamaño Carta</option>
            <option value="A4">Tamaño A4</option>
            <option value="MATRICIAL">Formato impresora matricial</option>
          </select>
          <button onClick={() => window.print()} className="btn-primario text-sm flex items-center gap-1.5">
            <Printer size={14} /> Imprimir
          </button>
        </div>
      </div>

      {formato === "MATRICIAL" ? (
        <div
          className="ticket-recibo bg-white text-black mx-auto p-4"
          style={{
            fontFamily: impresora.fuente,
            width: `${impresora.anchoColumnas}ch`,
            fontSize: 13,
            lineHeight: 1.5,
            boxSizing: "content-box",
          }}
        >
          <p className="text-center font-bold">{juntaNombre.toUpperCase()}</p>
          <p className="whitespace-pre">{"=".repeat(impresora.anchoColumnas)}</p>
          <p className="text-center font-bold">{titulo.toUpperCase()}</p>
          <p className="whitespace-pre">{"=".repeat(impresora.anchoColumnas)}</p>
          <p className="mt-2">Fecha: {fecha.toLocaleDateString("es-HN")} {fecha.toLocaleTimeString("es-HN", { hour: "2-digit", minute: "2-digit" })}</p>
          <p className="whitespace-pre mt-2">{"-".repeat(impresora.anchoColumnas)}</p>
          <p>Pegue: {evento.pegue.codigo}</p>
          <p>Abonado: {evento.pegue.abonado.nombre}</p>
          <p>Barrio: {evento.pegue.barrio.nombre}</p>
          <p className="whitespace-pre mt-2">{"-".repeat(impresora.anchoColumnas)}</p>
          <p>Motivo:</p>
          <p>{evento.nota || "(sin motivo registrado)"}</p>
          <p className="whitespace-pre mt-2">{"-".repeat(impresora.anchoColumnas)}</p>
          <p>Realizado por: {evento.realizadoPor || "—"}</p>
          <p className="whitespace-pre mt-2">{"=".repeat(impresora.anchoColumnas)}</p>
        </div>
      ) : (
        <div
          className="nota-mora bg-white text-gray-900 mx-auto p-10"
          style={{
            width: formato === "A4" ? "210mm" : "215.9mm",
            minHeight: formato === "A4" ? "297mm" : "279.4mm",
            fontFamily: "Georgia, 'Times New Roman', serif",
          }}
        >
          <div className="flex items-center gap-4 border-b-2 border-azul pb-4 mb-6">
            <Image src="/sello.png" alt="Sello" width={72} height={72} />
            <div>
              <h1 className="text-2xl font-bold text-azul leading-tight">{titulo}</h1>
              <p className="text-sm text-gray-500">{juntaNombre}</p>
            </div>
          </div>

          <table className="w-full text-sm mb-6">
            <tbody>
              <tr><td className="py-1 text-gray-500 w-48">Fecha</td><td className="py-1 font-medium">{fecha.toLocaleDateString("es-HN")} {fecha.toLocaleTimeString("es-HN", { hour: "2-digit", minute: "2-digit" })}</td></tr>
              <tr><td className="py-1 text-gray-500">Código de pegue</td><td className="py-1 font-medium">{evento.pegue.codigo}</td></tr>
              <tr><td className="py-1 text-gray-500">Abonado</td><td className="py-1 font-medium">{evento.pegue.abonado.nombre}</td></tr>
              {evento.pegue.abonado.identidad && (
                <tr><td className="py-1 text-gray-500">Identidad</td><td className="py-1 font-medium">{evento.pegue.abonado.identidad}</td></tr>
              )}
              <tr><td className="py-1 text-gray-500">Barrio</td><td className="py-1 font-medium">{evento.pegue.barrio.nombre}</td></tr>
            </tbody>
          </table>

          <p className="text-xs font-bold text-azul uppercase mb-2">Motivo</p>
          <p className="text-sm leading-relaxed mb-6 border border-gray-300 rounded p-3 min-h-[60px]">
            {evento.nota || "(sin motivo registrado)"}
          </p>

          <div className="flex justify-between mt-16 mb-6">
            <div className="flex-1 text-center">
              <div className="border-t border-gray-400 pt-1 max-w-xs mx-auto">
                <p className="text-sm font-semibold">{evento.realizadoPor || "____________________"}</p>
                <p className="text-xs text-gray-500">Realizado por</p>
              </div>
            </div>
            <div className="flex-1 text-center">
              <div className="border-t border-gray-400 pt-1 max-w-xs mx-auto">
                <p className="text-sm font-semibold">&nbsp;</p>
                <p className="text-xs text-gray-500">Firma del abonado (si aplica)</p>
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-400 border-t border-gray-300 pt-2">
            Documento generado por el sistema de control de pagos — {juntaNombre}
          </p>
        </div>
      )}
    </div>
  );
}
