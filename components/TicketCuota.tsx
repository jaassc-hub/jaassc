function fila(izquierda: string, derecha: string, ancho: number): string {
  const espacio = Math.max(1, ancho - izquierda.length - derecha.length);
  return izquierda + " ".repeat(espacio) + derecha;
}

function centrado(texto: string, ancho: number): string {
  const espacio = Math.max(0, ancho - texto.length);
  const izq = Math.floor(espacio / 2);
  return " ".repeat(izq) + texto;
}

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
  const A = anchoColumnas;
  const linea = "=".repeat(A);
  const guion = "-".repeat(A);
  const ABREV_METODO: Record<string, string> = {
    EFECTIVO: "EFE",
    TRANSFERENCIA: "TRA",
    DEPOSITO: "DEP",
    OTRO: "OTR",
  };

  const renglones: string[] = [];
  renglones.push(centrado(juntaNombre.toUpperCase(), A));
  if (juntaSubtitulo) renglones.push(centrado(juntaSubtitulo, A));
  renglones.push(linea);
  renglones.push(centrado("RECIBO DE CONEXION", A));
  renglones.push(linea);
  renglones.push("");
  renglones.push(`Recibo #  ${numeroRecibo}`);
  renglones.push(
    `Fecha emision: ${fecha.toLocaleDateString("es-HN")} ${fecha.toLocaleTimeString("es-HN", { hour: "2-digit", minute: "2-digit" })}`
  );
  renglones.push("");
  renglones.push(guion);
  renglones.push("DATOS DEL ABONADO");
  renglones.push(guion);
  renglones.push(`Nombre:  ${abonadoNombre}`);
  renglones.push(`Codigo:  ${codigo}`);
  if (mostrarDNI && identidad) renglones.push(`DNI:     ${identidad}`);
  if (mostrarBarrio) renglones.push(`Barrio:  ${barrioNombre}`);
  renglones.push("");
  renglones.push(guion);
  renglones.push("DETALLE DEL COBRO");
  renglones.push(guion);
  renglones.push(totalCuotas > 1 ? `Cuota ${numero} de ${totalCuotas} de conexion` : "Derecho de conexion (pago unico)");
  renglones.push(`MDP: ${ABREV_METODO[metodoPago] || metodoPago.slice(0, 3)}${referencia ? `  Ref: ${referencia}` : ""}`);
  renglones.push(guion);
  renglones.push(fila("TOTAL A PAGAR:", `L${monto.toFixed(2)}`, A));

  if (mostrarEmitidoPor && emitidoPor) {
    renglones.push("");
    renglones.push(`Emitido por: ${emitidoPor}`);
  }
  if (mostrarPin && pin) {
    renglones.push("");
    renglones.push("Consulte su cuenta en linea con el");
    renglones.push(`codigo de pegue y este codigo: ${pin}`);
  }
  renglones.push("");
  renglones.push(centrado(textoPie, A));
  renglones.push(linea);

  return (
    <pre
      className="ticket-recibo bg-white text-black mx-auto p-4"
      style={{
        fontFamily: fuente,
        width: `${A}ch`,
        fontSize: 13,
        lineHeight: 1.5,
        boxSizing: "content-box",
        margin: "0 auto",
        whiteSpace: "pre-wrap",
      }}
    >
      {renglones.join("\n")}
    </pre>
  );
}
