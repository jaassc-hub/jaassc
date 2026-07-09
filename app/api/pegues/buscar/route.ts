import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { asegurarPin } from "@/lib/pin";

// Incluye completo de un pegue, reutilizado para ambos caminos de resultado.
const incluirPegueCompleto = {
  abonado: {
    include: {
      pegues: {
        include: {
          barrio: true,
          pagos: { orderBy: [{ anioPagado: "desc" as const }, { mesPagado: "desc" as const }], take: 1 },
        },
      },
    },
  },
  barrio: true,
  servicios: { include: { servicio: true } },
  pagos: { orderBy: [{ anioPagado: "desc" as const }, { mesPagado: "desc" as const }], take: 1 },
  eventos: { orderBy: { fecha: "desc" as const }, take: 5 },
  cuotas: { orderBy: { numero: "asc" as const } },
};

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") || "").trim();
  if (!q) {
    return NextResponse.json({ error: "Escriba un código, identidad o nombre" }, { status: 400 });
  }

  // 1. Coincidencia exacta de codigo de pegue
  const porCodigo = await prisma.pegue.findFirst({
    where: { codigo: { equals: q, mode: "insensitive" } },
    include: incluirPegueCompleto,
  });
  if (porCodigo) {
    const pin = await asegurarPin(porCodigo.abonadoId);
    (porCodigo.abonado as any).pin = pin;
    return NextResponse.json({ tipo: "pegue", pegue: porCodigo });
  }

  // 2. Coincidencia exacta de identidad -> si tiene un solo pegue, se selecciona directo
  const porIdentidad = await prisma.abonado.findFirst({
    where: { identidad: { equals: q, mode: "insensitive" } },
    include: { pegues: { include: { barrio: true } } },
  });
  if (porIdentidad && porIdentidad.pegues.length === 1) {
    const pegue = await prisma.pegue.findUnique({
      where: { id: porIdentidad.pegues[0].id },
      include: incluirPegueCompleto,
    });
    if (pegue) {
      const pin = await asegurarPin(pegue.abonadoId);
      (pegue.abonado as any).pin = pin;
    }
    return NextResponse.json({ tipo: "pegue", pegue });
  }

  // 3. Busqueda amplia por nombre/identidad -> se devuelve lista para elegir
  const abonados = await prisma.abonado.findMany({
    where: {
      OR: [
        { nombre: { contains: q, mode: "insensitive" } },
        { identidad: { contains: q, mode: "insensitive" } },
        { pegues: { some: { codigo: { contains: q, mode: "insensitive" } } } },
      ],
    },
    include: { pegues: { include: { barrio: true } } },
    take: 20,
  });

  if (abonados.length === 0) {
    return NextResponse.json({ error: "No se encontró ningún pegue o abonado con esos datos" }, { status: 404 });
  }

  return NextResponse.json({ tipo: "lista", abonados });
}
