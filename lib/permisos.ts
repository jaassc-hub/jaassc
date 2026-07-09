export const MODULOS = [
  { key: "abonados", label: "Abonados y pegues" },
  { key: "pagos", label: "Registrar y ver pagos" },
  { key: "caja", label: "Informe de caja" },
  { key: "servicios", label: "Servicios y tarifas" },
  { key: "barrios", label: "Barrios y códigos" },
  { key: "configuracion", label: "Configuración del sistema (usuarios, impresora, recibo)" },
] as const;

export type ModuloKey = (typeof MODULOS)[number]["key"];

// Presidente y Tesorero siempre tienen acceso total a todo el sistema.
// Los demas roles solo ven lo que el administrador les habilite en "permisos".
const ROLES_ACCESO_TOTAL = ["PRESIDENTE", "TESORERO"];

export type UsuarioConPermisos = {
  rol: string;
  permisos: string; // JSON string
} | null;

export function tienePermiso(usuario: UsuarioConPermisos, modulo: ModuloKey): boolean {
  if (!usuario) return false;
  if (ROLES_ACCESO_TOTAL.includes(usuario.rol)) return true;
  try {
    const permisos: string[] = JSON.parse(usuario.permisos || "[]");
    return permisos.includes(modulo);
  } catch {
    return false;
  }
}

export function esAccesoTotal(usuario: UsuarioConPermisos): boolean {
  return !!usuario && ROLES_ACCESO_TOTAL.includes(usuario.rol);
}

export const NOMBRE_ROL: Record<string, string> = {
  PRESIDENTE: "Presidente",
  TESORERO: "Tesorero",
  SECRETARIA: "Secretaria",
  FISCAL: "Fiscal",
  VOCAL: "Vocal",
  COBRADOR: "Cobrador (solo cobros)",
};
