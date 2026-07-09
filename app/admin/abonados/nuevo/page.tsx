import { obtenerUsuarioActual } from "@/lib/auth";
import { tienePermiso } from "@/lib/permisos";
import AccesoDenegado from "@/components/AccesoDenegado";
import NuevoAbonadoClient from "./NuevoAbonadoClient";

export default async function NuevoAbonadoPage() {
  const usuario = await obtenerUsuarioActual();
  if (!tienePermiso(usuario, "abonados")) {
    return <AccesoDenegado modulo="Pegues y abonados" />;
  }
  return <NuevoAbonadoClient />;
}
