import { prisma } from "./prisma";
import { addDias, inicioDaSemana } from "./dates";

// Regra trabalhista: no máximo 2 diárias por semana na MESMA loja, a não ser que
// a loja (ou o RH) tenha liberado, assumindo o risco de vínculo.
export const MAX_DIARIAS_SEMANA_LOJA = 2;

export async function podeMaisUmaNaSemana(
  diaristaId: string,
  lojaId: string,
  data: string,
): Promise<boolean> {
  const loja = await prisma.loja.findUnique({
    where: { id: lojaId },
    select: { permiteMais2Semana: true },
  });
  if (loja?.permiteMais2Semana) return true;

  const ini = inicioDaSemana(data);
  const fim = addDias(ini, 6);
  const n = await prisma.escala.count({
    where: { diaristaId, lojaId, data: { gte: ini, lte: fim } },
  });
  return n < MAX_DIARIAS_SEMANA_LOJA;
}
