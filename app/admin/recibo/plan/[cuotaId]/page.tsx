import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { obtenerUsuarioActual } from "@/lib/auth";
import { tienePermiso } from "@/lib/permisos";
import AccesoDenegado from "@/components/AccesoDenegado";
import { CONFIG_DEFAULT } from "@/lib/reciboConfig";
import { IMPRESORA_DEFAULT } from "@/lib/impresoraConfig";
import ReciboPlanClient from "./ReciboPlanClient";

export default async function ReciboPlanPage({ params }: { params: { cuotaId: string } }) {
  const usuario = await obtenerUsuarioActual();
  if (!tienePermiso(usuario, "pagos")) {
    return <AccesoDenegado modulo="Pagos" />;
  }

  const cuota = await prisma.cuotaPlanPago.findUnique({
    where: { id: params.cuotaId },
    include: {
      planPago: {
        include: {
          cuotas: { orderBy: { numero: "asc" } },
          pegue: { include: { abonado: true, barrio: true } },
        },
      },
    },
  });
  if (!cuota || !cuota.pagada) notFound();

  const [configRow, impresoraRow] = await Promise.all([
    prisma.configuracion.findUnique({ where: { clave: "recibo" } }),
    prisma.configuracion.findUnique({ where: { clave: "impresora" } }),
  ]);
  const config = configRow ? JSON.parse(configRow.valor) : CONFIG_DEFAULT;
  const impresora = impresoraRow ? JSON.parse(impresoraRow.valor) : IMPRESORA_DEFAULT;

  return (
    <ReciboPlanClient
      cuota={JSON.parse(JSON.stringify(cuota))}
      config={config}
      impresora={impresora}
      juntaNombre={process.env.NEXT_PUBLIC_JUNTA_NOMBRE || "Junta de Agua"}
    />
  );
}
