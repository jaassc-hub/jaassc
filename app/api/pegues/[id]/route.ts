import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerUsuarioActual } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const data: any = {};
  if (body.codigo !== undefined) data.codigo = body.codigo;
  if (body.estado !== undefined) data.estado = body.estado;
  if (body.barrioId !== undefined) data.barrioId = body.barrioId;
  if (body.ubicacion !== undefined) data.ubicacion = body.ubicacion;

  try {
    const anterior = await prisma.pegue.findUnique({ where: { id: params.id } });
    if (!anterior) {
      return NextResponse.json({ error: "Pegue no encontrado" }, { status: 404 });
    }

    // Exigir motivo al cambiar el estado (corte, inhabilitacion o reactivacion)
    if (body.estado !== undefined && anterior.estado !== body.estado && !body.motivo?.trim()) {
      return NextResponse.json(
        { error: "Debe indicar un motivo para este cambio de estado" },
        { status: 400 }
      );
    }

    const pegue = await prisma.pegue.update({
      where: { id: params.id },
      data,
    });

    if (body.estado !== undefined && anterior.estado !== body.estado) {
      const tipoEvento =
        body.estado === "CORTADO" ? "CORTE" : body.estado === "INACTIVO" ? "INHABILITACION" : "REACTIVACION";
      const usuarioActual = await obtenerUsuarioActual();
      await prisma.eventoPegue.create({
        data: {
          pegueId: params.id,
          tipo: tipoEvento,
          nota: body.motivo?.trim() || null,
          realizadoPor: usuarioActual ? usuarioActual.nombre || usuarioActual.username : null,
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
