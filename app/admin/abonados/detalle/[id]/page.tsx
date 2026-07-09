import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import AbonadoDetalleClient from "./AbonadoDetalleClient";
import { obtenerUsuarioActual } from "@/lib/auth";
import { tienePermiso } from "@/lib/permisos";
import AccesoDenegado from "@/components/AccesoDenegado";
import { asegurarPin } from "@/lib/pin";

export default async function AbonadoDetallePage({
  params,
}: {
  params: { id: string };
}) {
  const usuario = await obtenerUsuarioActual();
  if (!tienePermiso(usuario, "abonados")) {
    return <AccesoDenegado modulo="Pegues y abonados" />;
  }

  const [abonado, barrios, servicios] = await Promise.all([
    prisma.abonado.findUnique({
      where: { id: params.id },
      include: {
        pegues: {
          include: {
            barrio: true,
            servicios: { include: { servicio: true } },
          },
          orderBy: { codigo: "asc" },
        },
      },
    }),
    prisma.barrio.findMany({ orderBy: { nombre: "asc" } }),
    prisma.servicio.findMany({ where: { activo: true }, orderBy: { nombre: "asc" } }),
  ]);

  if (!abonado) notFound();

  abonado.pin = await asegurarPin(abonado.id);

  return (
    <AbonadoDetalleClient
      abonadoInicial={abonado}
      barrios={barrios}
      servicios={servicios}
    />
  );
}
