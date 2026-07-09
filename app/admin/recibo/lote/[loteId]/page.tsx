import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { CONFIG_DEFAULT } from "@/lib/reciboConfig";
import ReciboLoteClient from "./ReciboLoteClient";
import { obtenerUsuarioActual } from "@/lib/auth";
import { tienePermiso } from "@/lib/permisos";
import AccesoDenegado from "@/components/AccesoDenegado";

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

  return <ReciboLoteClient pagos={pagos} configInicial={config} />;
}
