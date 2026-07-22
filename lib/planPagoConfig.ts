// Configuracion del plan de pagos para dividir una deuda grande. A proposito esto
// vive en el codigo y no en el panel de Configuracion, tal como se pidio.
export const MONTO_MINIMO_PLAN_PAGO = 500; // L500 o mas para poder dividir la deuda
export const PLAZO_MAXIMO_PLAN_PAGO = 4; // el usuario elige cuantas cuotas quiere, hasta este maximo

// Redondea hacia ABAJO al multiplo de 5 mas cercano (nunca cobra de mas por redondeo).
export function redondearBase5(monto: number): number {
  return Math.floor(monto / 5) * 5;
}
