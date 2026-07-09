import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ReciboClient from "./ReciboClient";
import { CONFIG_DEFAULT } from "@/lib/reciboConfig";
import { obtenerUsuarioActual } from "@/lib/auth";
import { tienePermiso } from "@/lib/permisos";
import AccesoDenegado from "@/components/AccesoDenegado";

export default async function ReciboPage({ params }: { params: { pagoId: string } }) {
  const usuario = await obtenerUsuarioActual();
  if (!tienePermiso(usuario, "pagos")) {
    return <AccesoDenegado modulo="Pagos" />;
  }

  const [pago, configRow] = await Promise.all([
    prisma.pago.findUnique({
      where: { id: params.pagoId },
      include: {
        pegue: {
          include: {
            abonado: true,
            barrio: true,
            servicios: { include: { servicio: true } },
          },
        },
      },
    }),
    prisma.configuracion.findUnique({ where: { clave: "recibo" } }),
  ]);

  if (!pago) notFound();

  const config = configRow ? JSON.parse(configRow.valor) : CONFIG_DEFAULT;

  return <ReciboClient pago={pago} configInicial={config} />;
}
