import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CONFIG_DEFAULT } from "@/lib/reciboConfig";

export async function GET() {
  const row = await prisma.configuracion.findUnique({ where: { clave: "recibo" } });
  if (!row) return NextResponse.json(CONFIG_DEFAULT);
  return NextResponse.json(JSON.parse(row.valor));
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  await prisma.configuracion.upsert({
    where: { clave: "recibo" },
    update: { valor: JSON.stringify(body) },
    create: { clave: "recibo", valor: JSON.stringify(body) },
  });
  return NextResponse.json(body);
}
