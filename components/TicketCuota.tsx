export default function TicketCuota({
  numeroRecibo,
  fecha,
  juntaNombre,
  juntaSubtitulo,
  abonadoNombre,
  codigo,
  identidad,
  barrioNombre,
  numero,
  totalCuotas,
  monto,
  metodoPago,
  referencia,
  emitidoPor,
  pin,
  textoPie,
  anchoColumnas = 40,
  fuente = "monospace",
  mostrarDNI = true,
  mostrarBarrio = true,
  mostrarEmitidoPor = true,
  mostrarPin = true,
}: {
  numeroRecibo: string;
  fecha: Date;
  juntaNombre: string;
  juntaSubtitulo?: string;
  abonadoNombre: string;
  codigo: string;
  identidad?: string | null;
  barrioNombre: string;
  numero: number;
  totalCuotas: number;
  monto: number;
  metodoPago: string;
  referencia?: string | null;
  emitidoPor?: string | null;
  pin?: string | null;
  textoPie: string;
  anchoColumnas?: number;
  fuente?: string;
  mostrarDNI?: boolean;
  mostrarBarrio?: boolean;
  mostrarEmitidoPor?: boolean;
  mostrarPin?: boolean;
}) {
  const linea = "=".repeat(anchoColumnas);
  const guion = "-".repeat(anchoColumnas);
  const ABREV_METODO: Record<string, string> = {
    EFECTIVO: "EFE",
    TRANSFERENCIA: "TRA",
    DEPOSITO: "DEP",
    OTRO: "OTR",
  };

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
      <p className="text-center font-bold text-lg my-1">RECIBO DE CONEXIÓN</p>
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
        </tbody>
      </table>

      <p className="whitespace-pre mt-2">{guion}</p>
      <p className="font-bold">DETALLE DEL COBRO</p>
      <p className="whitespace-pre">{guion}</p>
      <p className="font-bold">
        {totalCuotas > 1 ? `Cuota ${numero} de ${totalCuotas} de conexion` : "Derecho de conexion (pago unico)"}
      </p>
      <p>MDP: {ABREV_METODO[metodoPago] || metodoPago.slice(0, 3)}{referencia ? `  Ref: ${referencia}` : ""}</p>

      <p className="whitespace-pre border-t border-black mt-2 pt-1" />
      <table className="w-full">
        <tbody>
          <tr className="font-bold text-lg">
            <td>TOTAL A PAGAR:</td>
            <td className="text-right">L{monto.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>

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
