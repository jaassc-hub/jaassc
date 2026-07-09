import { prisma } from "@/lib/prisma";
import { CONFIG_DEFAULT } from "@/lib/reciboConfig";
import { IMPRESORA_DEFAULT } from "@/lib/impresoraConfig";
import { coincideClave } from "@/lib/portalAuth";
import Link from "next/link";
import TicketCuota from "@/components/TicketCuota";
import BotonImprimir from "@/components/BotonImprimir";

export default async function ReciboCuotaPublicoPage({
  params,
  searchParams,
}: {
  params: { cuotaId: string };
  searchParams: { clave?: string };
}) {
  const clave = searchParams.clave || "";

  const cuota = await prisma.cuotaPegue.findUnique({
    where: { id: params.cuotaId },
    include: { pegue: { include: { abonado: true, barrio: true } } },
  });

  if (!cuota || !cuota.pagada || !coincideClave(cuota.pegue.abonado, clave)) {
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

  return (
    <div className="max-w-lg mx-auto p-4 md:p-8">
      <div className="no-imprimir flex items-center justify-between mb-4">
        <Link href={`/portal/${cuota.pegue.codigo}?clave=${clave}`} className="text-azul text-sm">
          ← Volver
        </Link>
        <BotonImprimir />
      </div>
      <div className="flex justify-center">
        <TicketCuota
          numeroRecibo={cuota.numeroRecibo || cuota.id.slice(-6).toUpperCase()}
          fecha={new Date(cuota.fechaPago || cuota.createdAt)}
          juntaNombre={junta}
          juntaSubtitulo={config.juntaSubtitulo}
          abonadoNombre={cuota.pegue.abonado.nombre}
          codigo={cuota.pegue.codigo}
          identidad={cuota.pegue.abonado.identidad}
          barrioNombre={cuota.pegue.barrio.nombre}
          numero={cuota.numero}
          totalCuotas={cuota.totalCuotas}
          monto={cuota.monto}
          metodoPago={cuota.metodoPago || "EFECTIVO"}
          referencia={cuota.referencia}
          emitidoPor={cuota.emitidoPor}
          pin={cuota.pegue.abonado.pin}
          textoPie={config.textoPie}
          anchoColumnas={impresora.anchoColumnas}
          fuente={impresora.fuente}
          mostrarDNI={config.mostrarDNI}
          mostrarBarrio={config.mostrarBarrio}
          mostrarEmitidoPor={config.mostrarEmitidoPor}
          mostrarPin={config.mostrarPin}
        />
      </div>
    </div>
  );
}
