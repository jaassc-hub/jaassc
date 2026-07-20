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
