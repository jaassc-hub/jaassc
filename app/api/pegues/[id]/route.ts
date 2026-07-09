import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const data: any = {};
  if (body.codigo !== undefined) data.codigo = body.codigo;
  if (body.estado !== undefined) data.estado = body.estado;
  if (body.barrioId !== undefined) data.barrioId = body.barrioId;

  try {
    const anterior = await prisma.pegue.findUnique({ where: { id: params.id } });

    const pegue = await prisma.pegue.update({
      where: { id: params.id },
      data,
    });

    // Si el estado cambio manualmente, se deja constancia en el historial
    if (body.estado !== undefined && anterior && anterior.estado !== body.estado) {
      const tipoEvento =
        body.estado === "CORTADO" ? "CORTE" : body.estado === "INACTIVO" ? "INHABILITACION" : "REACTIVACION";
      await prisma.eventoPegue.create({
        data: {
          pegueId: params.id,
          tipo: tipoEvento,
          nota: "Cambio manual de estado desde el panel administrativo",
        },
      });
    }

    // Actualizar servicios habilitados si vienen en el body
    if (body.servicioIds) {
      await prisma.pegueServicio.deleteMany({ where: { pegueId: params.id } });
      await prisma.pegueServicio.createMany({
        data: body.servicioIds.map((servicioId: string) => ({
          pegueId: params.id,
          servicioId,
          habilitado: true,
        })),
      });
    }

    const actualizado = await prisma.pegue.findUnique({
      where: { id: params.id },
      include: { servicios: { include: { servicio: true } }, barrio: true },
    });

    return NextResponse.json(actualizado);
  } catch (e: any) {
    if (e.code === "P2002") {
      return NextResponse.json(
        { error: "Ese código ya está en uso por otro pegue" },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}
