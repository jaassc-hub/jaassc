const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  // Barrios iniciales segun lo indicado
  const barrios = [
    { nombre: "Guadalupe", prefijo: "GUA" },
    { nombre: "3 de Mayo", prefijo: "3MY" },
    { nombre: "San Jose", prefijo: "SNJ" },
    { nombre: "Lempira", prefijo: "LEM" },
  ];

  for (const b of barrios) {
    await prisma.barrio.upsert({
      where: { prefijo: b.prefijo },
      update: {},
      create: b,
    });
  }

  // Servicios iniciales (el admin puede editar precios despues desde el panel)
  const servicios = [
    { nombre: "Agua Potable", precio: 100 },
    { nombre: "Alcantarillado", precio: 30 },
    { nombre: "Tren de Aseo", precio: 20 },
  ];

  for (const s of servicios) {
    await prisma.servicio.upsert({
      where: { nombre: s.nombre },
      update: {},
      create: s,
    });
  }

  // Usuario inicial: Presidente, con acceso total al sistema.
  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD || "admin1234";
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.usuario.upsert({
    where: { username },
    update: {},
    create: { username, passwordHash, nombre: "Administrador", rol: "PRESIDENTE" },
  });

  console.log("Semilla completa. Usuario inicial (Presidente):", username);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
