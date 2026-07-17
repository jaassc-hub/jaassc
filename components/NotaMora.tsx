import Image from "next/image";

export type PegueDeudaNota = {
  codigo: string;
  barrio: string;
  tarifa: number;
  ultimoMesPagado: string;
  ultimoAnioPagado: number | null;
  mesesPendientes: number;
  montoNeto: number;
  recargo: number;
};

export type FirmanteNota = {
  id: string;
  nombre: string;
  cargo: string;
  periodo: string;
  imagenBase64: string | null;
};

export const FUENTES_DISPONIBLES: Record<string, string> = {
  GEORGIA: "Georgia, 'Times New Roman', serif",
  TIMES: "'Times New Roman', Times, serif",
  ARIAL: "Arial, Helvetica, sans-serif",
  VERDANA: "Verdana, Geneva, sans-serif",
  CALIBRI: "Calibri, 'Segoe UI', sans-serif",
};

export default function NotaMora({
  abonadoNombre,
  pegues,
  totalMontoNeto,
  totalRecargo,
  montoReconexion,
  diaCobro,
  formasPago,
  mensajeAdicional,
  firmantes,
  mostrarImagenesFirma,
  numeroRegistro,
  config,
  tamanoPapel = "A4",
}: {
  juntaNombre?: string;
  abonadoNombre: string;
  pegues: PegueDeudaNota[];
  totalMontoNeto: number;
  totalRecargo: number;
  montoReconexion: number;
  diaCobro: string;
  formasPago: string[];
  mensajeAdicional?: string;
  firmantes: FirmanteNota[];
  mostrarImagenesFirma: boolean;
  numeroRegistro: string;
  config: {
    titulo: string;
    subtitulo: string;
    saludo: string;
    introduccion: string;
    reglamento: string;
    cierre1: string;
    cierre2: string;
    piePagina: string;
    telefonos: string;
    fuente?: string;
    colorAcento?: string;
    estilo?: string;
    logoBase64?: string | null;
  };
  tamanoPapel?: "A4" | "CARTA";
}) {
  const totalConRecargo = totalMontoNeto + totalRecargo + montoReconexion;
  const codigosTexto = pegues.map((p) => p.codigo).join(", ");
  const variosP = pegues.length > 1;
  const color = config.colorAcento || "#0F40BC";
  const fontFamily = FUENTES_DISPONIBLES[config.fuente || "GEORGIA"] || FUENTES_DISPONIBLES.GEORGIA;
  const estilo = config.estilo || "CLASICO";
  const esRecuadro = estilo === "RECUADRO";
  const esMinimalista = estilo === "MINIMALISTA";

  return (
    <div
      className="nota-mora bg-white text-gray-900 mx-auto p-10"
      style={{
        width: tamanoPapel === "A4" ? "210mm" : "215.9mm",
        minHeight: tamanoPapel === "A4" ? "297mm" : "279.4mm",
        fontFamily,
        border: esRecuadro ? `2px solid ${color}` : undefined,
      }}
    >
      {/* Encabezado */}
      <div
        className="flex items-center gap-4 pb-4 mb-6"
        style={{ borderBottom: esMinimalista ? "1px solid #d1d5db" : `2px solid ${color}` }}
      >
        {config.logoBase64 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={config.logoBase64} alt="Sello" width={72} height={72} style={{ objectFit: "contain" }} />
        ) : (
          <Image src="/sello.png" alt="Sello" width={72} height={72} />
        )}
        <div>
          <h1 className="text-2xl font-bold leading-tight" style={{ color: esMinimalista ? "#111827" : color }}>
            {config.titulo}
          </h1>
          <p className="text-sm text-gray-500">{config.subtitulo}</p>
        </div>
      </div>

      {/* Saludo */}
      <p className="text-sm font-semibold mb-1">{config.saludo}</p>
      <p className="text-base font-bold mb-4">
        Sr. (a) {abonadoNombre} <span className="font-normal text-gray-500">({codigosTexto})</span>
      </p>

      <p className="text-sm leading-relaxed mb-4">{config.introduccion}</p>

      {/* Detalle de deuda */}
      <p className="text-xs font-bold uppercase mb-2" style={{ color }}>Detalle de su deuda</p>

      {variosP && (
        <table className="w-full text-sm mb-3 border-collapse">
          <thead>
            <tr className="border-b border-gray-300 text-left text-xs text-gray-500">
              <th className="py-1">Pegue</th>
              <th className="py-1">Barrio</th>
              <th className="py-1 text-right">Meses pend.</th>
              <th className="py-1 text-right">Monto neto</th>
              <th className="py-1 text-right">Recargo</th>
            </tr>
          </thead>
          <tbody>
            {pegues.map((p) => (
              <tr key={p.codigo} className="border-b border-gray-100">
                <td className="py-1 font-medium">{p.codigo}</td>
                <td className="py-1">{p.barrio}</td>
                <td className="py-1 text-right">{p.mesesPendientes}</td>
                <td className="py-1 text-right">L {p.montoNeto.toFixed(2)}</td>
                <td className="py-1 text-right">L {p.recargo.toFixed(2)}</td>
              </tr>
            ))}
            <tr className="font-bold">
              <td className="py-1" colSpan={3}>Total</td>
              <td className="py-1 text-right">L {totalMontoNeto.toFixed(2)}</td>
              <td className="py-1 text-right">L {totalRecargo.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      )}

      {!variosP && pegues[0] && (
        <p className="text-sm mb-3">
          Tarifa: <b>L {pegues[0].tarifa.toFixed(2)}</b> &nbsp; Último mes pagado:{" "}
          <b>{pegues[0].ultimoMesPagado}{pegues[0].ultimoAnioPagado ? ` ${pegues[0].ultimoAnioPagado}` : ""}</b>{" "}
          &nbsp; Meses pendientes: <b>{pegues[0].mesesPendientes}</b>
        </p>
      )}

      {/* Tabla de montos antes/despues */}
      <table className="w-full text-sm border border-gray-300 mb-4">
        <thead>
          <tr className="border-b border-gray-300" style={{ backgroundColor: esMinimalista ? "#f9fafb" : `${color}0d` }}>
            <th className="text-left p-2 font-semibold">Concepto</th>
            <th className="text-right p-2 font-semibold">Si paga antes del {diaCobro}</th>
            <th className="text-right p-2 font-semibold">Si paga después del {diaCobro}</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-gray-200">
            <td className="p-2">Monto neto</td>
            <td className="p-2 text-right">L {totalMontoNeto.toFixed(2)}</td>
            <td className="p-2 text-right">L {totalMontoNeto.toFixed(2)}</td>
          </tr>
          <tr className="border-b border-gray-200">
            <td className="p-2">+ Recargo por mora</td>
            <td className="p-2 text-right">L 0.00</td>
            <td className="p-2 text-right">L {totalRecargo.toFixed(2)}</td>
          </tr>
          <tr className="border-b border-gray-200">
            <td className="p-2">+ Reconexión (si aplica)</td>
            <td className="p-2 text-right">L 0.00</td>
            <td className="p-2 text-right">L {montoReconexion.toFixed(2)}</td>
          </tr>
          <tr className="font-bold" style={{ backgroundColor: esMinimalista ? "#f9fafb" : `${color}0d` }}>
            <td className="p-2">Total a pagar</td>
            <td className="p-2 text-right">L {totalMontoNeto.toFixed(2)}</td>
            <td className="p-2 text-right">L {totalConRecargo.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>

      {/* Formas de pago */}
      <p className="text-xs font-bold uppercase mb-2" style={{ color }}>Formas de pago</p>
      <ul className="text-sm list-disc pl-5 mb-4 space-y-1">
        {formasPago.map((f, i) => (
          <li key={i}>{f}</li>
        ))}
      </ul>

      {/* Reglamento */}
      <p className="text-sm leading-relaxed mb-4">{config.reglamento}</p>

      {mensajeAdicional && (
        <div
          className="rounded p-3 text-sm mb-4"
          style={{ border: `1px solid ${color}4d`, backgroundColor: `${color}0d` }}
        >
          {mensajeAdicional}
        </div>
      )}

      <p className="text-sm leading-relaxed mb-3">{config.cierre1}</p>
      <p className="text-sm leading-relaxed mb-8">{config.cierre2}</p>

      {/* Firmas */}
      <div className="flex justify-between gap-6 mt-12 mb-6">
        {firmantes.map((f) => (
          <div key={f.id} className="flex-1 text-center">
            <div className="h-16 flex items-end justify-center mb-1">
              {mostrarImagenesFirma && f.imagenBase64 && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={f.imagenBase64} alt={f.nombre} className="max-h-16 max-w-full object-contain" />
              )}
            </div>
            <div className="border-t border-gray-400 pt-1">
              <p className="text-sm font-semibold">{f.nombre}</p>
              <p className="text-xs text-gray-500">{f.cargo}</p>
              <p className="text-xs text-gray-400">{f.periodo}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Pie de pagina */}
      <div className="border-t border-gray-300 pt-2 flex items-center justify-between text-xs text-gray-500">
        <div>
          <p>{config.piePagina}</p>
          <p>{config.telefonos}</p>
        </div>
        <p>{numeroRegistro}</p>
      </div>
    </div>
  );
}
