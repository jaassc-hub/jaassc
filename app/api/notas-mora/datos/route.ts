import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mesesDeMora, calcularMontoMora, siguienteMesPendiente, nombreMes } from "@/lib/mora";
import { MORA_DEFAULT } from "@/lib/moraConfig";

export async function GET(req: NextRequest) {
  const modo = req.nextUrl.searchParams.get("modo") || "masivo";
  const codigo = req.nextUrl.searchParams.get("codigo");
  const umbral = parseInt(req.nextUrl.searchParams.get("umbral") || "3");

  const moraConfigRow = await prisma.configuracion.findUnique({ where: { clave: "mora" } });
  const tramos = moraConfigRow ? JSON.parse(moraConfigRow.valor).tramos : MORA_DEFAULT.tramos;

  const pegues = await prisma.pegue.findMany({
    where: modo === "individual" && codigo ? { codigo: { equals: codigo, mode: "insensitive" } } : {},
    include: {
      abonado: true,
      barrio: true,
      servicios: { include: { servicio: true } },
      pagos: { orderBy: [{ anioPagado: "desc" }, { mesPagado: "desc" }], take: 1 },
    },
  });

  if (modo === "individual" && pegues.length === 0) {
    return NextResponse.json({ error: "No se encontró ese código de pegue" }, { status: 404 });
  }

  // Si es individual, se traen TODOS los pegues de ese abonado (no solo el buscado)
  let peguesRelevantes = pegues;
  if (modo === "individual" && pegues.length > 0) {
    peguesRelevantes = await prisma.pegue.findMany({
      where: { abonadoId: pegues[0].abonadoId },
      include: {
        abonado: true,
        barrio: true,
        servicios: { include: { servicio: true } },
        pagos: { orderBy: [{ anioPagado: "desc" }, { mesPagado: "desc" }], take: 1 },
      },
    });
  }

  const detalles = peguesRelevantes.map((p) => {
    const montoServicios = p.tipoConexion === "BIEN_COMUN"
      ? 0
      : p.servicios.filter((ps) => ps.habilitado).reduce((s, ps) => s + ps.servicio.precio, 0);
    const pendiente = siguienteMesPendiente(p.pagos[0] || null, p.createdAt);
    const mesesMora = mesesDeMora(pendiente.mes, pendiente.anio);
    const montoNeto = montoServicios * mesesMora;
    const recargo = calcularMontoMora(montoNeto, mesesMora, tramos);
    const ultimoPago = p.pagos[0]
      ? `${nombreMes(p.pagos[0].mesPagado)}`
      : "Ninguno";
    return {
      pegueId: p.id,
      codigo: p.codigo,
      barrio: p.barrio.nombre,
      tarifa: montoServicios,
      ultimoMesPagado: ultimoPago,
      ultimoAnioPagado: p.pagos[0]?.anioPagado || null,
      mesesPendientes: mesesMora,
      montoNeto,
      recargo,
      abonadoId: p.abonadoId,
      abonadoNombre: p.abonado.nombre,
      abonadoIdentidad: p.abonado.identidad,
      abonadoTelefono: p.abonado.telefono,
    };
  });

  const umbralUsado = modo === "individual" ? 1 : umbral;
  const conDeuda = detalles.filter((d) => d.mesesPendientes >= umbralUsado && d.montoNeto > 0);

  const porAbonado = new Map<string, typeof conDeuda>();
  for (const d of conDeuda) {
    if (!porAbonado.has(d.abonadoId)) porAbonado.set(d.abonadoId, []);
    porAbonado.get(d.abonadoId)!.push(d);
  }

  const notas = Array.from(porAbonado.entries()).map(([abonadoId, pegues]) => ({
    abonadoId,
    abonadoNombre: pegues[0].abonadoNombre,
    abonadoIdentidad: pegues[0].abonadoIdentidad,
    abonadoTelefono: pegues[0].abonadoTelefono,
    pegues: pegues.map((p) => ({
      codigo: p.codigo,
      barrio: p.barrio,
      tarifa: p.tarifa,
      ultimoMesPagado: p.ultimoMesPagado,
      ultimoAnioPagado: p.ultimoAnioPagado,
      mesesPendientes: p.mesesPendientes,
      montoNeto: p.montoNeto,
      recargo: p.recargo,
    })),
    totalMontoNeto: pegues.reduce((s, p) => s + p.montoNeto, 0),
    totalRecargo: pegues.reduce((s, p) => s + p.recargo, 0),
  }));

  return NextResponse.json({ notas });
}
