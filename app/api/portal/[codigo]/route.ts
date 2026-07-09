import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { coincideClave } from "@/lib/portalAuth";
import { asegurarPin } from "@/lib/pin";

export async function GET(
  req: NextRequest,
  { params }: { params: { codigo: string } }
) {
  const clave = req.nextUrl.searchParams.get("clave") || req.nextUrl.searchParams.get("identidad") || "";

  const pegue = await prisma.pegue.findFirst({
    where: { codigo: { equals: params.codigo, mode: "insensitive" } },
    include: {
      abonado: true,
      barrio: true,
      servicios: { include: { servicio: true } },
      pagos: { orderBy: [{ anioPagado: "desc" }, { mesPagado: "desc" }] },
    },
  });

  if (!pegue) {
    return NextResponse.json({ error: "No se encontró ninguna cuenta con esos datos" }, { status: 404 });
  }

  await asegurarPin(pegue.abonadoId);

  if (!coincideClave(pegue.abonado, clave)) {
    return NextResponse.json(
      { error: "No se encontró ninguna cuenta con esos datos" },
      { status: 404 }
    );
  }

  return NextResponse.json(pegue);
}
