import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { obtenerUsuarioActual } from "@/lib/auth";
import { tienePermiso } from "@/lib/permisos";
import AccesoDenegado from "@/components/AccesoDenegado";
import { Plus } from "lucide-react";

const badgeEstado: Record<string, string> = {
  ACTIVO: "badge-verde",
  CORTADO: "badge-rojo",
  INACTIVO: "badge-naranja",
};
const nombreEstado: Record<string, string> = {
  ACTIVO: "Activo",
  CORTADO: "Cortado",
  INACTIVO: "Inhabilitado",
};

export default async function PeguesPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const usuario = await obtenerUsuarioActual();
  if (!tienePermiso(usuario, "abonados")) {
    return <AccesoDenegado modulo="Pegues y abonados" />;
  }
  const q = searchParams.q || "";

  const pegues = await prisma.pegue.findMany({
    where: q
      ? {
          OR: [
            { codigo: { contains: q, mode: "insensitive" } },
            { abonado: { nombre: { contains: q, mode: "insensitive" } } },
            { abonado: { identidad: { contains: q, mode: "insensitive" } } },
          ],
        }
      : undefined,
    include: {
      abonado: true,
      barrio: true,
      servicios: { include: { servicio: true } },
    },
    orderBy: { codigo: "asc" },
    take: 200,
  });

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-azul mb-1">Pegues y abonados</h1>
          <p className="text-gray-500">{pegues.length} pegue(s)</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/abonados/nuevo" className="btn-outline whitespace-nowrap">
            + Nuevo abonado
          </Link>
          <Link href="/admin/pegues/nuevo" className="btn-primario whitespace-nowrap flex items-center gap-1.5">
            <Plus size={16} /> Nuevo pegue
          </Link>
        </div>
      </div>

      <form className="mb-5">
        <input
          className="input max-w-md"
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Buscar por código de pegue, nombre o identidad del abonado..."
        />
      </form>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="pb-2 pr-3">Código</th>
              <th className="pb-2 pr-3">Abonado</th>
              <th className="pb-2 pr-3">Barrio</th>
              <th className="pb-2 pr-3">Servicios</th>
              <th className="pb-2 pr-3">Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {pegues.map((p) => (
              <tr key={p.id} className="border-b last:border-0">
                <td className="py-2 pr-3 font-semibold text-azul">{p.codigo}</td>
                <td className="py-2 pr-3">{p.abonado.nombre}</td>
                <td className="py-2 pr-3">{p.barrio.nombre}</td>
                <td className="py-2 pr-3 text-gray-500">
                  {p.servicios.filter((ps) => ps.habilitado).map((ps) => ps.servicio.nombre).join(", ")}
                </td>
                <td className="py-2 pr-3">
                  <span className={badgeEstado[p.estado]}>{nombreEstado[p.estado]}</span>
                </td>
                <td className="py-2 text-right">
                  <Link href={`/admin/pegues/${p.id}`} className="text-azul font-medium">
                    Ver pegue
                  </Link>
                </td>
              </tr>
            ))}
            {pegues.length === 0 && (
              <tr>
                <td colSpan={6} className="text-gray-400 py-6 text-center">
                  No se encontraron pegues.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
