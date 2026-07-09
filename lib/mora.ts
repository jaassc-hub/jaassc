// Reglas de mora de la Junta de Agua.
// Los "meses de mora" se calculan como la diferencia entre el mes/anio actual
// y el mes/anio que se esta cancelando. Ej: si hoy es julio 2026 y se paga
// abril 2026, la deuda tiene 3 meses de mora (abr, may, jun ya vencidos).

export function mesesDeMora(
  mesPagado: number,
  anioPagado: number,
  fechaReferencia: Date = new Date()
): number {
  const mesRef = fechaReferencia.getMonth() + 1;
  const anioRef = fechaReferencia.getFullYear();
  const totalMesesRef = anioRef * 12 + mesRef;
  const totalMesesPago = anioPagado * 12 + mesPagado;
  const diff = totalMesesRef - totalMesesPago;
  return diff > 0 ? diff : 0;
}

export type TramoMora = { id?: string; mesesDesde: number; mesesHasta: number; porcentaje: number };

// Dado cuantos meses de mora tiene la deuda, busca el tramo configurado que le
// corresponde y devuelve su porcentaje. Si se pasa del ultimo tramo definido, usa
// el porcentaje del tramo mas alto (para no dejar deudas viejas sin regla).
export function porcentajeMora(mesesMora: number, tramos: TramoMora[]): number {
  if (mesesMora <= 0 || tramos.length === 0) return 0;
  const tramo = tramos.find((t) => mesesMora >= t.mesesDesde && mesesMora <= t.mesesHasta);
  if (tramo) return tramo.porcentaje;
  const masAlto = [...tramos].sort((a, b) => b.mesesHasta - a.mesesHasta)[0];
  return mesesMora > masAlto.mesesHasta ? masAlto.porcentaje : 0;
}

// La mora se aplica UNA sola vez sobre el monto total adeudado (no mes por mes).
// Ej: si debe L700 (7 meses x L100) y el tramo correspondiente a 7 meses de mora
// es 10%, la mora es L70, sin importar cuantos meses individuales sean.
export function calcularMontoMora(
  montoAdeudado: number,
  mesesMora: number,
  tramos: TramoMora[]
): number {
  const pct = porcentajeMora(mesesMora, tramos);
  return Math.round(montoAdeudado * pct) / 100;
}

// Sujeto a corte si debe mas de 3 meses (es decir, 4 meses en adelante)
export function sujetoACorte(mesesMora: number): boolean {
  return mesesMora > 3;
}

export function nombreMes(mes: number): string {
  const meses = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ];
  return meses[mes - 1] || "";
}

// Genera una lista de {mes, anio} consecutivos, empezando en mesInicio/anioInicio,
// para poder cobrar varios meses de una sola vez (adelantado o atrasado).
export function mesesConsecutivos(
  mesInicio: number,
  anioInicio: number,
  cantidad: number
): { mes: number; anio: number }[] {
  const resultado: { mes: number; anio: number }[] = [];
  let mes = mesInicio;
  let anio = anioInicio;
  for (let i = 0; i < cantidad; i++) {
    resultado.push({ mes, anio });
    mes += 1;
    if (mes > 12) {
      mes = 1;
      anio += 1;
    }
  }
  return resultado;
}
export function siguienteMesPendiente(
  ultimoPago: { mesPagado: number; anioPagado: number } | null,
  fechaAlta: Date
): { mes: number; anio: number } {
  if (!ultimoPago) {
    return { mes: fechaAlta.getMonth() + 1, anio: fechaAlta.getFullYear() };
  }
  let mes = ultimoPago.mesPagado + 1;
  let anio = ultimoPago.anioPagado;
  if (mes > 12) {
    mes = 1;
    anio += 1;
  }
  return { mes, anio };
}
