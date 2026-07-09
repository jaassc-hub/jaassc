// Script de migracion desde Excel.
// Uso:
//   node prisma/migrar-excel.js abonados   -> crea abonados + pegues (correr UNA sola vez)
//   node prisma/migrar-excel.js pagos      -> importa los pagos de prisma/migracion/pagos.json
//
// Es seguro volver a correr "pagos" con un archivo nuevo (ej. el de junio): los pagos ya
// importados se detectan (mismo pegue + mes + año) y se saltan solos, no se duplican.
// El paso "abonados" tambien es seguro de repetir: si el pegue ya existe, no lo vuelve a crear.

const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

const CARPETA = path.join(__dirname, "migracion");

function generarPin() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function normalizarNombre(nombre) {
  return nombre
    .replace(/\([^)]*\)/g, "") // quita "(Casa #2)", "(Solar)", etc.
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // quita acentos
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

async function importarAbonados() {
  const abonados = JSON.parse(fs.readFileSync(path.join(CARPETA, "abonados.json"), "utf-8"));

  const barrios = await prisma.barrio.findMany();
  const barrioPorPrefijo = Object.fromEntries(barrios.map((b) => [b.prefijo, b]));

  const servicios = await prisma.servicio.findMany();
  const servicioAgua = servicios.find((s) => s.nombre === "Agua Potable");
  const servicioAlc = servicios.find((s) => s.nombre === "Alcantarillado");

  if (!servicioAgua || !servicioAlc) {
    console.error("No se encontraron los servicios 'Agua Potable' y 'Alcantarillado'. Corra primero 'npm run seed'.");
    process.exit(1);
  }

  console.log(
    `Nota: según el Excel, la tarifa de Agua Potable es L${servicioAgua.precio} y Alcantarillado L${servicioAlc.precio} actualmente en el sistema.\n` +
    `Si en su Excel la tarifa combinada era L100 (L50 + L50), ajuste los precios en Configuración → Servicios ANTES de cobrar en el sistema nuevo (esto no afecta los pagos ya migrados, que guardan su propio monto histórico).`
  );

  let creados = 0, saltados = 0, errores = 0;
  const avisosIdentidad = [];

  for (const a of abonados) {
    const barrio = barrioPorPrefijo[a.barrioPrefijo];
    if (!barrio) {
      console.warn(`SALTADO ${a.codigo}: no existe el barrio con prefijo ${a.barrioPrefijo}`);
      errores++;
      continue;
    }

    const existente = await prisma.pegue.findUnique({ where: { codigo: a.codigo } });
    if (existente) {
      saltados++;
      continue;
    }

    try {
      let abonado = null;
      let identidadParaGuardar = a.identidad || null;

      if (a.identidad) {
        const existentePorIdentidad = await prisma.abonado.findUnique({ where: { identidad: a.identidad } });
        if (existentePorIdentidad) {
          if (normalizarNombre(existentePorIdentidad.nombre) === normalizarNombre(a.nombre)) {
            abonado = existentePorIdentidad;
            console.log(`  ${a.codigo}: identidad ${a.identidad} ya pertenece a "${abonado.nombre}" — se agrega este pegue a ese mismo abonado.`);
          } else {
            identidadParaGuardar = null;
            avisosIdentidad.push(
              `${a.codigo} (${a.nombre}) tiene la misma identidad ${a.identidad} que "${existentePorIdentidad.nombre}", pero son nombres distintos. ` +
              `Se creó sin identidad — revise cuál es la correcta y corríjala a mano en el panel.`
            );
          }
        }
      }

      if (!abonado) {
        abonado = await prisma.abonado.create({
          data: {
            nombre: a.nombre,
            identidad: identidadParaGuardar,
            telefono: a.telefono || null,
            direccion: a.observaciones || null,
            activo: true,
            pin: generarPin(),
          },
        });
      }

      const servicioIds = [];
      if (a.agua_potable) servicioIds.push(servicioAgua.id);
      if (a.alcantarillado) servicioIds.push(servicioAlc.id);

      await prisma.pegue.create({
        data: {
          codigo: a.codigo,
          abonadoId: abonado.id,
          barrioId: barrio.id,
          estado: a.estado,
          servicios: {
            create: servicioIds.map((servicioId) => ({ servicioId, habilitado: true })),
          },
        },
      });

      creados++;
    } catch (e) {
      console.error(`ERROR creando ${a.codigo}:`, e.message);
      errores++;
    }
  }

  // Ajustar el correlativo de cada barrio al numero mas alto ya usado
  for (const barrio of barrios) {
    const pegues = await prisma.pegue.findMany({
      where: { barrioId: barrio.id },
      select: { codigo: true },
    });
    let maxNum = 0;
    for (const p of pegues) {
      const match = p.codigo.match(/(\d+)$/);
      if (match) maxNum = Math.max(maxNum, parseInt(match[1]));
    }
    if (maxNum > barrio.ultimoNum) {
      await prisma.barrio.update({ where: { id: barrio.id }, data: { ultimoNum: maxNum } });
    }
  }

  console.log(`\nAbonados/pegues creados: ${creados} | ya existían: ${saltados} | errores: ${errores}`);

  if (avisosIdentidad.length > 0) {
    console.log(`\n⚠ ${avisosIdentidad.length} identidad(es) en conflicto (se crearon sin identidad, revíselas usted):`);
    avisosIdentidad.forEach((a) => console.log("  - " + a));
  }
}

