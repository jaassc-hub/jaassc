"use client";

import { useState } from "react";
import { Plus, Trash2, Printer, Search, FileWarning } from "lucide-react";
import NotaMora from "@/components/NotaMora";

export default function NotasMoraClient({
  juntaNombre,
  firmantesIniciales,
  notaConfig,
}: {
  juntaNombre: string;
  firmantesIniciales: any[];
  notaConfig: any;
}) {
  const [modo, setModo] = useState<"individual" | "masivo">("masivo");
  const [codigo, setCodigo] = useState("");
  const [umbral, setUmbral] = useState(notaConfig.umbralMesesDefault || 3);

  const [diaCobro, setDiaCobro] = useState("");
  const [formasPago, setFormasPago] = useState<string[]>([
    "Presentándose personalmente o enviando un representante de su confianza en el punto de cobro habilitado por la Junta.",
  ]);
  const [mensajeAdicional, setMensajeAdicional] = useState("");
  const [montoReconexion, setMontoReconexion] = useState(notaConfig.montoReconexionDefault || 200);
  const [tamanoPapel, setTamanoPapel] = useState<"A4" | "CARTA">(notaConfig.tamanoPapelDefault || "A4");
  const [mostrarImagenesFirma, setMostrarImagenesFirma] = useState(true);
  const [firmantesSel, setFirmantesSel] = useState<string[]>(firmantesIniciales.map((f: any) => f.id));

  const [notas, setNotas] = useState<any[] | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState("");

  function actualizarForma(i: number, valor: string) {
    setFormasPago(formasPago.map((f, idx) => (idx === i ? valor : f)));
  }
  function agregarForma() {
    setFormasPago([...formasPago, ""]);
  }
  function quitarForma(i: number) {
    setFormasPago(formasPago.filter((_, idx) => idx !== i));
  }

  function toggleFirmante(id: string) {
    setFirmantesSel((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function generar() {
    setBuscando(true);
    setError("");
    setNotas(null);
    const params = new URLSearchParams({ modo, umbral: String(umbral) });
    if (modo === "individual") params.set("codigo", codigo);
    const res = await fetch(`/api/notas-mora/datos?${params.toString()}`);
    const data = await res.json();
    setBuscando(false);
    if (!res.ok) {
      setError(data.error || "No se pudo generar");
      return;
    }
    if (data.notas.length === 0) {
      setError("No hay abonados que cumplan ese criterio.");
      return;
    }
    setNotas(data.notas);
  }

  const firmantesParaImprimir = firmantesIniciales.filter((f: any) => firmantesSel.includes(f.id));

  return (
    <div>
      <div className="no-imprimir">
        <div className="flex items-center gap-3 mb-1">
          <div className="bg-azul text-white rounded-xl p-3">
            <FileWarning size={24} strokeWidth={1.8} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-azul">Notas de mora</h1>
            <p className="text-gray-500 text-sm">Genere avisos de pago pendiente, individuales o masivos.</p>
          </div>
        </div>

        <div className="card max-w-2xl space-y-4 mt-6">
          <div className="flex gap-2">
            <button type="button"
              onClick={() => setModo("masivo")}
              className={modo === "masivo" ? "btn-primario text-sm" : "btn-outline text-sm"}
            >
              Masivo (todos los que deben)
            </button>
            <button type="button"
              onClick={() => setModo("individual")}
              className={modo === "individual" ? "btn-primario text-sm" : "btn-outline text-sm"}
            >
              Individual (un abonado)
            </button>
          </div>

          {modo === "masivo" ? (
            <div>
              <label className="label">Generar nota a quien deba más de (meses)</label>
              <input
                type="number"
                min={1}
                className="input w-32"
                value={umbral}
                onChange={(e) => setUmbral(Math.max(1, parseInt(e.target.value) || 1))}
              />
            </div>
          ) : (
            <div>
              <label className="label">Código de cualquiera de sus pegues</label>
              <input
                className="input uppercase"
                placeholder="Ej: GUA001"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.toUpperCase())}
              />
              <p className="text-xs text-gray-400 mt-1">
                Si el abonado tiene más de un pegue, se incluyen todos los que estén en mora.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Día límite de pago (como aparece en la nota)</label>
              <input
                className="input"
                placeholder="Ej: 25 de julio"
                value={diaCobro}
                onChange={(e) => setDiaCobro(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Monto de reconexión (L)</label>
              <input
                type="number"
                className="input"
                value={montoReconexion}
                onChange={(e) => setMontoReconexion(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          <div>
            <label className="label">Formas de pago</label>
            <div className="space-y-2">
              {formasPago.map((f, i) => (
                <div key={i} className="flex gap-2">
                  <input className="input text-sm" value={f} onChange={(e) => actualizarForma(i, e.target.value)} />
                  <button type="button" onClick={() => quitarForma(i)} className="text-red-500 shrink-0">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
            <button type="button" onClick={agregarForma} className="btn-outline text-xs mt-2 flex items-center gap-1.5">
              <Plus size={14} /> Agregar forma de pago
            </button>
          </div>

          <div>
            <label className="label">Mensaje adicional (opcional — ej. recordatorio de reunión)</label>
            <textarea
              className="input min-h-[70px]"
              value={mensajeAdicional}
              onChange={(e) => setMensajeAdicional(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Tamaño de papel</label>
            <select className="input w-40" value={tamanoPapel} onChange={(e) => setTamanoPapel(e.target.value as any)}>
              <option value="A4">A4</option>
              <option value="CARTA">Carta</option>
            </select>
          </div>

          <div>
            <label className="label">Firmas a incluir</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {firmantesIniciales.map((f: any) => (
                <label key={f.id} className="flex items-center gap-1.5 text-sm bg-gray-50 border rounded-lg px-2 py-1">
                  <input type="checkbox" checked={firmantesSel.includes(f.id)} onChange={() => toggleFirmante(f.id)} />
                  {f.nombre || f.cargo || "(sin nombre)"}
                </label>
              ))}
              {firmantesIniciales.length === 0 && (
                <p className="text-xs text-gray-400">
                  No hay firmantes configurados — vaya a Configuración → Firmas.
                </p>
              )}
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={mostrarImagenesFirma}
                onChange={(e) => setMostrarImagenesFirma(e.target.checked)}
              />
              Incluir la imagen de la firma escaneada (si no, se deja el espacio en blanco para firmar a mano)
            </label>
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button type="button" onClick={generar} disabled={buscando} className="btn-primario w-full flex items-center justify-center gap-2">
            <Search size={16} /> {buscando ? "Buscando..." : "Generar vista previa"}
          </button>
        </div>

        {notas && (
          <button type="button"
            onClick={() => window.print()}
            className="btn-primario mt-4 flex items-center gap-2"
          >
            <Printer size={16} /> Imprimir {notas.length > 1 ? `(${notas.length} notas)` : ""}
          </button>
        )}
      </div>

      {notas && (
        <div className="mt-6 flex flex-col items-center gap-8">
          <style>{`
            @media print {
              @page { size: ${tamanoPapel === "A4" ? "A4" : "letter"} portrait; margin: 6mm; }
            }
          `}</style>
          {notas.map((nota, i) => (
            <div key={nota.abonadoId} className={i < notas.length - 1 ? "nota-pagina" : ""}>
              <NotaMora
                juntaNombre={juntaNombre}
                abonadoNombre={nota.abonadoNombre}
                pegues={nota.pegues}
                totalMontoNeto={nota.totalMontoNeto}
                totalRecargo={nota.totalRecargo}
                montoReconexion={montoReconexion}
                diaCobro={diaCobro || "____________"}
                formasPago={formasPago.filter((f) => f.trim())}
                mensajeAdicional={mensajeAdicional}
                firmantes={firmantesParaImprimir}
                mostrarImagenesFirma={mostrarImagenesFirma}
                numeroRegistro={nota.pegues[0]?.codigo || ""}
                config={notaConfig}
                tamanoPapel={tamanoPapel}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
