import { prisma } from "@/lib/prisma";
import { mesesDeMora, calcularMontoMora, sujetoACorte, nombreMes, siguienteMesPendiente } from "@/lib/mora";
import { MORA_DEFAULT } from "@/lib/moraConfig";
import { coincideClave } from "@/lib/portalAuth";
import { asegurarPin } from "@/lib/pin";
import EstadoCuentaClient from "./EstadoCuentaClient";
import Link from "next/link";
import Logo from "@/components/Logo";

export default async function EstadoCuentaPage({
  params,
  searchParams,
}: {
  params: { codigo: string };
  searchParams: { clave?: string; identidad?: string };
}) {
  const clave = searchParams.clave || searchParams.identidad || "";

  const pegue = await prisma.pegue.findFirst({
    where: { codigo: { equals: params.codigo, mode: "insensitive" } },
    include: {
      abonado: true,
      barrio: true,
      servicios: { include: { servicio: true } },
      pagos: { orderBy: [{ anioPagado: "desc" }, { mesPagado: "desc" }] },
      cuotas: { orderBy: { numero: "asc" } },
    },
  });

  if (pegue) {
    const pin = await asegurarPin(pegue.abonadoId);
    pegue.abonado.pin = pin;
  }

  if (!pegue || !coincideClave(pegue.abonado, clave)) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-azul px-4 text-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full">
          <div className="flex justify-center mb-4"><Logo size={56} /></div>
          <p className="text-red-600 font-medium mb-4">
            No se encontró ninguna cuenta con esos datos.
          </p>
          <Link href="/portal" className="btn-primario">Volver a intentar</Link>
        </div>
      </main>
    );
  }

  const montoServicios = pegue.servicios
    .filter((ps) => ps.habilitado)
    .reduce((s, ps) => s + ps.servicio.precio, 0);

  const moraConfigRow = await prisma.configuracion.findUnique({ where: { clave: "mora" } });
  const tramos = moraConfigRow ? JSON.parse(moraConfigRow.valor).tramos : MORA_DEFAULT.tramos;

  const sugerido = siguienteMesPendiente(pegue.pagos[0] || null, pegue.createdAt);
  const mesesMoraActual = mesesDeMora(sugerido.mes, sugerido.anio);
  const montoAdeudado = montoServicios * mesesMoraActual;
  const montoMoraActual = calcularMontoMora(montoAdeudado, mesesMoraActual, tramos);
  const corte = sujetoACorte(mesesMoraActual);

  return (
    <EstadoCuentaClient
      pegue={JSON.parse(JSON.stringify(pegue))}
      montoServicios={montoAdeudado || montoServicios}
      pendiente={sugerido}
      mesesMora={mesesMoraActual}
      montoMora={montoMoraActual}
      corte={corte}
      clave={clave}
    />
  );
}
