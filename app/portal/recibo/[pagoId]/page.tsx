import { prisma } from "@/lib/prisma";
import { CONFIG_DEFAULT } from "@/lib/reciboConfig";
import { IMPRESORA_DEFAULT } from "@/lib/impresoraConfig";
import { coincideClave } from "@/lib/portalAuth";
import { mesesDeMora, sujetoACorte, siguienteMesPendiente } from "@/lib/mora";
import Link from "next/link";
import TicketRecibo from "@/components/TicketRecibo";
import ImprimirBoton from "./ImprimirBoton";

export default async function ReciboPublicoPage({
  params,
  searchParams,
}: {
  params: { pagoId: string };
  searchParams: { clave?: string; identidad?: string };
}) {
  const clave = searchParams.clave || searchParams.identidad || "";

  const pago = await prisma.pago.findUnique({
    where: { id: params.pagoId },
    include: {
      pegue: {
        include: { abonado: true, barrio: true, servicios: { include: { servicio: true } } },
      },
    },
  });

  if (!pago || !coincideClave(pago.pegue.abonado, clave)) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-azul px-4 text-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full">
          <p className="text-red-600 font-medium mb-4">No tiene acceso a este recibo.</p>
          <Link href="/portal" className="btn-primario">Volver</Link>
        </div>
      </main>
    );
  }

  const [configRow, impresoraRow] = await Promise.all([
    prisma.configuracion.findUnique({ where: { clave: "recibo" } }),
    prisma.configuracion.findUnique({ where: { clave: "impresora" } }),
  ]);
  const config = configRow ? JSON.parse(configRow.valor) : CONFIG_DEFAULT;
  const impresora = impresoraRow ? JSON.parse(impresoraRow.valor) : IMPRESORA_DEFAULT;
  const junta = process.env.NEXT_PUBLIC_JUNTA_NOMBRE || "Junta de Agua";

  const ultimoPago = await prisma.pago.findFirst({
    where: { pegueId: pago.pegueId },
    orderBy: [{ anioPagado: "desc" }, { mesPagado: "desc" }],
  });
  const pendiente = siguienteMesPendiente(ultimoPago, pago.pegue.createdAt);
  const mesesMoraActual = mesesDeMora(pendiente.mes, pendiente.anio);
  const corteActual = sujetoACorte(mesesMoraActual);

  return (
    <div className="max-w-lg mx-auto p-4 md:p-8">
      <div className="no-imprimir flex items-center justify-between mb-4">
        <Link href={`/portal/${pago.pegue.codigo}?clave=${clave}`} className="text-azul text-sm">
          ← Volver
        </Link>
        <ImprimirBoton />
      </div>

      <div className="flex justify-center">
        <TicketRecibo
          numeroRecibo={pago.numeroRecibo || pago.id.slice(-6).toUpperCase()}
          fecha={new Date(pago.fechaPago)}
          juntaNombre={junta}
          juntaSubtitulo={config.juntaSubtitulo}
          tituloRecibo={config.tituloRecibo}
          abonadoNombre={pago.pegue.abonado.nombre}
          codigo={pago.pegue.codigo}
          identidad={pago.pegue.abonado.identidad}
          barrioNombre={pago.pegue.barrio.nombre}
          serviciosNombres={pago.pegue.servicios.filter((ps) => ps.habilitado).map((ps) => ps.servicio.nombre)}
          tarifaMensual={pago.montoServicios}
          meses={[{ mes: pago.mesPagado, anio: pago.anioPagado, mesesMora: pago.mesesMora, monto: pago.total }]}
          montoServiciosTotal={pago.montoServicios}
          montoMoraTotal={pago.montoMora}
          montoReconexionTotal={pago.montoReconexion}
          montoDescuentoTotal={pago.montoDescuento}
          motivoDescuento={pago.motivoDescuento}
          total={pago.total}
          metodoPago={pago.metodoPago}
          mesesMoraActual={mesesMoraActual}
          corte={corteActual}
          textoPie={config.textoPie}
          emitidoPor={pago.emitidoPor}
          anchoColumnas={impresora.anchoColumnas}
          fuente={impresora.fuente}
          mostrarDNI={config.mostrarDNI}
          mostrarBarrio={config.mostrarBarrio}
          mostrarServicios={config.mostrarServicios}
          mostrarTarifa={config.mostrarTarifa}
          mostrarEmitidoPor={config.mostrarEmitidoPor}
          pin={pago.pegue.abonado.pin}
          mostrarPin={config.mostrarPin}
        />
      </div>
    </div>
  );
}
