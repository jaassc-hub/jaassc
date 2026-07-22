export const TIPOS_CONEXION = ["VIVIENDA", "SOLAR", "CORRAL", "BIEN_COMUN"] as const;

export const NOMBRE_TIPO_CONEXION: Record<string, string> = {
  VIVIENDA: "Vivienda",
  SOLAR: "Solar",
  CORRAL: "Corral",
  BIEN_COMUN: "Bien común (exento)",
};

// Los pegues de "Bien Comun" no se cobran, aunque tengan servicios habilitados
// (ej. una escuela, iglesia o casa comunal).
export function esTipoExento(tipoConexion: string): boolean {
  return tipoConexion === "BIEN_COMUN";
}
