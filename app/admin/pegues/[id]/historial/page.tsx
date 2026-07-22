import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { nombreMes } from "@/lib/mora";
import { obtenerUsuarioActual } from "@/lib/auth";
import { tienePermiso } from "@/lib/permisos";
import AccesoDenegado from "@/components/AccesoDenegado";
import DelegarBoton from "@/components/DelegarBoton";

export default async function HistorialPeguePage({ params }: { params: { id: string } }) {
  const usuario = await obtenerUsuarioActual();
  if (!tienePermiso(usuario, "abonados")) {
    return <AccesoDenegado modulo="Pegues y abonados" />;
  }

  const pegue = await prisma.pegue.findUnique({
    where: { id: params.id },
    include: {
      abonado: true,
      barrio: true,
      pagos: { orderBy: [{ anioPagado: "desc" }, { mesPagado: "desc" }] },
      eventos: { orderBy: { fecha: "desc" } },
    },
  });

  if (!pegue) notFound();

  const linea = [
    ...pegue.pagos.map((p) => ({ tipo: "PAGO" as const, fecha: p.fechaPago, detalle: p })),
    ...pegue.eventos.map((e) => ({ tipo: "EVENTO" as const, fecha: e.fecha, detalle: e })),
  ].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  return (
    <div className="max-w-2xl">
      <Link href={`/admin/pegues/${pegue.id}`} className="text-azul text-sm">
        ← Volver al pegue
      </Link>
      <h1 className="text-2xl font-bold text-azul mt-1 mb-1">Historial de {pegue.codigo}</h1>
      <p className="text-gray-500 mb-6">
        {pegue.abonado.nombre} · {pegue.barrio.nombre}
      </p>

      <div className="card divide-y">
        {linea.map((item, i) => (
          <div key={i} className="py-3 flex items-center justify-between text-sm">
            {item.tipo === "PAGO" ? (
              <>
                <div>
                  <p className="font-medium">
                    Pago de {nombreMes((item.detalle as any).mesPagado)} {(item.detalle as any).anioPagado}
                  </p>
                  <p className="text-gray-400 text-xs">
                    {(item.detalle as any).metodoPago}
                    {(item.detalle as any).montoMora > 0 && ` · mora L${(item.detalle as any).montoMora.toFixed(2)}`}
                    {(item.detalle as any).montoReconexion > 0 && " · reconexión"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">L {(item.detalle as any).total.toFixed(2)}</p>
                  <p className="text-gray-400 text-xs">
                    {new Date(item.fecha).toLocaleDateString("es-HN")}
                  </p>
                </div>
              </>
            ) : (
              <>
                <div>
                  <p className="font-medium text-orange-700">
                    {(item.detalle as any).tipo === "CORTE" && "Servicio cortado"}
                    {(item.detalle as any).tipo === "RECONEXION" && "Reconexión pagada"}
                    {(item.detalle as any).tipo === "REACTIVACION" && "Reactivado manualmente"}
                    {(item.detalle as any).tipo === "INHABILITACION" && "Pegue inhabilitado"}
                  </p>
                  {(item.detalle as any).realizadoPor && (
                    <p className="text-xs text-gray-400">Por: {(item.detalle as any).realizadoPor}</p>
                  )}
                  {(item.detalle as any).nota && (
                    <p className="text-xs text-gray-500">Motivo: {(item.detalle as any).nota}</p>
                  )}
                </div>
                <div className="text-right space-y-1">
                  <p className="text-gray-400 text-xs">
                    {new Date(item.fecha).toLocaleDateString("es-HN")}
                  </p>
                  {["CORTE", "INHABILITACION", "REACTIVACION"].includes((item.detalle as any).tipo) && (
                    <Link href={`/admin/eventos/${(item.detalle as any).id}`} className="text-azul text-xs font-medium block">
                      Ver constancia
                    </Link>
                  )}
                  {(item.detalle as any).tipo === "CORTE" && (
                    <DelegarBoton pegueId={pegue.id} tipo="CORTE_MORA" eventoId={(item.detalle as any).id} />
                  )}
                </div>
              </>
            )}
          </div>
        ))}
        {linea.length === 0 && (
          <p className="text-gray-400 text-sm py-4">Aún no hay movimientos para este pegue.</p>
        )}
      </div>
    </div>
  );
}
