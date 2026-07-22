import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerUsuarioActual } from "@/lib/auth";
import { tienePermiso } from "@/lib/permisos";

export async function GET(req: NextRequest) {
  const usuarioActual = await obtenerUsuarioActual();
  if (!usuarioActual) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const soloMias = req.nextUrl.searchParams.get("mias") === "true";
  const incluirResueltas = req.nextUrl.searchParams.get("resueltas") === "true";

  const delegaciones = await prisma.delegacion.findMany({
    where: {
      ...(soloMias ? { asignadoAId: usuarioActual.id } : {}),
      ...(incluirResueltas ? {} : { resuelto: false }),
    },
    include: {
      pegue: { include: { abonado: true, barrio: true } },
      asignadoA: { select: { id: true, nombre: true, username: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(delegaciones);
}

export async function POST(req: NextRequest) {
  const usuarioActual = await obtenerUsuarioActual();
  if (!tienePermiso(usuarioActual, "abonados")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json();
  const { pegueId, tipo, cuotaId, eventoId, asignadoAId, nota } = body;

  if (!pegueId || !tipo || !asignadoAId) {
    return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 });
  }

  const delegacion = await prisma.delegacion.create({
    data: {
      pegueId,
      tipo,
      cuotaId: cuotaId || null,
      eventoId: eventoId || null,
      asignadoAId,
      asignadoPor: usuarioActual!.nombre || usuarioActual!.username,
      nota: nota || null,
    },
    include: {
      pegue: { include: { abonado: true, barrio: true } },
      asignadoA: { select: { id: true, nombre: true, username: true } },
    },
  });

  return NextResponse.json(delegacion);
}
