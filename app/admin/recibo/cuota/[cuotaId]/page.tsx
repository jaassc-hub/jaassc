import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { obtenerUsuarioActual } from "@/lib/auth";
import { tienePermiso } from "@/lib/permisos";
import AccesoDenegado from "@/components/AccesoDenegado";
import { CONFIG_DEFAULT } from "@/lib/reciboConfig";
import { IMPRESORA_DEFAULT } from "@/lib/impresoraConfig";
import TicketCuota from "@/components/TicketCuota";
import BotonAtras from "@/components/BotonAtras";
import BotonImprimir from "@/components/BotonImprimir";

export default async function ReciboCuotaPage({ params }: { params: { cuotaId: string } }) {
  const usuario = await obtenerUsuarioActual();
  if (!tienePermiso(usuario, "abonados")) {
    return <AccesoDenegado modulo="Pegues y abonados" />;
  }

  const cuota = await prisma.cuotaPegue.findUnique({
    where: { id: params.cuotaId },
    include: { pegue: { include: { abonado: true, barrio: true } } },
  });
  if (!cuota || !cuota.pagada) notFound();

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
        <BotonAtras href={`/admin/pegues/${cuota.pegueId}`} />
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
