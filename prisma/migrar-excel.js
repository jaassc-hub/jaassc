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

// Neon a veces cierra la conexion si estuvo inactiva un rato ("Server has closed the
// connection", P1017). Esto reintenta esa operacion puntual antes de rendirse, esperando
// cada vez un poco mas, y forzando una conexion nueva (no solo reintentar sobre la misma
// conexion ya rota).
async function conReintentos(fn, intentos = 6) {
  for (let i = 0; i < intentos; i++) {
    try {
      return await fn();
    } catch (e) {
      const esErrorDeConexion = e.code === "P1017" || e.code === "P1001" || e.code === "P1008" || /closed the connection|timed out/i.test(e.message || "");
      if (!esErrorDeConexion || i === intentos - 1) throw e;
      const espera = 3000 * (i + 1); // 3s, 6s, 9s, 12s, 15s...
      console.log(`  (conexion perdida, reintentando en ${espera / 1000}s... intento ${i + 1}/${intentos})`);
      await prisma.$disconnect(); // fuerza una conexion nueva en el proximo intento
      await new Promise((r) => setTimeout(r, espera));
    }
  }
}

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

  const barrios = await conReintentos(() => prisma.barrio.findMany());
  const barrioPorPrefijo = Object.fromEntries(barrios.map((b) => [b.prefijo, b]));

  const servicios = await conReintentos(() => prisma.servicio.findMany());
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

  console.log(`Cargando pegues...`);
  const pegues = await conReintentos(() => prisma.pegue.findMany({ select: { id: true, codigo: true } }));
  const pegueIdPorCodigo = Object.fromEntries(pegues.map((p) => [p.codigo, p.id]));

  // Se arma toda la lista de filas a insertar en memoria (sin tocar la base de datos todavia)
  const filas = [];
  let sinPegue = 0;
  for (const p of pagos) {
    const pegueId = pegueIdPorCodigo[p.codigo];
    if (!pegueId) {
      console.warn(`SALTADO recibo ${p.numeroRecibo}: no existe el pegue ${p.codigo}. Corra primero "abonados".`);
      sinPegue++;
      continue;
    }
    const loteId = p.meses.length > 1 ? `migrado-${p.numeroRecibo}` : null;
    const fecha = new Date(p.fechaPago);

    p.meses.forEach((mes, i) => {
      const esPrimero = i === 0;
      const total =
        p.tarifaMensual +
        (esPrimero ? p.montoMora : 0) +
        (esPrimero ? p.montoReconexion : 0) -
        (esPrimero ? p.montoDescuento : 0);

      filas.push({
        pegueId,
        mesPagado: mes,
        anioPagado: p.anio,
        montoServicios: p.tarifaMensual,
        montoMora: esPrimero ? p.montoMora : 0,
        montoReconexion: esPrimero ? p.montoReconexion : 0,
        montoDescuento: esPrimero ? p.montoDescuento : 0,
        motivoDescuento: esPrimero ? p.motivoDescuento : null,
        mesesMora: 0,
        total,
        metodoPago: p.metodoPago,
        observaciones: "Migrado desde Excel",
        loteId,
        numeroRecibo: p.numeroRecibo,
        emitidoPor: "Importado de Excel",
        fechaPago: fecha,
      });
    });
  }

  console.log(`${filas.length} pagos por insertar (en lotes de 200)...`);

  let insertados = 0;
  const LOTE = 75;
  for (let i = 0; i < filas.length; i += LOTE) {
    const bloque = filas.slice(i, i + LOTE);
    const resultado = await conReintentos(() =>
      prisma.pago.createMany({ data: bloque, skipDuplicates: true })
    );
    insertados += resultado.count;
    console.log(`  ${Math.min(i + LOTE, filas.length)} / ${filas.length} procesados (${insertados} nuevos hasta ahora)...`);
  }

  const saltadosDuplicado = filas.length - insertados;

  // Actualizar el contador de correlativo para que los recibos nuevos sigan despues del ultimo migrado
  const anioMaxRecibo = {};
  for (const p of pagos) {
    const [anioCorto, num] = p.numeroRecibo.split("-");
    const anioCompleto = 2000 + parseInt(anioCorto);
    anioMaxRecibo[anioCompleto] = Math.max(anioMaxRecibo[anioCompleto] || 0, parseInt(num));
  }
  for (const [anio, num] of Object.entries(anioMaxRecibo)) {
    const anioInt = parseInt(anio);
    await conReintentos(async () => {
      const actual = await prisma.contadorRecibo.findUnique({ where: { anio_tipo: { anio: anioInt, tipo: "PAGO" } } });
      if (!actual || actual.ultimo < num) {
        await prisma.contadorRecibo.upsert({
          where: { anio_tipo: { anio: anioInt, tipo: "PAGO" } },
          update: { ultimo: num },
          create: { anio: anioInt, tipo: "PAGO", ultimo: num },
        });
      }
    });
  }

  console.log(`\nPagos creados: ${insertados} | ya existían (se saltaron): ${saltadosDuplicado} | sin pegue: ${sinPegue}`);

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
