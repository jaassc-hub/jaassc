import { ShieldAlert } from "lucide-react";

export default function AccesoDenegado({ modulo }: { modulo: string }) {
  return (
    <div className="card max-w-md border-orange-300 bg-orange-50 flex items-start gap-3">
      <ShieldAlert className="text-orange-600 shrink-0" size={24} strokeWidth={1.8} />
      <div>
        <p className="font-semibold text-orange-700">No tiene permiso para ver esta sección</p>
        <p className="text-sm text-orange-700 mt-1">
          {modulo} no está habilitado para su usuario. Pídale al presidente o al tesorero que le
          otorgue acceso desde Configuración → Usuarios.
        </p>
      </div>
    </div>
  );
}
