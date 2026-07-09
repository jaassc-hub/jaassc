import { prisma } from "./prisma";

export function generarPin(): string {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6 digitos
}

// Garantiza que un abonado tenga PIN. Si no tiene, se lo genera y guarda.
// Se llama cada vez que se muestra o se imprime algo relacionado a ese abonado,
// para que tarde o temprano todos los abonados (incluso los antiguos) terminen
// con un PIN asignado sin necesidad de una migracion manual.
export async function asegurarPin(abonadoId: string): Promise<string> {
  const abonado = await prisma.abonado.findUnique({ where: { id: abonadoId } });
  if (!abonado) throw new Error("Abonado no encontrado");
  if (abonado.pin) return abonado.pin;
  const pin = generarPin();
  await prisma.abonado.update({ where: { id: abonadoId }, data: { pin } });
  return pin;
}
