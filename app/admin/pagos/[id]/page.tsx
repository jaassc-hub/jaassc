import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { obtenerUsuarioActual } from "@/lib/auth";
import { tienePermiso } from "@/lib/permisos";
import AccesoDenegado from "@/components/AccesoDenegado";
import ReciboDetalleClient from "./ReciboDetalleClient";

export default async function PagoDetallePage({ params }: { params: { id: string } }) {
  const usuario = await obtenerUsuarioActual();
  if (!tienePermiso(usuario, "pagos")) {
    return <AccesoDenegado modulo="Pagos" />;
  }

  const pago = await prisma.pago.findUnique({
    where: { id: params.id },
    include: { pegue: { include: { abonado: true, barrio: true } } },
  });
  if (!pago) notFound();

  const recibo = pago.loteId
    ? await prisma.pago.findMany({
        where: { loteId: pago.loteId },
        orderBy: [{ anioPagado: "asc" }, { mesPagado: "asc" }],
      })
    : [pago];

  return (
    <ReciboDetalleClient
      pegue={JSON.parse(JSON.stringify(pago.pegue))}
      recibo={JSON.parse(JSON.stringify(recibo))}
    />
  );
}
