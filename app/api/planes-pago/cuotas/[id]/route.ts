import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerUsuarioActual } from "@/lib/auth";
import { generarCorrelativo } from "@/lib/correlativo";
import { siguienteMesPendiente } from "@/lib/mora";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const usuarioActual = await obtenerUsuarioActual();
  const emitidoPor = usuarioActual ? usuarioActual.nombre || usuarioActual.username : null;

  const cuota = await prisma.cuotaPlanPago.findUnique({
    where: { id: params.id },
    include: { planPago: { include: { cuotas: true, pegue: { include: { servicios: { include: { servicio: true } }, pagos: { orderBy: [{ anioPagado: "desc" }, { mesPagado: "desc" }], take: 1 } } } } } },
  });
  if (!cuota) {
    return NextResponse.json({ error: "Cuota no encontrada" }, { status: 404 });
  }
  if (cuota.pagada) {
    return NextResponse.json({ error: "Esa cuota ya está pagada" }, { status: 400 });
  }

  const resultado = await prisma.$transaction(async (tx) => {
    const numeroRecibo = await generarCorrelativo(tx, "PAGO");

    const cuotaPagada = await tx.cuotaPlanPago.update({
      where: { id: params.id },
      data: {
        pagada: true,
        fechaPago: body.fechaPago ? new Date(body.fechaPago) : new Date(),
        metodoPago: body.metodoPago || "EFECTIVO",
        referencia: body.referencia || null,
        numeroRecibo,
        emitidoPor,
      },
    });

    const cuotasDelPlan = cuota.planPago.cuotas.map((c) => (c.id === params.id ? { ...c, pagada: true } : c));
    const todasPagadas = cuotasDelPlan.every((c) => c.pagada);

    if (todasPagadas) {
      // Se completo el plan: se marca terminado y se liquidan en el sistema normal
      // todos los meses que este plan cubria (los que ya debia + los del plan),
      // para que el resto del sistema (mora, libro diario, portal) vea todo al dia.
      await tx.planPago.update({ where: { id: cuota.planPago.id }, data: { estado: "COMPLETADO" } });

      const pegue = cuota.planPago.pegue;
      const montoServicios = pegue.tipoConexion === "BIEN_COMUN"
        ? 0
        : pegue.servicios.filter((ps) => ps.habilitado).reduce((s, ps) => s + ps.servicio.precio, 0);
      const pendiente = siguienteMesPendiente(pegue.pagos[0] || null, pegue.createdAt);

      // Meses viejos que ya debia + los meses que representa el plan (4)
      const totalMesesALiquidar = Math.round(cuota.planPago.deudaOriginal / (montoServicios || 1)) + cuota.planPago.cantidadCuotas;
      const loteId = `plan-${cuota.planPago.id}`;

      let mes = pendiente.mes;
      let anio = pendiente.anio;
      for (let i = 0; i < totalMesesALiquidar; i++) {
        const yaExiste = await tx.pago.findUnique({
          where: { pegueId_mesPagado_anioPagado: { pegueId: pegue.id, mesPagado: mes, anioPagado: anio } },
        }).catch(() => null);

        if (!yaExiste) {
          await tx.pago.create({
            data: {
              pegueId: pegue.id,
              mesPagado: mes,
              anioPagado: anio,
              montoServicios,
              montoMora: i === 0 ? cuota.planPago.moraOriginal : 0,
              mesesMora: 0,
              total: i === 0 ? montoServicios + cuota.planPago.moraOriginal : montoServicios,
              metodoPago: body.metodoPago || "EFECTIVO",
              observaciones: "Liquidado mediante plan de pagos",
              loteId,
              numeroRecibo,
              emitidoPor,
            },
          });
        }

        mes++;
        if (mes > 12) { mes = 1; anio++; }
      }
    }

    return { cuotaPagada, todasPagadas };
  });

  return NextResponse.json(resultado);
}
