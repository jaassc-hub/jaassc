import { obtenerUsuarioActual } from "@/lib/auth";
import { redirect } from "next/navigation";
import DelegacionesClient from "./DelegacionesClient";

export default async function DelegacionesPage() {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) redirect("/login");

  return <DelegacionesClient usuarioActualId={usuario.id} />;
}
