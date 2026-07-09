import { nombreMes } from "@/lib/mora";

function abreviarServicio(nombre: string): string {
  const palabras = nombre.trim().split(/\s+/);
  if (palabras.length > 1) {
    return palabras.map((p) => p[0]).join("").toUpperCase();
  }
  return nombre.slice(0, 3).toUpperCase();
}

const ABREV_METODO: Record<string, string> = {
  EFECTIVO: "EFE",
  TRANSFERENCIA: "TRA",
  DEPOSITO: "DEP",
  OTRO: "OTR",
};

export type MesTicket = { mes: number; anio: number; mesesMora: number; monto: number };

export default function TicketRecibo({
  numeroRecibo,
  fecha,
  juntaNombre,
  juntaSubtitulo,
  tituloRecibo,
  abonadoNombre,
  codigo,
  identidad,
  barrioNombre,
  serviciosNombres,
  tarifaMensual,
  meses,
  montoServiciosTotal,
  montoMoraTotal,
  montoReconexionTotal,
  montoDescuentoTotal = 0,
  motivoDescuento,
  total,
  metodoPago,
  mesesMoraActual,
  corte,
  textoPie,
  emitidoPor,
  pin,
  anchoColumnas = 40,
  fuente = "monospace",
  mostrarDNI = true,
  mostrarBarrio = true,
  mostrarServicios = true,
  mostrarTarifa = true,
  mostrarEmitidoPor = true,
  mostrarPin = true,
}: {
  numeroRecibo: string;
  fecha: Date;
  juntaNombre: string;
  juntaSubtitulo?: string;
  tituloRecibo: string;
  abonadoNombre: string;
  codigo: string;
  identidad?: string | null;
  barrioNombre: string;
  serviciosNombres: string[];
  tarifaMensual: number;
  meses: MesTicket[];
  montoServiciosTotal: number;
  montoMoraTotal: number;
  montoReconexionTotal: number;
  montoDescuentoTotal?: number;
  motivoDescuento?: string | null;
  total: number;
  metodoPago: string;
  mesesMoraActual: number;
  corte: boolean;
  textoPie: string;
  emitidoPor?: string | null;
  pin?: string | null;
  anchoColumnas?: number;
  fuente?: string;
  mostrarDNI?: boolean;
  mostrarBarrio?: boolean;
  mostrarServicios?: boolean;
  mostrarTarifa?: boolean;
  mostrarEmitidoPor?: boolean;
  mostrarPin?: boolean;
}) {
  const linea = "=".repeat(anchoColumnas);
  const guion = "-".repeat(anchoColumnas);
  const periodoTexto =
    meses.length > 1
      ? `De ${nombreMes(meses[0].mes).toUpperCase()} hasta ${nombreMes(meses[meses.length - 1].mes).toUpperCase()} de ${meses[meses.length - 1].anio}`
      : `${nombreMes(meses[0].mes).toUpperCase()} de ${meses[0].anio}`;

  return (
    <div
      className="ticket-recibo bg-white text-black mx-auto p-4"
      style={{
        fontFamily: fuente,
        width: `${anchoColumnas}ch`,
        fontSize: 13,
        lineHeight: 1.5,
        boxSizing: "content-box",
      }}
    >
      <div className="text-center font-bold">
        <p>{juntaNombre.toUpperCase()}</p>
        {juntaSubtitulo && <p>{juntaSubtitulo}</p>}
      </div>

      <p className="whitespace-pre">{linea}</p>
      <p className="text-center font-bold text-lg my-1">{tituloRecibo}</p>
      <p className="whitespace-pre">{linea}</p>

      <div className="mt-2">
        <p>Recibo #  <b>{numeroRecibo}</b></p>
        <p>
          Fecha emision: {fecha.toLocaleDateString("es-HN")}{" "}
          {fecha.toLocaleTimeString("es-HN", { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>

      <p className="whitespace-pre mt-2">{guion}</p>
      <p className="font-bold">DATOS DEL ABONADO</p>
      <p className="whitespace-pre">{guion}</p>
      <table className="w-full">
        <tbody>
          <tr><td className="pr-2 align-top">Nombre:</td><td>{abonadoNombre}</td></tr>
          <tr><td className="pr-2 align-top">Codigo:</td><td>{codigo}</td></tr>
          {mostrarDNI && identidad && <tr><td className="pr-2 align-top">DNI:</td><td>{identidad}</td></tr>}
          {mostrarBarrio && <tr><td className="pr-2 align-top">Barrio:</td><td>{barrioNombre}</td></tr>}
          {mostrarServicios && (
            <tr><td className="pr-2 align-top">Servicios:</td><td>{serviciosNombres.map(abreviarServicio).join(" / ")}</td></tr>
          )}
          {mostrarTarifa && <tr><td className="pr-2 align-top">Tarifa:</td><td>L{tarifaMensual.toFixed(2)}</td></tr>}
        </tbody>
      </table>

      <p className="whitespace-pre mt-2">{guion}</p>
      <p className="font-bold">DETALLE DEL COBRO</p>
      <p className="whitespace-pre">{guion}</p>
      <p className="font-bold">{periodoTexto}</p>
      <p>Meses pagados: {meses.length}      MDP: {ABREV_METODO[metodoPago] || metodoPago.slice(0, 3)}</p>

      <table className="w-full mt-2 border-t border-black pt-1">
        <tbody>
          <tr>
            <td>Subtotal ({meses.length} x L{tarifaMensual.toFixed(2)})</td>
            <td className="text-right">L{montoServiciosTotal.toFixed(2)}</td>
          </tr>
          <tr><td>Mora</td><td className="text-right">L{montoMoraTotal.toFixed(2)}</td></tr>
          <tr><td>Reconexion</td><td className="text-right">L{montoReconexionTotal.toFixed(2)}</td></tr>
          {montoDescuentoTotal > 0 && (
            <tr><td>Descuento{motivoDescuento ? ` (${motivoDescuento})` : ""}</td><td className="text-right">-L{montoDescuentoTotal.toFixed(2)}</td></tr>
          )}
        </tbody>
      </table>

      <p className="whitespace-pre border-t border-black mt-1 pt-1" />
      <table className="w-full">
        <tbody>
          <tr className="font-bold text-lg">
            <td>TOTAL A PAGAR:</td>
            <td className="text-right">L{total.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>

      <p className="mt-2">
        Meses en Mora a la fecha: <b className="float-right">{mesesMoraActual}</b>
      </p>
      {corte && (
        <p className="font-bold mt-1 border border-black text-center py-1">
          SUJETO A CORTE POR MORA
        </p>
      )}

      {mostrarEmitidoPor && emitidoPor && (
        <p className="mt-2 text-xs">Emitido por: {emitidoPor}</p>
      )}

      {mostrarPin && pin && (
        <p className="mt-2 text-xs border-t border-dashed border-black pt-2">
          Consulte su cuenta en línea con el código de pegue y este código de acceso: <b>{pin}</b>
        </p>
      )}

      <p className="text-center font-bold text-lg mt-4">{textoPie}</p>
      <p className="whitespace-pre mt-2">{linea}</p>
    </div>
  );
}
