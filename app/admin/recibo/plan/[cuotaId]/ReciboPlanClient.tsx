"use client";

import BotonAtras from "@/components/BotonAtras";
import BotonImprimir from "@/components/BotonImprimir";
import EnviarWhatsApp from "@/components/EnviarWhatsApp";

function centrado(texto: string, ancho: number): string {
  const espacio = Math.max(0, ancho - texto.length);
  return " ".repeat(Math.floor(espacio / 2)) + texto;
}

export default function ReciboPlanClient({
  cuota,
  config,
  impresora,
  juntaNombre,
}: {
  cuota: any;
  config: any;
  impresora: any;
  juntaNombre: string;
}) {
  const plan = cuota.planPago;
  const cuotasPagadas = plan.cuotas.filter((c: any) => c.pagada).length;
  const totalPagadoHastaAhora = plan.cuotas.filter((c: any) => c.pagada).reduce((s: number, c: any) => s + c.monto, 0);
  const totalPlan = plan.montoCuota * plan.cantidadCuotas;
  const faltante = totalPlan - totalPagadoHastaAhora;
  const A = impresora.anchoColumnas;
  const linea = "=".repeat(A);
  const guion = "-".repeat(A);

  const mensajeWhatsApp =
    `Estimado(a) *${plan.pegue.abonado.nombre}*, recibimos su pago del plan de pagos del pegue ${plan.pegue.codigo} ` +
    `(cuota ${cuota.numero} de ${plan.cantidadCuotas}, ${cuota.mesEtiqueta}) por L${cuota.monto.toFixed(2)}. ` +
    `Lleva pagado L${totalPagadoHastaAhora.toFixed(2)} de L${totalPlan.toFixed(2)}, le falta L${faltante.toFixed(2)}. ` +
    `Recibo #${cuota.numeroRecibo}. ¡Gracias por su pago! - ${juntaNombre}`;

  const renglones = [
    centrado(juntaNombre.toUpperCase(), A),
    linea,
    centrado("RECIBO - PLAN DE PAGOS", A),
    linea,
    "",
    `Recibo #  ${cuota.numeroRecibo}`,
    `Fecha: ${new Date(cuota.fechaPago).toLocaleDateString("es-HN")}`,
    "",
    guion,
    "DATOS DEL ABONADO",
    guion,
    `Nombre: ${plan.pegue.abonado.nombre}`,
    `Codigo: ${plan.pegue.codigo}`,
    `Barrio: ${plan.pegue.barrio.nombre}`,
    "",
    guion,
    `PLAN DE PAGOS - CUOTA ${cuota.numero} DE ${plan.cantidadCuotas}`,
    guion,
    `Mes que cubre: ${cuota.mesEtiqueta}`,
    `MDP: ${cuota.metodoPago}${cuota.referencia ? `  Ref: ${cuota.referencia}` : ""}`,
    guion,
    `MONTO DE ESTA CUOTA: L${cuota.monto.toFixed(2)}`,
    guion,
    `Cuotas pagadas: ${cuotasPagadas} de ${plan.cantidadCuotas}`,
    `Pagado hasta ahora: L${totalPagadoHastaAhora.toFixed(2)} de L${totalPlan.toFixed(2)}`,
    faltante > 0 ? `Le falta: L${faltante.toFixed(2)}` : "Plan completado, cuenta al dia",
    ...(config.mostrarEmitidoPor && cuota.emitidoPor ? ["", `Emitido por: ${cuota.emitidoPor}`] : []),
    "",
    centrado(config.textoPie, A),
    linea,
  ];

  return (
    <div className="max-w-lg mx-auto p-4 md:p-8">
      <div className="no-imprimir flex items-center justify-between mb-4">
        <BotonAtras href={`/admin/pegues/${plan.pegueId}`} />
        <div className="flex gap-2">
          <EnviarWhatsApp telefono={plan.pegue.abonado.telefono} mensaje={mensajeWhatsApp} texto="WhatsApp" />
          <BotonImprimir />
        </div>
      </div>

      <pre
        className="ticket-recibo bg-white text-black mx-auto p-4"
        style={{
          fontFamily: impresora.fuente,
          width: `${A}ch`,
          fontSize: 13,
          lineHeight: 1.5,
          boxSizing: "content-box",
          margin: "0 auto",
          whiteSpace: "pre-wrap",
        }}
      >
        {renglones.join("\n")}
      </pre>
    </div>
  );
}
