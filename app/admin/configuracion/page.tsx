import Link from "next/link";
import { obtenerUsuarioActual } from "@/lib/auth";
import { tienePermiso } from "@/lib/permisos";
import AccesoDenegado from "@/components/AccesoDenegado";
import { Users, Printer, Receipt, Percent, Gift, MessageCircle } from "lucide-react";
import GenerarPinsBoton from "./GenerarPinsBoton";

export default async function ConfiguracionPage() {
  const usuario = await obtenerUsuarioActual();
  if (!tienePermiso(usuario, "configuracion")) {
    return <AccesoDenegado modulo="Configuración del sistema" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-azul mb-1">Configuración</h1>
        <p className="text-gray-500 mb-6">Ajustes generales del sistema.</p>

        <div className="grid md:grid-cols-3 gap-4">
          <Link href="/admin/configuracion/usuarios" className="card hover:shadow-md transition-shadow">
            <Users className="text-azul mb-2" size={24} strokeWidth={1.8} />
            <p className="font-semibold text-azul">Usuarios y permisos</p>
            <p className="text-sm text-gray-500 mt-1">
              Cree usuarios para el tesorero, la secretaria, el fiscal y los vocales, y asigne qué
              puede ver cada quien.
            </p>
          </Link>

          <Link href="/admin/configuracion/mora" className="card hover:shadow-md transition-shadow">
            <Percent className="text-azul mb-2" size={24} strokeWidth={1.8} />
            <p className="font-semibold text-azul">Mora</p>
            <p className="text-sm text-gray-500 mt-1">
              Porcentaje de mora sobre el total adeudado, según cuántos meses de atraso.
            </p>
          </Link>

          <Link href="/admin/configuracion/descuentos" className="card hover:shadow-md transition-shadow">
            <Gift className="text-azul mb-2" size={24} strokeWidth={1.8} />
            <p className="font-semibold text-azul">Descuentos y regalías</p>
            <p className="text-sm text-gray-500 mt-1">
              Reglas automáticas (tercera edad, pago adelantado) que se sugieren al cobrar.
            </p>
          </Link>

          <Link href="/admin/configuracion/impresora" className="card hover:shadow-md transition-shadow">
            <Printer className="text-azul mb-2" size={24} strokeWidth={1.8} />
            <p className="font-semibold text-azul">Impresora de recibos</p>
            <p className="text-sm text-gray-500 mt-1">
              Ajuste el ancho de papel para su impresora matricial.
            </p>
          </Link>

          <Link href="/admin/configuracion/avisos" className="card hover:shadow-md transition-shadow">
            <MessageCircle className="text-azul mb-2" size={24} strokeWidth={1.8} />
            <p className="font-semibold text-azul">Avisos de pago (SMS / WhatsApp)</p>
            <p className="text-sm text-gray-500 mt-1">
              Active o desactive el aviso automático de pago recibido, elija el canal y
              edite el mensaje.
            </p>
          </Link>

          <Link href="/admin/pagos" className="card hover:shadow-md transition-shadow">
            <Receipt className="text-azul mb-2" size={24} strokeWidth={1.8} />
            <p className="font-semibold text-azul">Formato del recibo</p>
            <p className="text-sm text-gray-500 mt-1">
              El formato del recibo (textos, secciones) se edita desde cualquier recibo ya
              generado, con el botón "Editar formato".
            </p>
          </Link>
        </div>
      </div>

      <GenerarPinsBoton />
    </div>
  );
}
