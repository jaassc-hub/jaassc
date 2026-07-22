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

// Arma una linea de "etiqueta ......... valor" alineada con espacios reales, en vez de
// una tabla o flexbox -- para que una impresora matricial en modo texto plano (que solo
// entiende texto y saltos de linea, sin CSS) la imprima en el orden y con el espaciado
// correcto.
function fila(izquierda: string, derecha: string, ancho: number): string {
  const espacio = Math.max(1, ancho - izquierda.length - derecha.length);
  return izquierda + " ".repeat(espacio) + derecha;
}

function centrado(texto: string, ancho: number): string {
  const espacio = Math.max(0, ancho - texto.length);
  const izq = Math.floor(espacio / 2);
  return " ".repeat(izq) + texto;
}

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
  const A = anchoColumnas;
  const linea = "=".repeat(A);
  const guion = "-".repeat(A);
  const periodoTexto =
    meses.length > 1
      ? `De ${nombreMes(meses[0].mes).toUpperCase()} hasta ${nombreMes(meses[meses.length - 1].mes).toUpperCase()} de ${meses[meses.length - 1].anio}`
      : `${nombreMes(meses[0].mes).toUpperCase()} de ${meses[0].anio}`;

  const renglones: string[] = [];

  renglones.push(centrado(juntaNombre.toUpperCase(), A));
  if (juntaSubtitulo) renglones.push(centrado(juntaSubtitulo, A));
  renglones.push(linea);
  renglones.push(centrado(tituloRecibo, A));
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
  if (mostrarServicios) renglones.push(`Servicios: ${serviciosNombres.map(abreviarServicio).join(" / ")}`);
  if (mostrarTarifa) renglones.push(`Tarifa:  L${tarifaMensual.toFixed(2)}`);
  renglones.push("");
  renglones.push(guion);
  renglones.push("DETALLE DEL COBRO");
  renglones.push(guion);
  renglones.push(periodoTexto);
  renglones.push(`Meses pagados: ${meses.length}      MDP: ${ABREV_METODO[metodoPago] || metodoPago.slice(0, 3)}`);
  renglones.push(guion);
  renglones.push(fila(`Subtotal (${meses.length} x L${tarifaMensual.toFixed(2)})`, `L${montoServiciosTotal.toFixed(2)}`, A));
  renglones.push(fila("Mora", `L${montoMoraTotal.toFixed(2)}`, A));
  renglones.push(fila("Reconexion", `L${montoReconexionTotal.toFixed(2)}`, A));
  if (montoDescuentoTotal > 0) {
    renglones.push(fila(`Descuento${motivoDescuento ? ` (${motivoDescuento})` : ""}`, `-L${montoDescuentoTotal.toFixed(2)}`, A));
  }
  renglones.push(guion);
  renglones.push(fila("TOTAL A PAGAR:", `L${total.toFixed(2)}`, A));
  renglones.push("");
  renglones.push(fila("Meses en Mora a la fecha:", String(mesesMoraActual), A));
  if (corte) {
    renglones.push("");
    renglones.push(centrado("** SUJETO A CORTE POR MORA **", A));
  }
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
