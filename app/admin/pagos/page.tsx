import { prisma } from "@/lib/prisma";
import { obtenerUsuarioActual } from "@/lib/auth";
import { tienePermiso } from "@/lib/permisos";
import AccesoDenegado from "@/components/AccesoDenegado";
import { nombreMes } from "@/lib/mora";
import PagosClient from "./PagosClient";

export default async function PagosPage({
  searchParams,
}: {
  searchParams: { mes?: string; anio?: string; q?: string };
}) {
  const usuario = await obtenerUsuarioActual();
  if (!tienePermiso(usuario, "pagos")) {
    return <AccesoDenegado modulo="Pagos" />;
  }

  const hoy = new Date();
  const mes = searchParams.mes ? parseInt(searchParams.mes) : undefined;
  const anio = searchParams.anio ? parseInt(searchParams.anio) : hoy.getFullYear();

  const pagos = await prisma.pago.findMany({
    where: {
      fechaPago: {
        gte: new Date(anio, mes ? mes - 1 : 0, 1),
        lt: mes ? new Date(anio, mes, 1) : new Date(anio + 1, 0, 1),
      },
    },
    include: { pegue: { include: { abonado: true, barrio: true } } },
    orderBy: { fechaPago: "desc" },
  });

  // Agrupar por recibo: un lote de varios meses aparece como una sola fila.
  const grupos = new Map<string, typeof pagos>();
  for (const p of pagos) {
    const clave = p.loteId || p.id;
    if (!grupos.has(clave)) grupos.set(clave, []);
    grupos.get(clave)!.push(p);
  }

  const recibos = Array.from(grupos.values())
    .map((grupo) => {
      const primero = grupo[0];
      return {
        clave: primero.loteId || primero.id,
        loteId: primero.loteId,
        pagoId: primero.id,
        numeroRecibo: primero.numeroRecibo || "—",
        fecha: primero.fechaPago,
        pegueCodigo: primero.pegue.codigo,
        abonadoNombre: primero.pegue.abonado.nombre,
        abonadoIdentidad: primero.pegue.abonado.identidad,
        meses: grupo.map((p) => `${nombreMes(p.mesPagado)} ${p.anioPagado}`).join(", "),
        metodoPago: primero.metodoPago,
        total: grupo.reduce((s, p) => s + p.total, 0),
        emitidoPor: primero.emitidoPor,
      };
    })
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  const totalPeriodo = recibos.reduce((s, r) => s + r.total, 0);

  return (
    <div>
      <h1 className="text-2xl font-bold text-azul mb-1">Historial de pagos</h1>
      <p className="text-gray-500 mb-6">
        {recibos.length} recibo(s) · Total: <b>L {totalPeriodo.toFixed(2)}</b>
      </p>
      <PagosClient recibos={JSON.parse(JSON.stringify(recibos))} mesInicial={mes} anioInicial={anio} qInicial={searchParams.q || ""} />
    </div>
  );
}
