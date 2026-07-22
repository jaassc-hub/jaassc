import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerUsuarioActual } from "@/lib/auth";
import { mesesDeMora, calcularMontoMora, siguienteMesPendiente, nombreMes } from "@/lib/mora";
import { MORA_DEFAULT } from "@/lib/moraConfig";
import { MONTO_MINIMO_PLAN_PAGO, PLAZO_MAXIMO_PLAN_PAGO, redondearBase5 } from "@/lib/planPagoConfig";

function limpiarCuotas(valor: string | null): number {
  const n = parseInt(valor || "");
  if (!n || n < 1) return PLAZO_MAXIMO_PLAN_PAGO;
  return Math.min(n, PLAZO_MAXIMO_PLAN_PAGO);
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const usuarioActual = await obtenerUsuarioActual();
  if (!usuarioActual) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const cantidadCuotas = limpiarCuotas(req.nextUrl.searchParams.get("cuotas"));

  const pegue = await prisma.pegue.findUnique({
    where: { id: params.id },
    include: { servicios: { include: { servicio: true } }, pagos: { orderBy: [{ anioPagado: "desc" }, { mesPagado: "desc" }], take: 1 } },
  });
  if (!pegue) {
    return NextResponse.json({ error: "Pegue no encontrado" }, { status: 404 });
  }

  const moraConfigRow = await prisma.configuracion.findUnique({ where: { clave: "mora" } });
  const tramos = moraConfigRow ? JSON.parse(moraConfigRow.valor).tramos : MORA_DEFAULT.tramos;

  const montoServicios = pegue.tipoConexion === "BIEN_COMUN"
    ? 0
    : pegue.servicios.filter((ps) => ps.habilitado).reduce((s, ps) => s + ps.servicio.precio, 0);
  const pendiente = siguienteMesPendiente(pegue.pagos[0] || null, pegue.createdAt);
  const mesesMora = mesesDeMora(pendiente.mes, pendiente.anio);
  const deudaOriginal = montoServicios * mesesMora;
  const moraOriginal = calcularMontoMora(deudaOriginal, mesesMora, tramos);
  const montoCuota = redondearBase5(
    deudaOriginal / cantidadCuotas + montoServicios + moraOriginal / cantidadCuotas
  );

  return NextResponse.json({
    montoServicios,
    mesesMora,
    deudaOriginal,
    moraOriginal,
    montoCuota,
    cantidadCuotas,
    cuotasMaximo: PLAZO_MAXIMO_PLAN_PAGO,
    totalPlan: montoCuota * cantidadCuotas,
    califica: deudaOriginal >= MONTO_MINIMO_PLAN_PAGO,
    montoMinimo: MONTO_MINIMO_PLAN_PAGO,
  });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const usuarioActual = await obtenerUsuarioActual();
  if (!usuarioActual) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const cantidadCuotas = Math.max(1, Math.min(PLAZO_MAXIMO_PLAN_PAGO, parseInt(body.cantidadCuotas) || PLAZO_MAXIMO_PLAN_PAGO));

  const pegue = await prisma.pegue.findUnique({
    where: { id: params.id },
    include: { servicios: { include: { servicio: true } }, pagos: { orderBy: [{ anioPagado: "desc" }, { mesPagado: "desc" }], take: 1 }, planesPago: { where: { estado: "ACTIVO" } } },
  });
  if (!pegue) {
    return NextResponse.json({ error: "Pegue no encontrado" }, { status: 404 });
  }
  if (pegue.planesPago.length > 0) {
    return NextResponse.json({ error: "Este pegue ya tiene un plan de pagos activo" }, { status: 400 });
  }

  const moraConfigRow = await prisma.configuracion.findUnique({ where: { clave: "mora" } });
  const tramos = moraConfigRow ? JSON.parse(moraConfigRow.valor).tramos : MORA_DEFAULT.tramos;

  const montoServicios = pegue.tipoConexion === "BIEN_COMUN"
    ? 0
    : pegue.servicios.filter((ps) => ps.habilitado).reduce((s, ps) => s + ps.servicio.precio, 0);
  const pendiente = siguienteMesPendiente(pegue.pagos[0] || null, pegue.createdAt);
  const mesesMora = mesesDeMora(pendiente.mes, pendiente.anio);
  const deudaOriginal = montoServicios * mesesMora;
  const moraOriginal = calcularMontoMora(deudaOriginal, mesesMora, tramos);

  if (deudaOriginal < MONTO_MINIMO_PLAN_PAGO) {
    return NextResponse.json(
      { error: `La deuda debe ser de al menos L${MONTO_MINIMO_PLAN_PAGO} para poder dividirla en un plan de pagos.` },
      { status: 400 }
    );
  }

  // Cada cuota = una parte de la deuda vieja + la tarifa del mes que va corriendo +
  // una parte de la mora ya generada. Se redondea hacia abajo al multiplo de 5.
  const montoCuota = redondearBase5(
    deudaOriginal / cantidadCuotas + montoServicios + moraOriginal / cantidadCuotas
  );

  const plan = await prisma.planPago.create({
    data: {
      pegueId: params.id,
      deudaOriginal,
      moraOriginal,
      cantidadCuotas,
      montoCuota,
      creadoPor: usuarioActual.nombre || usuarioActual.username,
      cuotas: {
        create: Array.from({ length: cantidadCuotas }, (_, i) => {
          const hoy = new Date();
          const mesIdx = (hoy.getMonth() + i) % 12;
          const anioEtiqueta = hoy.getFullYear() + Math.floor((hoy.getMonth() + i) / 12);
          return {
            numero: i + 1,
            mesEtiqueta: `${nombreMes(mesIdx + 1)} ${anioEtiqueta}`,
            monto: montoCuota,
          };
        }),
      },
    },
    include: { cuotas: { orderBy: { numero: "asc" } } },
  });

  return NextResponse.json(plan);
}
