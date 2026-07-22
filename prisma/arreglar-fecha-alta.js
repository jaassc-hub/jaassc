// Corrige, UNA SOLA VEZ, la fecha de alta de los pegues que ya estan en la base de
// datos y todavia no tienen ningun pago registrado -- para que el sistema calcule
// correctamente que deben desde marzo de 2025 (cuando esta directiva tomo posesion),
// en vez de "desde hoy" (que era la fecha en que se corrio la migracion del Excel).
//
// Es seguro correrlo: solo toca pegues SIN ningun pago. Si un pegue ya tiene aunque
// sea un pago registrado, esta fecha ya no se usa para nada y no se toca.
//
// Uso:
//   node prisma/arreglar-fecha-alta.js

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const peguesSinPagos = await prisma.pegue.findMany({
    where: { pagos: { none: {} } },
    select: { id: true, codigo: true, createdAt: true },
  });

  console.log(`${peguesSinPagos.length} pegue(s) sin ningun pago registrado encontrados.`);

  const fechaCorrecta = new Date(2025, 2, 1); // 1 de marzo de 2025
  let corregidos = 0;

  for (const p of peguesSinPagos) {
    if (p.createdAt.getTime() === fechaCorrecta.getTime()) continue; // ya estaba bien
    await prisma.pegue.update({
      where: { id: p.id },
      data: { createdAt: fechaCorrecta },
    });
    corregidos++;
  }

  console.log(`Corregidos: ${corregidos} | ya estaban bien: ${peguesSinPagos.length - corregidos}`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
