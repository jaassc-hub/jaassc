import Link from "next/link";
import { obtenerUsuarioActual } from "@/lib/auth";
import { tienePermiso } from "@/lib/permisos";
import AccesoDenegado from "@/components/AccesoDenegado";
import { Users, Printer, Receipt, Percent, Gift, MessageCircle, PenTool, FileWarning, FileSignature, Bell, Megaphone } from "lucide-react";
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

          <Link href="/admin/configuracion/firmas" className="card hover:shadow-md transition-shadow">
            <PenTool className="text-azul mb-2" size={24} strokeWidth={1.8} />
            <p className="font-semibold text-azul">Firmas</p>
            <p className="text-sm text-gray-500 mt-1">
              Suba las firmas escaneadas de la directiva para las notas de mora.
            </p>
          </Link>

          <Link href="/admin/configuracion/nota-mora" className="card hover:shadow-md transition-shadow">
            <FileWarning className="text-azul mb-2" size={24} strokeWidth={1.8} />
            <p className="font-semibold text-azul">Textos de nota de mora</p>
            <p className="text-sm text-gray-500 mt-1">
              Edite el texto y los valores por defecto de los avisos de pago pendiente.
            </p>
          </Link>

          <Link href="/admin/configuracion/clausulas" className="card hover:shadow-md transition-shadow">
            <FileSignature className="text-azul mb-2" size={24} strokeWidth={1.8} />
            <p className="font-semibold text-azul">Cláusulas del acta de instalación</p>
            <p className="text-sm text-gray-500 mt-1">
              Edite las cláusulas que aparecen al formalizar la instalación de un pegue nuevo.
            </p>
          </Link>

          <Link href="/admin/configuracion/notificaciones" className="card hover:shadow-md transition-shadow">
            <Bell className="text-azul mb-2" size={24} strokeWidth={1.8} />
            <p className="font-semibold text-azul">Notificaciones</p>
            <p className="text-sm text-gray-500 mt-1">
              Ajuste los umbrales de irregularidades y la multa por cuota de conexión atrasada.
            </p>
          </Link>

          <Link href="/admin/configuracion/avisos-portal" className="card hover:shadow-md transition-shadow">
            <Megaphone className="text-azul mb-2" size={24} strokeWidth={1.8} />
            <p className="font-semibold text-azul">Avisos del portal</p>
            <p className="text-sm text-gray-500 mt-1">
              Suba comunicados o imágenes que verán los abonados al consultar su cuenta.
            </p>
          </Link>
        </div>
      </div>

      <GenerarPinsBoton />
    </div>
  );
}
