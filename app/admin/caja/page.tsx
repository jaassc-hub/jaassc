import { prisma } from "@/lib/prisma";
import { nombreMes } from "@/lib/mora";
import { obtenerUsuarioActual } from "@/lib/auth";
import { tienePermiso } from "@/lib/permisos";
import AccesoDenegado from "@/components/AccesoDenegado";

export default async function CajaPage({
  searchParams,
}: {
  searchParams: { anio?: string };
}) {
  const usuario = await obtenerUsuarioActual();
  if (!tienePermiso(usuario, "caja")) {
    return <AccesoDenegado modulo="Informe de caja" />;
  }
  const anio = searchParams.anio ? parseInt(searchParams.anio) : new Date().getFullYear();

  const pagos = await prisma.pago.findMany({
    where: {
      fechaPago: {
        gte: new Date(anio, 0, 1),
        lt: new Date(anio + 1, 0, 1),
      },
    },
    select: { fechaPago: true, total: true, metodoPago: true },
  });

  const meses = Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
    const delMes = pagos.filter((p) => new Date(p.fechaPago).getMonth() + 1 === m);
    const total = delMes.reduce((s, p) => s + p.total, 0);
    const efectivo = delMes.filter((p) => p.metodoPago === "EFECTIVO").reduce((s, p) => s + p.total, 0);
    const transferencia = delMes.filter((p) => p.metodoPago === "TRANSFERENCIA").reduce((s, p) => s + p.total, 0);
    const deposito = delMes.filter((p) => p.metodoPago === "DEPOSITO").reduce((s, p) => s + p.total, 0);
    const otro = delMes.filter((p) => p.metodoPago === "OTRO").reduce((s, p) => s + p.total, 0);
    return { m, cantidad: delMes.length, total, efectivo, transferencia, deposito, otro };
  });

  const totalAnio = meses.reduce((s, m) => s + m.total, 0);

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-azul mb-1">Informe de caja</h1>
          <p className="text-gray-500">
            Total del año {anio}: <b>L {totalAnio.toFixed(2)}</b>
          </p>
        </div>
        <form className="flex gap-2">
          <input name="anio" type="number" defaultValue={anio} className="input w-28" />
          <button className="btn-outline">Ver año</button>
        </form>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="pb-2 pr-3">Mes</th>
              <th className="pb-2 pr-3 text-right">N.° pagos</th>
              <th className="pb-2 pr-3 text-right">Efectivo</th>
              <th className="pb-2 pr-3 text-right">Transferencia</th>
              <th className="pb-2 pr-3 text-right">Depósito</th>
              <th className="pb-2 pr-3 text-right">Otro</th>
              <th className="pb-2 pr-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {meses.map((m) => (
              <tr key={m.m} className="border-b last:border-0">
                <td className="py-2 pr-3 font-medium">{nombreMes(m.m)}</td>
                <td className="py-2 pr-3 text-right">{m.cantidad}</td>
                <td className="py-2 pr-3 text-right">L {m.efectivo.toFixed(2)}</td>
                <td className="py-2 pr-3 text-right">L {m.transferencia.toFixed(2)}</td>
                <td className="py-2 pr-3 text-right">L {m.deposito.toFixed(2)}</td>
                <td className="py-2 pr-3 text-right">L {m.otro.toFixed(2)}</td>
                <td className="py-2 pr-3 text-right font-bold text-azul">L {m.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="font-bold border-t">
              <td className="py-2">Total {anio}</td>
              <td></td>
              <td className="py-2 text-right">L {meses.reduce((s, m) => s + m.efectivo, 0).toFixed(2)}</td>
              <td className="py-2 text-right">L {meses.reduce((s, m) => s + m.transferencia, 0).toFixed(2)}</td>
              <td className="py-2 text-right">L {meses.reduce((s, m) => s + m.deposito, 0).toFixed(2)}</td>
              <td className="py-2 text-right">L {meses.reduce((s, m) => s + m.otro, 0).toFixed(2)}</td>
              <td className="py-2 text-right text-azul">L {totalAnio.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <p className="text-xs text-gray-400 mt-3 no-imprimir">
        Nota: el pago se agrupa por su fecha real de cobro (no por el mes que se está cancelando),
        para reflejar correctamente cuánto entró a caja cada mes.
      </p>
    </div>
  );
}
