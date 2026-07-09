import { obtenerUsuarioActual } from "@/lib/auth";
import { tienePermiso } from "@/lib/permisos";
import AccesoDenegado from "@/components/AccesoDenegado";
import RegistrarPagoClient from "./RegistrarPagoClient";

export default async function RegistrarPagoPage() {
  const usuario = await obtenerUsuarioActual();
  if (!tienePermiso(usuario, "pagos")) {
    return <AccesoDenegado modulo="Pagos" />;
  }
  return <RegistrarPagoClient />;
}
