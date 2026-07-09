export const DESCUENTOS_DEFAULT = {
  terceraEdad: {
    activo: false,
    edadMinima: 65,
    porcentaje: 10,
  },
  pagoAdelantado: {
    activo: false,
    mesesMinimos: 6, // paga al menos estos meses de una vez
    mesLimiteAnio: 3, // solo si se paga entre enero y este mes (ej. 3 = hasta marzo)
    porcentaje: 5,
  },
};
