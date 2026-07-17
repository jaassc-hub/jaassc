export type Firmante = {
  id: string;
  nombre: string;
  cargo: string;
  periodo: string;
  imagenBase64: string | null; // firma escaneada en PNG, codificada en base64
};

export const FIRMAS_DEFAULT: { firmantes: Firmante[] } = {
  firmantes: [
    { id: "f1", nombre: "", cargo: "Presidente", periodo: "2025-2027", imagenBase64: null },
    { id: "f2", nombre: "", cargo: "Tesorero", periodo: "2025-2027", imagenBase64: null },
    { id: "f3", nombre: "", cargo: "Fiscal", periodo: "2025-2027", imagenBase64: null },
  ],
};
