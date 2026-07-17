import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { CONFIG_DEFAULT } from "@/lib/reciboConfig";
import ReciboLoteClient from "./ReciboLoteClient";
import { obtenerUsuarioActual } from "@/lib/auth";
import { tienePermiso } from "@/lib/permisos";
import AccesoDenegado from "@/components/AccesoDenegado";
import { mesesDeMora, sujetoACorte, siguienteMesPendiente } from "@/lib/mora";

export default async function ReciboLotePage({ params }: { params: { loteId: string } }) {
  const usuario = await obtenerUsuarioActual();
  if (!tienePermiso(usuario, "pagos")) {
    return <AccesoDenegado modulo="Pagos" />;
  }

  const [pagos, configRow] = await Promise.all([
    prisma.pago.findMany({
      where: { loteId: params.loteId },
      include: {
        pegue: {
          include: { abonado: true, barrio: true, servicios: { include: { servicio: true } } },
        },
      },
      orderBy: [{ anioPagado: "asc" }, { mesPagado: "asc" }],
    }),
    prisma.configuracion.findUnique({ where: { clave: "recibo" } }),
  ]);

  if (pagos.length === 0) notFound();

  const config = configRow ? JSON.parse(configRow.valor) : CONFIG_DEFAULT;

  // El estado de mora que se muestra en el recibo debe ser el ACTUAL del pegue
  // (despues de este pago), no el historico de cuando cada mes individual estaba
  // vencido -- si no, un pago que pone al dia al abonado seguiria mostrando
  // "sujeto a corte" por error.
  const ultimoPago = await prisma.pago.findFirst({
    where: { pegueId: pagos[0].pegueId },
    orderBy: [{ anioPagado: "desc" }, { mesPagado: "desc" }],
  });
  const pendiente = siguienteMesPendiente(ultimoPago, pagos[0].pegue.createdAt);
  const mesesMoraActual = mesesDeMora(pendiente.mes, pendiente.anio);
  const corteActual = sujetoACorte(mesesMoraActual);

  return (
    <ReciboLoteClient
      pagos={pagos}
      configInicial={config}
      mesesMoraActual={mesesMoraActual}
      corteActual={corteActual}
    />
  );
}
