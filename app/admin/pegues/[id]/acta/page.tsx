import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { obtenerUsuarioActual } from "@/lib/auth";
import { tienePermiso } from "@/lib/permisos";
import AccesoDenegado from "@/components/AccesoDenegado";
import { CLAUSULAS_DEFAULT } from "@/lib/clausulasConfig";
import { FIRMAS_DEFAULT } from "@/lib/firmasConfig";
import { armarCorrelativoPorPegue } from "@/lib/correlativo";
import ActaClient from "./ActaClient";

export default async function ActaInstalacionPage({ params }: { params: { id: string } }) {
  const usuario = await obtenerUsuarioActual();
  if (!tienePermiso(usuario, "abonados")) {
    return <AccesoDenegado modulo="Pegues y abonados" />;
  }

  const [pegue, clausulasRow, firmasRow] = await Promise.all([
    prisma.pegue.findUnique({
      where: { id: params.id },
      include: {
        abonado: true,
        barrio: true,
        servicios: { include: { servicio: true } },
        cuotas: { orderBy: { numero: "asc" } },
      },
    }),
    prisma.configuracion.findUnique({ where: { clave: "clausulas" } }),
    prisma.configuracion.findUnique({ where: { clave: "firmas" } }),
  ]);

  if (!pegue) notFound();

  // El numero de acta se genera una sola vez y se reutiliza cada vez que se reimprime.
  let peguesConActa = pegue;
  if (!pegue.actaNumero) {
    const numero = armarCorrelativoPorPegue("ACTA", pegue.codigo, 1);
    peguesConActa = await prisma.pegue.update({
      where: { id: pegue.id },
      data: { actaNumero: numero },
      include: {
        abonado: true,
        barrio: true,
        servicios: { include: { servicio: true } },
        cuotas: { orderBy: { numero: "asc" } },
      },
    });
  }

  const clausulas = clausulasRow ? JSON.parse(clausulasRow.valor).clausulas : CLAUSULAS_DEFAULT.clausulas;
  const firmas = firmasRow ? JSON.parse(firmasRow.valor).firmantes : FIRMAS_DEFAULT.firmantes;

  return (
    <ActaClient
      pegue={JSON.parse(JSON.stringify(peguesConActa))}
      clausulasIniciales={clausulas}
      firmantes={firmas}
      juntaNombre={process.env.NEXT_PUBLIC_JUNTA_NOMBRE || "Junta de Agua"}
    />
  );
}
