// Genera un correlativo tipo "26-0001" para el año real de emision (hoy), pero
// llevando la cuenta POR SEPARADO segun el tipo de documento -- para que los
// recibos de pago, las cuotas de conexion, las constancias de corte/inhabilitacion
// y las actas de instalacion no se mezclen en la misma numeracion.
//
// Debe llamarse dentro de una transaccion de Prisma (recibe "tx").
export async function generarCorrelativo(
  tx: any,
  tipo: "PAGO" | "CONEXION" | "EVENTO" | "ACTA"
): Promise<string> {
  const anio = new Date().getFullYear();
  const contador = await tx.contadorRecibo.upsert({
    where: { anio_tipo: { anio, tipo } },
    update: { ultimo: { increment: 1 } },
    create: { anio, tipo, ultimo: 1 },
  });
  return `${String(anio).slice(-2)}-${String(contador.ultimo).padStart(4, "0")}`;
}

// Correlativo para actas/constancias que NO son recibos de cobro: se arma con el
// codigo del propio pegue y cuantas veces le ha pasado eso a ESE pegue en concreto,
// para que quede claro de un vistazo sin tener que buscar en otro lado.
// Ej: ACTIN_LEM126_1 (primera acta de instalacion de LEM126)
//     ACTCOR_LEM126_3 (tercer corte de LEM126)
const PREFIJOS_EVENTO: Record<string, string> = {
  CORTE: "ACTCOR",
  INHABILITACION: "ACTINH",
  REACTIVACION: "ACTREA",
  RECONEXION: "ACTREC",
  ACTA: "ACTIN",
};

export function armarCorrelativoPorPegue(tipo: keyof typeof PREFIJOS_EVENTO, codigoPegue: string, numero: number): string {
  return `${PREFIJOS_EVENTO[tipo]}_${codigoPegue}_${numero}`;
}
