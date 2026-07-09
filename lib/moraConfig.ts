import { TramoMora } from "./mora";

export const MORA_DEFAULT: { tramos: TramoMora[] } = {
  tramos: [
    { id: "t1", mesesDesde: 1, mesesHasta: 3, porcentaje: 10 },
    { id: "t2", mesesDesde: 4, mesesHasta: 6, porcentaje: 10 },
    { id: "t3", mesesDesde: 7, mesesHasta: 9, porcentaje: 10 },
    { id: "t4", mesesDesde: 10, mesesHasta: 12, porcentaje: 10 },
    { id: "t5", mesesDesde: 13, mesesHasta: 999, porcentaje: 10 },
  ],
};
