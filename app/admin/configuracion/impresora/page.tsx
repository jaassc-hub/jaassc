import { prisma } from "@/lib/prisma";
import { obtenerUsuarioActual } from "@/lib/auth";
import { tienePermiso } from "@/lib/permisos";
import AccesoDenegado from "@/components/AccesoDenegado";
import { IMPRESORA_DEFAULT } from "@/lib/impresoraConfig";
import ImpresoraClient from "./ImpresoraClient";

export default async function ImpresoraPage() {
  const usuario = await obtenerUsuarioActual();
  if (!tienePermiso(usuario, "configuracion")) {
    return <AccesoDenegado modulo="Configuración del sistema" />;
  }

  const row = await prisma.configuracion.findUnique({ where: { clave: "impresora" } });
  const config = row ? JSON.parse(row.valor) : IMPRESORA_DEFAULT;

  return (
    <div>
      <h1 className="text-2xl font-bold text-azul mb-1">Impresora de recibos</h1>
      <p className="text-gray-500 mb-6">
        Ajuste esto según su impresora matricial (Epson). El recibo se imprime en blanco y negro,
        con fuente de ancho fijo, para que cuadre en el papel continuo.
      </p>
      <ImpresoraClient configInicial={config} />
    </div>
  );
}
