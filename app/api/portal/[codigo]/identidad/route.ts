import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { coincideClave } from "@/lib/portalAuth";

// Formato hondureño: DDDD-AAAA-NNNNN (13 digitos). Acepta con o sin guiones y los
// normaliza siempre al mismo formato antes de guardar.
function normalizarIdentidad(valor: string): string | null {
  const digitos = valor.replace(/[^0-9]/g, "");
  if (digitos.length !== 13) return null;
  return `${digitos.slice(0, 4)}-${digitos.slice(4, 8)}-${digitos.slice(8, 13)}`;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { codigo: string } }
) {
  const body = await req.json();
  const clave = body.clave || "";
  const nuevaIdentidad = (body.nuevaIdentidad || "").trim();

  const pegue = await prisma.pegue.findFirst({
    where: { codigo: { equals: params.codigo, mode: "insensitive" } },
    include: { abonado: true },
  });

  if (!pegue || !coincideClave(pegue.abonado, clave)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  if (pegue.abonado.identidad) {
    return NextResponse.json(
      { error: "Este abonado ya tiene una identidad registrada. Si está mal, pida a la Junta que la corrija." },
      { status: 400 }
    );
  }

  const normalizada = normalizarIdentidad(nuevaIdentidad);
  if (!normalizada) {
    return NextResponse.json(
      { error: "El número de identidad debe tener 13 dígitos (formato DDDD-AAAA-NNNNN)." },
      { status: 400 }
    );
  }

  const yaExiste = await prisma.abonado.findUnique({ where: { identidad: normalizada } });
  if (yaExiste) {
    return NextResponse.json(
      { error: "Ese número de identidad ya está registrado con otro abonado. Contacte a la Junta." },
      { status: 400 }
    );
  }

  const actualizado = await prisma.abonado.update({
    where: { id: pegue.abonadoId },
    data: { identidad: normalizada, identidadAutocompletada: true },
  });

  return NextResponse.json({ identidad: actualizado.identidad });
}
