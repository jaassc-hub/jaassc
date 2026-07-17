export const NOTA_MORA_DEFAULT = {
  titulo: "Aviso de Pago Pendiente",
  subtitulo: "Junta Administradora de Agua Potable y Saneamiento",
  saludo: "Estimado Abonado:",
  introduccion:
    "Le saludamos cordialmente de parte de la Junta de Agua. La presente tiene como fin " +
    "informarle sobre el estado actual de su cuenta por concepto del servicio de agua " +
    "potable y mantenimiento de la red.",
  reglamento:
    "Le recordamos que, según nuestro reglamento interno, la falta de pago de 2 meses " +
    "consecutivos es motivo de suspensión del servicio (corte), mismo que se mantendrá " +
    "cortado hasta que la deuda sea saldada en su totalidad.",
  cierre1:
    "Si usted ya realizó su pago, por favor presente su recibo para actualizar nuestros " +
    "registros. Si tiene alguna dificultad económica, le invitamos a acercarse a la " +
    "directiva para buscar un arreglo de pago.",
  cierre2:
    "Confiamos en su responsabilidad y agradecemos su atención a este aviso, pues su " +
    "aporte es vital para mantener el buen funcionamiento del sistema de agua en nuestra " +
    "comunidad.",
  piePagina: "Junta Administradora de Agua y Saneamiento - Santa Cruz, El Paraíso",
  telefonos: "+(504) 9754-0822   +(504) 3339-5894",
  montoReconexionDefault: 200,
  umbralMesesDefault: 3, // "mas de 2 meses" = 3 o mas
  tamanoPapelDefault: "A4", // "A4" o "CARTA"
  fuente: "GEORGIA", // clave, ver FUENTES_DISPONIBLES en components/NotaMora.tsx
  colorAcento: "#0F40BC", // hex, por defecto el azul institucional
  estilo: "CLASICO", // "CLASICO" | "MINIMALISTA" | "RECUADRO"
  logoBase64: null as string | null, // si es null, se usa /sello.png
};
