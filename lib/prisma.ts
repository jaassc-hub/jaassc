import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: any };

// Neon (plan gratis) suspende la base de datos cuando no se usa por unos minutos.
// La primera consulta despues de eso a veces llega con la conexion ya cerrada
// ("Server has closed the connection" / P1017 / P1001). Esta extension reintenta
// automaticamente esas consultas 1-2 veces antes de rendirse, para que el usuario
// nunca vea ese error — el sistema simplemente tarda medio segundo mas esa vez.
function conReintentos(client: PrismaClient) {
  return client.$extends({
    query: {
      async $allOperations({ args, query }) {
        const MAX_REINTENTOS = 2;
        let ultimoError: any;
        for (let intento = 0; intento <= MAX_REINTENTOS; intento++) {
          try {
            return await query(args);
          } catch (e: any) {
            ultimoError = e;
            const esErrorDeConexion =
              e?.code === "P1017" ||
              e?.code === "P1001" ||
              /closed the connection|Connection.*reset|ECONNRESET/i.test(e?.message || "");
            if (!esErrorDeConexion || intento === MAX_REINTENTOS) throw e;
            await new Promise((r) => setTimeout(r, 300 * (intento + 1)));
          }
        }
        throw ultimoError;
      },
    },
  });
}

export const prisma =
  globalForPrisma.prisma ||
  conReintentos(
    new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    })
  );

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
