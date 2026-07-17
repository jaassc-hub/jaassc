import { prisma } from "@/lib/prisma";
import { obtenerUsuarioActual } from "@/lib/auth";
import { tienePermiso } from "@/lib/permisos";
import AccesoDenegado from "@/components/AccesoDenegado";
import { FIRMAS_DEFAULT } from "@/lib/firmasConfig";
import FirmasClient from "./FirmasClient";

export default async function FirmasPage() {
  const usuario = await obtenerUsuarioActual();
  if (!tienePermiso(usuario, "configuracion")) {
    return <AccesoDenegado modulo="Configuración del sistema" />;
  }

  const row = await prisma.configuracion.findUnique({ where: { clave: "firmas" } });
  const config = row ? JSON.parse(row.valor) : FIRMAS_DEFAULT;

  return (
    <div>
      <h1 className="text-2xl font-bold text-azul mb-1">Firmas</h1>
      <p className="text-gray-500 mb-6">
        Estas firmas aparecen en las notas de mora. Suba la firma escaneada de cada
        directivo en PNG (con fondo transparente si puede) — cuando cambie la directiva,
        solo reemplace el nombre y la imagen aquí, sin tocar nada más.
      </p>
      <FirmasClient configInicial={config} />
    </div>
  );
}
