import { obtenerUsuarioActual } from "@/lib/auth";
import { tienePermiso } from "@/lib/permisos";
import AccesoDenegado from "@/components/AccesoDenegado";
import { prisma } from "@/lib/prisma";
import { FIRMAS_DEFAULT } from "@/lib/firmasConfig";
import { NOTA_MORA_DEFAULT } from "@/lib/notaMoraConfig";
import NotasMoraClient from "./NotasMoraClient";

export default async function NotasMoraPage() {
  const usuario = await obtenerUsuarioActual();
  if (!tienePermiso(usuario, "abonados")) {
    return <AccesoDenegado modulo="Pegues y abonados" />;
  }

  const [firmasRow, notaConfigRow] = await Promise.all([
    prisma.configuracion.findUnique({ where: { clave: "firmas" } }),
    prisma.configuracion.findUnique({ where: { clave: "notaMora" } }),
  ]);

  const firmas = firmasRow ? JSON.parse(firmasRow.valor) : FIRMAS_DEFAULT;
  const notaConfig = notaConfigRow ? { ...NOTA_MORA_DEFAULT, ...JSON.parse(notaConfigRow.valor) } : NOTA_MORA_DEFAULT;

  return (
    <NotasMoraClient
      juntaNombre={process.env.NEXT_PUBLIC_JUNTA_NOMBRE || "Junta de Agua"}
      firmantesIniciales={firmas.firmantes}
      notaConfig={notaConfig}
    />
  );
}
