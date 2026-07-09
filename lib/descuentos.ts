// El numero de identidad hondureno tiene el formato DDDD-AAAA-NNNNN, donde AAAA es el
// anio de nacimiento (posiciones 6 a 9). Se usa para calcular la edad aproximada.
export function edadDesdeIdentidad(identidad: string | null | undefined): number | null {
  if (!identidad) return null;
  const limpio = identidad.replace(/[^0-9]/g, "");
  if (limpio.length < 9) return null;
  const anioNacimiento = parseInt(limpio.slice(4, 8));
  if (!anioNacimiento || anioNacimiento < 1900 || anioNacimiento > new Date().getFullYear()) return null;
  return new Date().getFullYear() - anioNacimiento;
}

export function calificaTerceraEdad(
  identidad: string | null | undefined,
  reglas: { activo: boolean; edadMinima: number }
): boolean {
  if (!reglas.activo) return false;
  const edad = edadDesdeIdentidad(identidad);
  return edad !== null && edad >= reglas.edadMinima;
}

export function calificaPagoAdelantado(
  cantidadMeses: number,
  fechaPago: Date,
  reglas: { activo: boolean; mesesMinimos: number; mesLimiteAnio: number }
): boolean {
  if (!reglas.activo) return false;
  const mesActual = fechaPago.getMonth() + 1;
  return cantidadMeses >= reglas.mesesMinimos && mesActual <= reglas.mesLimiteAnio;
}
