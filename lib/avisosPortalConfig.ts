export type AvisoPortal = {
  id: string;
  tipo: "IMAGEN" | "TEXTO";
  titulo: string;
  cuerpo?: string; // para tipo TEXTO
  imagenUrl?: string; // para tipo IMAGEN, siempre un enlace externo (no se guarda el archivo aqui)
  enlaceUrl?: string; // opcional, ej link a Facebook
  activo: boolean;
  orden: number;
};

export const AVISOS_PORTAL_DEFAULT: { avisos: AvisoPortal[] } = {
  avisos: [],
};
