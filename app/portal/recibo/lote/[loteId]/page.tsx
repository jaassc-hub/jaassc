import { prisma } from "@/lib/prisma";
import { CONFIG_DEFAULT } from "@/lib/reciboConfig";
import { IMPRESORA_DEFAULT } from "@/lib/impresoraConfig";
import { coincideClave } from "@/lib/portalAuth";
import Link from "next/link";
import TicketRecibo from "@/components/TicketRecibo";
import ImprimirBoton from "../../[pagoId]/ImprimirBoton";

export default async function ReciboLotePublicoPage({
  params,
  searchParams,
}: {
  params: { loteId: string };
  searchParams: { clave?: string; identidad?: string };
}) {
  const clave = searchParams.clave || searchParams.identidad || "";

  const pagos = await prisma.pago.findMany({
    where: { loteId: params.loteId },
    include: {
      pegue: { include: { abonado: true, barrio: true, servicios: { include: { servicio: true } } } },
    },
    orderBy: [{ anioPagado: "asc" }, { mesPagado: "asc" }],
  });

  if (pagos.length === 0 || !coincideClave(pagos[0].pegue.abonado, clave)) {
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
  const primero = pagos[0];
  const junta = process.env.NEXT_PUBLIC_JUNTA_NOMBRE || "Junta de Agua";
  const totalGeneral = pagos.reduce((s, p) => s + p.total, 0);
  const totalServicios = pagos.reduce((s, p) => s + p.montoServicios, 0);
  const totalMora = pagos.reduce((s, p) => s + p.montoMora, 0);
  const totalReconexion = pagos.reduce((s, p) => s + p.montoReconexion, 0);
  const totalDescuento = pagos.reduce((s, p) => s + p.montoDescuento, 0);
  const motivoDescuento = pagos.find((p) => p.motivoDescuento)?.motivoDescuento || null;
  const mesesMoraMax = Math.max(...pagos.map((p) => p.mesesMora));

  return (
    <div className="max-w-lg mx-auto p-4 md:p-8">
      <div className="no-imprimir flex items-center justify-between mb-4">
        <Link href={`/portal/${primero.pegue.codigo}?clave=${clave}`} className="text-azul text-sm">
          ← Volver
        </Link>
        <ImprimirBoton />
      </div>

      <div className="flex justify-center">
        <TicketRecibo
          numeroRecibo={primero.numeroRecibo || primero.loteId!.slice(-6).toUpperCase()}
          fecha={new Date(primero.fechaPago)}
          juntaNombre={junta}
          juntaSubtitulo={config.juntaSubtitulo}
          tituloRecibo={config.tituloRecibo}
          abonadoNombre={primero.pegue.abonado.nombre}
          codigo={primero.pegue.codigo}
          identidad={primero.pegue.abonado.identidad}
          barrioNombre={primero.pegue.barrio.nombre}
          serviciosNombres={primero.pegue.servicios.filter((ps) => ps.habilitado).map((ps) => ps.servicio.nombre)}
          tarifaMensual={primero.montoServicios}
          meses={pagos.map((p) => ({ mes: p.mesPagado, anio: p.anioPagado, mesesMora: p.mesesMora, monto: p.total }))}
          montoServiciosTotal={totalServicios}
          montoMoraTotal={totalMora}
          montoReconexionTotal={totalReconexion}
          montoDescuentoTotal={totalDescuento}
          motivoDescuento={motivoDescuento}
          total={totalGeneral}
          metodoPago={primero.metodoPago}
          mesesMoraActual={mesesMoraMax}
          corte={mesesMoraMax > 3}
          textoPie={config.textoPie}
          emitidoPor={primero.emitidoPor}
          anchoColumnas={impresora.anchoColumnas}
          fuente={impresora.fuente}
          mostrarDNI={config.mostrarDNI}
          mostrarBarrio={config.mostrarBarrio}
          mostrarServicios={config.mostrarServicios}
          mostrarTarifa={config.mostrarTarifa}
          mostrarEmitidoPor={config.mostrarEmitidoPor}
          pin={primero.pegue.abonado.pin}
          mostrarPin={config.mostrarPin}
        />
      </div>
    </div>
  );
}
