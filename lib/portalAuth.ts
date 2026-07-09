// El portal publico se puede desbloquear con la identidad del abonado (si la tiene
// registrada) o con su codigo de acceso (PIN), que siempre existe. Se centraliza aqui
// para que todas las rutas del portal validen exactamente igual.
export function coincideClave(
  abonado: { identidad: string | null; pin: string | null },
  clave: string
): boolean {
  if (!clave) return false;
  if (abonado.identidad && abonado.identidad === clave) return true;
  if (abonado.pin && abonado.pin === clave) return true;
  return false;
}
