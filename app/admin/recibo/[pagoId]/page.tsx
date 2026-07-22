import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ReciboClient from "./ReciboClient";
import { CONFIG_DEFAULT } from "@/lib/reciboConfig";
import { obtenerUsuarioActual } from "@/lib/auth";
import { tienePermiso } from "@/lib/permisos";
import AccesoDenegado from "@/components/AccesoDenegado";
import { mesesDeMora, sujetoACorte, siguienteMesPendiente, nombreMes } from "@/lib/mora";
import { obtenerConfigAvisos, llenarPlantilla } from "@/lib/avisos";

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

  // Estado de mora ACTUAL del pegue (post-pago), no el historico de ese pago puntual.
  const ultimoPago = await prisma.pago.findFirst({
    where: { pegueId: pago.pegueId },
    orderBy: [{ anioPagado: "desc" }, { mesPagado: "desc" }],
  });
  const pendiente = siguienteMesPendiente(ultimoPago, pago.pegue.createdAt);
  const mesesMoraActual = mesesDeMora(pendiente.mes, pendiente.anio);
  const corteActual = sujetoACorte(mesesMoraActual);

  const avisosConfig = await obtenerConfigAvisos();
  const mensajeWhatsApp = llenarPlantilla(avisosConfig.plantilla, {
    nombre: pago.pegue.abonado.nombre,
    codigo: pago.pegue.codigo,
    barrio: pago.pegue.barrio.nombre,
    meses: `${nombreMes(pago.mesPagado)} ${pago.anioPagado}`,
    total: pago.total.toFixed(2),
    numeroRecibo: pago.numeroRecibo || "",
    fecha: new Date(pago.fechaPago).toLocaleDateString("es-HN"),
    junta: process.env.NEXT_PUBLIC_JUNTA_NOMBRE || "Junta de Agua",
  });

  return (
    <ReciboClient
      pago={pago}
      configInicial={config}
      mesesMoraActual={mesesMoraActual}
      corteActual={corteActual}
      mensajeWhatsApp={mensajeWhatsApp}
    />
  );
}
