import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { addDias, inicioDaSemana } from "./dates";

// Regra trabalhista: no máximo 2 diárias por semana na MESMA loja, a não ser que
// a loja (ou o RH) tenha liberado, assumindo o risco de vínculo.
export const MAX_DIARIAS_SEMANA_LOJA = 2;

// Data "infinita" usada para bloqueio global "para sempre".
export const BLOQUEIO_PARA_SEMPRE = new Date("9999-12-31T00:00:00.000Z");

// Filtro Prisma: só diaristas SEM bloqueio global ativo.
export function semBloqueioGlobalWhere(): Prisma.DiaristaWhereInput {
  return { OR: [{ bloqueadoAte: null }, { bloqueadoAte: { lte: new Date() } }] };
}

// Diz se a diarista está com bloqueio global ativo agora.
export function bloqueadaGlobalmente(bloqueadoAte: Date | null): boolean {
  return bloqueadoAte != null && bloqueadoAte > new Date();
}

// Confere no banco se a diarista está bloqueada globalmente (para usar nas actions).
export async function temBloqueioGlobal(diaristaId: string): Promise<boolean> {
  const d = await prisma.diarista.findUnique({
    where: { id: diaristaId },
    select: { bloqueadoAte: true },
  });
  return bloqueadaGlobalmente(d?.bloqueadoAte ?? null);
}

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
