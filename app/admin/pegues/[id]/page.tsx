import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { obtenerUsuarioActual } from "@/lib/auth";
import { tienePermiso } from "@/lib/permisos";
import AccesoDenegado from "@/components/AccesoDenegado";
import { mesesDeMora, calcularMontoMora, sujetoACorte, siguienteMesPendiente } from "@/lib/mora";
import { MORA_DEFAULT } from "@/lib/moraConfig";
import { asegurarPin } from "@/lib/pin";
import { esTipoExento } from "@/lib/tipoConexion";
import PegueDetalleClient from "./PegueDetalleClient";

export default async function PegueDetallePage({ params }: { params: { id: string } }) {
  const usuario = await obtenerUsuarioActual();
  if (!tienePermiso(usuario, "abonados")) {
    return <AccesoDenegado modulo="Pegues y abonados" />;
  }

  const [pegue, barrios, servicios, moraConfigRow] = await Promise.all([
    prisma.pegue.findUnique({
      where: { id: params.id },
      include: {
        abonado: true,
        barrio: true,
        servicios: { include: { servicio: true } },
        pagos: { orderBy: [{ anioPagado: "desc" }, { mesPagado: "desc" }] },
        cuotas: { orderBy: { numero: "asc" } },
        planesPago: { include: { cuotas: { orderBy: { numero: "asc" } } }, orderBy: { createdAt: "desc" } },
      },
    }),
    prisma.barrio.findMany({ orderBy: { nombre: "asc" } }),
    prisma.servicio.findMany({ where: { activo: true }, orderBy: { nombre: "asc" } }),
    prisma.configuracion.findUnique({ where: { clave: "mora" } }),
  ]);

  if (!pegue) notFound();

  const pin = await asegurarPin(pegue.abonadoId);
  pegue.abonado.pin = pin;

  const tramos = moraConfigRow ? JSON.parse(moraConfigRow.valor).tramos : MORA_DEFAULT.tramos;
  const montoServicios = esTipoExento(pegue.tipoConexion)
    ? 0
    : pegue.servicios.filter((ps) => ps.habilitado).reduce((s, ps) => s + ps.servicio.precio, 0);
  const pendiente = siguienteMesPendiente(pegue.pagos[0] || null, pegue.createdAt);
  const mesesMora = mesesDeMora(pendiente.mes, pendiente.anio);
  const montoAdeudado = montoServicios * mesesMora; // deuda total estimada (todos los meses vencidos)
  const montoMora = calcularMontoMora(montoAdeudado, mesesMora, tramos);
  const corte = sujetoACorte(mesesMora);

  return (
    <PegueDetalleClient
      pegueInicial={JSON.parse(JSON.stringify(pegue))}
      barrios={barrios}
      servicios={servicios}
      estadoCuenta={{
        montoServicios,
        pendiente,
        mesesMora,
        montoMora,
        corte,
        sinPagos: pegue.pagos.length === 0,
        totalEstimado: montoAdeudado + montoMora,
      }}
    />
  );
}
