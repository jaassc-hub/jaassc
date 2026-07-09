import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import { nombreMes } from "@/lib/mora";
import { obtenerUsuarioActual } from "@/lib/auth";
import { Wallet, Users, BarChart3 } from "lucide-react";

export default async function AdminDashboard() {
  const usuario = await obtenerUsuarioActual();

  // El rol Cobrador entra directo a la pantalla de cobro: es lo unico que necesita.
  if (usuario?.rol === "COBRADOR") {
    redirect("/admin/pagos/nuevo");
  }

  const hoy = new Date();
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1);

  const [totalAbonados, totalPegues, pegueCortados, pagosMes] = await Promise.all([
    prisma.abonado.count({ where: { activo: true } }),
    prisma.pegue.count(),
    prisma.pegue.count({ where: { estado: "CORTADO" } }),
    prisma.pago.findMany({
      where: { fechaPago: { gte: inicioMes, lt: finMes } },
      select: { total: true },
    }),
  ]);

  const ingresoMes = pagosMes.reduce((s, p) => s + p.total, 0);

  const tarjetas = [
    { label: "Abonados activos", valor: totalAbonados, color: "bg-azul" },
    { label: "Pegues totales", valor: totalPegues, color: "bg-azul-light" },
    { label: "Pegues cortados", valor: pegueCortados, color: "bg-red-500" },
    {
      label: `Ingresos de ${nombreMes(hoy.getMonth() + 1)}`,
      valor: `L ${ingresoMes.toFixed(2)}`,
      color: "bg-naranja",
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-azul mb-1">Panel principal</h1>
      <p className="text-gray-500 mb-6">
        Resumen general de la Junta de Agua — {hoy.toLocaleDateString("es-HN")}
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {tarjetas.map((t) => (
          <div key={t.label} className={`${t.color} text-white rounded-xl p-4 shadow-sm`}>
            <p className="text-sm opacity-90">{t.label}</p>
            <p className="text-2xl font-bold mt-1">{t.valor}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Link href="/admin/pagos/nuevo" className="card hover:shadow-md transition-shadow flex gap-3">
          <Wallet className="text-azul shrink-0" size={22} strokeWidth={1.8} />
          <div>
            <p className="font-semibold text-azul">Registrar un pago</p>
            <p className="text-sm text-gray-500 mt-1">
              Buscar un pegue, calcular mora e imprimir recibo
            </p>
          </div>
        </Link>
        <Link href="/admin/abonados" className="card hover:shadow-md transition-shadow flex gap-3">
          <Users className="text-azul shrink-0" size={22} strokeWidth={1.8} />
          <div>
            <p className="font-semibold text-azul">Pegues y abonados</p>
            <p className="text-sm text-gray-500 mt-1">
              Ver, crear y editar pegues y sus dueños
            </p>
          </div>
        </Link>
        <Link href="/admin/caja" className="card hover:shadow-md transition-shadow flex gap-3">
          <BarChart3 className="text-azul shrink-0" size={22} strokeWidth={1.8} />
          <div>
            <p className="font-semibold text-azul">Informe de caja</p>
            <p className="text-sm text-gray-500 mt-1">
              Total cobrado por mes, agrupado por método de pago
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