async function importarPagos() {
  const pagos = JSON.parse(fs.readFileSync(path.join(CARPETA, "pagos.json"), "utf-8"));

  let creados = 0, saltadosDuplicado = 0, errores = 0;
  const anioMaxRecibo = {};

  for (const p of pagos) {
    const pegue = await prisma.pegue.findUnique({ where: { codigo: p.codigo } });
    if (!pegue) {
      console.warn(`SALTADO recibo ${p.numeroRecibo}: no existe el pegue ${p.codigo}. Corra primero "abonados".`);
      errores++;
      continue;
    }

    const loteId = p.meses.length > 1 ? `migrado-${p.numeroRecibo}` : null;
    const fecha = new Date(p.fechaPago);

    for (let i = 0; i < p.meses.length; i++) {
      const mes = p.meses[i];
      const esPrimero = i === 0;
      const yaExiste = await prisma.pago.findUnique({
        where: { pegueId_mesPagado_anioPagado: { pegueId: pegue.id, mesPagado: mes, anioPagado: p.anio } },
      }).catch(() => null);

      if (yaExiste) {
        saltadosDuplicado++;
        continue;
      }

      const total =
        p.tarifaMensual +
        (esPrimero ? p.montoMora : 0) +
        (esPrimero ? p.montoReconexion : 0) -
        (esPrimero ? p.montoDescuento : 0);

      try {
        await prisma.pago.create({
          data: {
            pegueId: pegue.id,
            mesPagado: mes,
            anioPagado: p.anio,
            montoServicios: p.tarifaMensual,
            montoMora: esPrimero ? p.montoMora : 0,
            montoReconexion: esPrimero ? p.montoReconexion : 0,
            montoDescuento: esPrimero ? p.montoDescuento : 0,
            motivoDescuento: esPrimero ? p.motivoDescuento : null,
            mesesMora: 0, // dato historico, no se recalcula
            total,
            metodoPago: p.metodoPago,
            observaciones: "Migrado desde Excel",
            loteId,
            numeroRecibo: p.numeroRecibo,
            emitidoPor: "Importado de Excel",
            fechaPago: fecha,
          },
        });
        creados++;
        const anioRecibo = parseInt(p.numeroRecibo.split("-")[0]);
        const numRecibo = parseInt(p.numeroRecibo.split("-")[1]);
        anioMaxRecibo[anioRecibo] = Math.max(anioMaxRecibo[anioRecibo] || 0, numRecibo);
      } catch (e) {
        console.error(`ERROR en recibo ${p.numeroRecibo} (${p.codigo}, mes ${mes}/${p.anio}):`, e.message);
        errores++;
      }
    }
  }

  // Actualizar el contador de correlativo para que los recibos nuevos sigan despues del ultimo migrado
  for (const [anioCorto, num] of Object.entries(anioMaxRecibo)) {
    const anioCompleto = 2000 + parseInt(anioCorto);
    const actual = await prisma.contadorRecibo.findUnique({ where: { anio: anioCompleto } });
    if (!actual || actual.ultimo < num) {
      await prisma.contadorRecibo.upsert({
        where: { anio: anioCompleto },
        update: { ultimo: num },
        create: { anio: anioCompleto, ultimo: num },
      });
    }
  }

  console.log(`\nPagos creados: ${creados} | ya existían (se saltaron): ${saltadosDuplicado} | errores: ${errores}`);

  const rutaRevisar = path.join(CARPETA, "revisar_manualmente.json");
  if (fs.existsSync(rutaRevisar)) {
    const revisar = JSON.parse(fs.readFileSync(rutaRevisar, "utf-8"));
    if (revisar.length > 0) {
      console.log(`\n⚠ Hay ${revisar.length} fila(s) del Excel que no se pudieron migrar automáticamente (revisar_manualmente.json):`);
      revisar.forEach((r) => console.log(`  - Recibo ${r.recibo} · ${r.codigo} ${r.nombre} · L${r.monto} · ${r.motivo}`));
    }
  }
}

async function main() {
  const modo = process.argv[2];
  if (modo === "abonados") {
    await importarAbonados();
  } else if (modo === "pagos") {
    await importarPagos();
  } else {
    console.log("Uso: node prisma/migrar-excel.js abonados | pagos");
    process.exit(1);
  }
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
