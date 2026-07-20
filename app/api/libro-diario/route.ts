import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mesesDeMora, siguienteMesPendiente } from "@/lib/mora";

// A partir de los eventos, arma los periodos en que el pegue estuvo en un estado dado
// (fecha de inicio y fecha de fin, o "sigue asi" si no hay evento de cierre).
function periodosDeEstado(eventos: { tipo: string; fecha: Date }[], tipoInicio: "CORTE" | "INHABILITACION") {
  const tiposFin = tipoInicio === "CORTE" ? ["RECONEXION", "REACTIVACION"] : ["REACTIVACION"];
  const ordenados = [...eventos].sort((a, b) => a.fecha.getTime() - b.fecha.getTime());
  const periodos: { inicio: Date; fin: Date | null }[] = [];
  let inicioActual: Date | null = null;

  for (const ev of ordenados) {
    if (ev.tipo === tipoInicio && !inicioActual) {
      inicioActual = ev.fecha;
    } else if (tiposFin.includes(ev.tipo) && inicioActual) {
      periodos.push({ inicio: inicioActual, fin: ev.fecha });
      inicioActual = null;
    }
  }
  if (inicioActual) {
    periodos.push({ inicio: inicioActual, fin: null }); // sigue en ese estado
  }
  return periodos;
}

export async function GET(req: NextRequest) {
  const anio = parseInt(req.nextUrl.searchParams.get("anio") || String(new Date().getFullYear()));
  const barrioId = req.nextUrl.searchParams.get("barrioId");

  const pegues = await prisma.pegue.findMany({
    where: barrioId ? { barrioId } : {},
    include: {
      abonado: true,
      barrio: true,
      servicios: { include: { servicio: true } },
      pagos: { select: { mesPagado: true, anioPagado: true }, orderBy: [{ anioPagado: "desc" }, { mesPagado: "desc" }] },
      eventos: {
        where: { tipo: { in: ["CORTE", "RECONEXION", "REACTIVACION", "INHABILITACION"] } },
        select: { tipo: true, fecha: true },
      },
    },
    orderBy: [{ barrio: { nombre: "asc" } }, { codigo: "asc" }],
  });

  const filas = pegues.map((p) => {
    let periodosCorte = periodosDeEstado(p.eventos, "CORTE");
    let periodosInhabilitado = periodosDeEstado(p.eventos, "INHABILITACION");
    // Respaldo para pegues migrados que ya estaban cortados/inhabilitados sin tener
    // el evento correspondiente registrado en el sistema.
    if (periodosCorte.length === 0 && p.estado === "CORTADO") {
      periodosCorte = [{ inicio: p.updatedAt, fin: null }];
    }
    if (periodosInhabilitado.length === 0 && p.estado === "INACTIVO") {
      periodosInhabilitado = [{ inicio: p.updatedAt, fin: null }];
    }
    const pagosDelAnio = p.pagos.filter((pg) => pg.anioPagado === anio);
    const hoy = new Date();
    const meses = Array.from({ length: 12 }, (_, i) => {
      const mes = i + 1;
      const inicioMes = new Date(anio, i, 1);
      const finMes = new Date(anio, i + 1, 0, 23, 59, 59);

      // Un mes que todavia no llega (es futuro respecto a hoy) no puede estar
      // "cortado" ni "inhabilitado" todavia -- eso se sabra cuando llegue ese mes.
      if (inicioMes > hoy) {
        return { pagado: false, cortado: false, inhabilitado: false };
      }

      const enPeriodo = (periodos: { inicio: Date; fin: Date | null }[]) =>
        periodos.some((per) => per.inicio <= finMes && (per.fin === null || per.fin >= inicioMes));
      return {
        pagado: pagosDelAnio.some((pg) => pg.mesPagado === mes),
        cortado: enPeriodo(periodosCorte),
        inhabilitado: enPeriodo(periodosInhabilitado),
      };
    });

    const serviciosHabilitados = p.servicios.filter((ps) => ps.habilitado);
    const pendiente = siguienteMesPendiente(p.pagos[0] || null, p.createdAt);
    const mesesMora = mesesDeMora(pendiente.mes, pendiente.anio);

    return {
      codigo: p.codigo,
      nombre: p.abonado.nombre,
      barrio: p.barrio.nombre,
      estado: p.estado,
      mesesMora,
      tarifa: serviciosHabilitados.reduce((s, ps) => s + ps.servicio.precio, 0),
      servicios: serviciosHabilitados.map((ps) => ps.servicio.nombre).join(", ") || "—",
      meses,
    };
  });

  return NextResponse.json({ filas });
}
