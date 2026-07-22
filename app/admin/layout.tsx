import Link from "next/link";
import Logo from "@/components/Logo";
import CerrarSesionBoton from "@/components/CerrarSesionBoton";
import BotonAtras from "@/components/BotonAtras";
import { obtenerUsuarioActual } from "@/lib/auth";
import { tienePermiso, ModuloKey } from "@/lib/permisos";
import { redirect } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Wallet,
  BarChart3,
  Wrench,
  MapPin,
  Settings,
  FileWarning,
  BookOpen,
  Banknote,
  Bell,
  UserCog,
  Search,
} from "lucide-react";

const nav: { href: string; label: string; icon: any; modulo?: ModuloKey }[] = [
  { href: "/admin", label: "Panel", icon: LayoutDashboard },
  { href: "/admin/pagos/nuevo", label: "Cobrar", icon: Banknote, modulo: "pagos" },
  { href: "/admin/consulta-pegue", label: "Consultar estado de cuenta", icon: Search, modulo: "abonados" },
  { href: "/admin/abonados", label: "Pegues y abonados", icon: Users, modulo: "abonados" },
  { href: "/admin/pagos", label: "Historial de pagos", icon: Wallet, modulo: "pagos" },
  { href: "/admin/caja", label: "Informe de caja", icon: BarChart3, modulo: "caja" },
  { href: "/admin/notas-mora", label: "Notas de mora", icon: FileWarning, modulo: "abonados" },
  { href: "/admin/libro-diario", label: "Libro diario", icon: BookOpen, modulo: "caja" },
  { href: "/admin/notificaciones", label: "Notificaciones", icon: Bell, modulo: "abonados" },
  { href: "/admin/delegaciones", label: "Delegaciones", icon: UserCog },
  { href: "/admin/servicios", label: "Servicios y tarifas", icon: Wrench, modulo: "servicios" },
  { href: "/admin/barrios", label: "Barrios / códigos", icon: MapPin, modulo: "barrios" },
  { href: "/admin/configuracion", label: "Configuración", icon: Settings, modulo: "configuracion" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) redirect("/login");
  if (usuario.debeCambiarPassword) redirect("/cambiar-password");

  const navVisible = nav.filter((item) => !item.modulo || tienePermiso(usuario, item.modulo));

  return (
    <div className="admin-shell min-h-screen flex bg-gray-50">
      <aside className="w-64 bg-azul text-white flex-col hidden md:flex no-imprimir">
        <div className="p-5 flex items-center gap-3 border-b border-white/10">
          <Logo size={36} />
          <span className="font-semibold text-sm leading-tight">
            {process.env.NEXT_PUBLIC_JUNTA_NOMBRE || "Junta de Agua"}
          </span>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navVisible.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-sm"
            >
              <item.icon size={18} strokeWidth={1.8} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10 space-y-2">
          <p className="text-xs text-white/60 px-1">
            {usuario.nombre || usuario.username}
          </p>
          <CerrarSesionBoton />
        </div>
      </aside>

      {/* Barra superior movil */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-azul text-white p-3 flex items-center justify-between z-10 no-imprimir">
        <div className="flex items-center gap-2">
          <Logo size={28} />
          <span className="font-semibold text-sm">Panel admin</span>
        </div>
      </div>

      <main className="admin-main flex-1 p-4 md:p-8 mt-14 md:mt-0 mb-16 md:mb-0 overflow-x-auto">
        <BotonAtras />
        {children}
      </main>

      {/* Navegacion inferior movil */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around py-2 no-imprimir z-10 overflow-x-auto">
        {navVisible.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center text-[10px] text-azul px-2 gap-0.5"
          >
            <item.icon size={20} strokeWidth={1.8} />
            {item.label.split(" ")[0]}
          </Link>
        ))}
      </nav>
    </div>
  );
}
