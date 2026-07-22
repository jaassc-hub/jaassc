import Link from "next/link";
import Logo from "@/components/Logo";
import CarruselAvisos from "@/components/CarruselAvisos";
import { Droplets, FileText, Search } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { AVISOS_PORTAL_DEFAULT } from "@/lib/avisosPortalConfig";

export default async function Home() {
  const nombreJunta = process.env.NEXT_PUBLIC_JUNTA_NOMBRE || "Junta de Agua";

  const row = await prisma.configuracion.findUnique({ where: { clave: "avisosPortal" } });
  const config = row ? JSON.parse(row.valor) : AVISOS_PORTAL_DEFAULT;

  return (
    <main className="min-h-screen bg-azul flex flex-col">
      <header className="flex items-center justify-between p-4 md:p-6">
        <div className="flex items-center gap-2 text-white">
          <Logo size={32} />
          <span className="font-semibold text-sm md:text-base">{nombreJunta}</span>
        </div>
        <Link
          href="/admin"
          className="text-white/80 hover:text-white text-sm font-medium border border-white/30 rounded-lg px-3 py-1.5 hover:bg-white/10 transition-colors"
        >
          Panel administrativo
        </Link>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-16 gap-10">
        <div className="text-center max-w-lg">
          <Droplets className="text-white mx-auto mb-4" size={56} strokeWidth={1.5} />
          <h1 className="text-white text-2xl md:text-3xl font-bold mb-2">{nombreJunta}</h1>
          <p className="text-white/80 mb-10">
            Consulte su estado de cuenta, vea su historial de pagos y descargue sus recibos.
          </p>

          <Link
            href="/portal"
            className="inline-flex items-center gap-2 bg-white text-azul font-semibold px-6 py-3.5 rounded-xl shadow-lg hover:bg-gray-100 transition-colors text-lg"
          >
            <Search size={20} />
            Consultar mi estado de cuenta
          </Link>

          <div className="flex items-center justify-center gap-2 text-white/60 text-sm mt-8">
            <FileText size={16} />
            <span>Necesita el código de su pegue y su número de identidad.</span>
          </div>
        </div>

        <CarruselAvisos avisos={config.avisos} />
      </div>
    </main>
  );
}
