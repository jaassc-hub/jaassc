import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { obtenerUsuarioActual } from "@/lib/auth";
import { tienePermiso } from "@/lib/permisos";
import AccesoDenegado from "@/components/AccesoDenegado";
import ConstanciaClient from "./ConstanciaClient";

export default async function ConstanciaEventoPage({ params }: { params: { id: string } }) {
  const usuario = await obtenerUsuarioActual();
  if (!tienePermiso(usuario, "abonados")) {
    return <AccesoDenegado modulo="Pegues y abonados" />;
  }

  const evento = await prisma.eventoPegue.findUnique({
    where: { id: params.id },
    include: { pegue: { include: { abonado: true, barrio: true } } },
  });

  if (!evento) notFound();

  return (
    <ConstanciaClient
      evento={JSON.parse(JSON.stringify(evento))}
      juntaNombre={process.env.NEXT_PUBLIC_JUNTA_NOMBRE || "Junta de Agua"}
    />
  );
}
