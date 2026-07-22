import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { NOTIFICACIONES_DEFAULT } from "@/lib/notificacionesConfig";

function mesesEntre(desde: Date, hasta: Date): number {
  return (hasta.getFullYear() - desde.getFullYear()) * 12 + (hasta.getMonth() - desde.getMonth());
}

export async function GET() {
  const configRow = await prisma.configuracion.findUnique({ where: { clave: "notificaciones" } });
  const config = configRow ? { ...NOTIFICACIONES_DEFAULT, ...JSON.parse(configRow.valor) } : NOTIFICACIONES_DEFAULT;

  const hoy = new Date();

  // --- 1. Pegues cortados por mora que llevan mucho tiempo sin reconectarse ---
  // (los INHABILITADOS no cuentan aqui, solo CORTADO)
  const peguesCortados = await prisma.pegue.findMany({
    where: { estado: "CORTADO" },
    include: {
      abonado: true,
      barrio: true,
      eventos: { where: { tipo: "CORTE" }, orderBy: { fecha: "desc" }, take: 1 },
    },
  });

  const alertasCorte = peguesCortados
    .map((p) => {
      const fechaCorte = p.eventos[0]?.fecha || p.updatedAt;
      const meses = mesesEntre(new Date(fechaCorte), hoy);
      return { pegue: p, fechaCorte, meses };
    })
    .filter((a) => a.meses >= config.umbralMesesCorteSinReconexion)
    .map((a) => ({
      pegueId: a.pegue.id,
      codigo: a.pegue.codigo,
      abonadoNombre: a.pegue.abonado.nombre,
      barrio: a.pegue.barrio.nombre,
      fechaCorte: a.fechaCorte,
      mesesSinReconectar: a.meses,
    }));

  // --- 2. Cuotas de conexion atrasadas (sin pagar ninguna cuota en mucho tiempo) ---
  const peguesConCuotasPendientes = await prisma.pegue.findMany({
    where: { cuotas: { some: { pagada: false } } },
    include: {
      abonado: true,
      barrio: true,
      cuotas: { orderBy: { numero: "asc" } },
    },
  });

  const alertasCuota = peguesConCuotasPendientes
    .map((p) => {
      const pagadas = p.cuotas.filter((c) => c.pagada);
      const ultimaPagada = pagadas.length > 0 ? pagadas[pagadas.length - 1] : null;
      const fechaReferencia = ultimaPagada?.fechaPago || p.createdAt;
      const meses = mesesEntre(new Date(fechaReferencia), hoy);
      const siguientePendiente = p.cuotas.find((c) => !c.pagada);
      return { pegue: p, meses, siguientePendiente };
    })
    .filter((a) => a.meses >= config.umbralMesesCuotaAtrasada && a.siguientePendiente)
    .map((a) => ({
      pegueId: a.pegue.id,
      codigo: a.pegue.codigo,
      abonadoNombre: a.pegue.abonado.nombre,
      barrio: a.pegue.barrio.nombre,
      mesesAtraso: a.meses,
      cuotaId: a.siguientePendiente!.id,
      cuotaNumero: a.siguientePendiente!.numero,
      cuotaTotal: a.siguientePendiente!.totalCuotas,
      montoCuota: a.siguientePendiente!.monto,
      multaAplicada: a.siguientePendiente!.multaAplicada,
      montoMultaConfigurado: config.montoMultaCuotaAtrasada,
    }));

  return NextResponse.json({ alertasCorte, alertasCuota });
}
