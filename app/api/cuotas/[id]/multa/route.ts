import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerUsuarioActual } from "@/lib/auth";
import { tienePermiso } from "@/lib/permisos";
import { NOTIFICACIONES_DEFAULT } from "@/lib/notificacionesConfig";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const usuarioActual = await obtenerUsuarioActual();
  if (!tienePermiso(usuarioActual, "abonados")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const cuota = await prisma.cuotaPegue.findUnique({ where: { id: params.id } });
  if (!cuota) {
    return NextResponse.json({ error: "Cuota no encontrada" }, { status: 404 });
  }
  if (cuota.pagada) {
    return NextResponse.json({ error: "Esa cuota ya está pagada" }, { status: 400 });
  }
  if (cuota.multaAplicada) {
    return NextResponse.json({ error: "Ya se le aplicó la multa a esta cuota" }, { status: 400 });
  }

  const configRow = await prisma.configuracion.findUnique({ where: { clave: "notificaciones" } });
  const config = configRow ? { ...NOTIFICACIONES_DEFAULT, ...JSON.parse(configRow.valor) } : NOTIFICACIONES_DEFAULT;

  const actualizada = await prisma.cuotaPegue.update({
    where: { id: params.id },
    data: {
      monto: cuota.monto + config.montoMultaCuotaAtrasada,
      multaAplicada: true,
    },
  });

  return NextResponse.json(actualizada);
}
