import { prisma } from "@/lib/prisma";
import { obtenerUsuarioActual } from "@/lib/auth";
import { tienePermiso } from "@/lib/permisos";
import AccesoDenegado from "@/components/AccesoDenegado";
import { DESCUENTOS_DEFAULT } from "@/lib/descuentosConfig";
import DescuentosClient from "./DescuentosClient";

export default async function DescuentosPage() {
  const usuario = await obtenerUsuarioActual();
  if (!tienePermiso(usuario, "configuracion")) {
    return <AccesoDenegado modulo="Configuración del sistema" />;
  }

  const row = await prisma.configuracion.findUnique({ where: { clave: "descuentos" } });
  const config = row ? JSON.parse(row.valor) : DESCUENTOS_DEFAULT;

  return (
    <div>
      <h1 className="text-2xl font-bold text-azul mb-1">Descuentos y regalías</h1>
      <p className="text-gray-500 mb-6">
        Reglas automáticas que el sistema sugiere al cobrar (el cobrador las puede
        aceptar, quitar o ajustar). También queda siempre disponible un descuento manual
        con motivo escrito a mano en la pantalla de cobro.
      </p>
      <DescuentosClient configInicial={config} />
    </div>
  );
}
