import { prisma } from "./prisma";
import { ASPECTOS } from "./aspectos";

export const VALOR_BONUS = 10000; // R$ 100,00 em centavos
export const MEDIA_MINIMA_CASHBACK = 9.0; // de 0 a 10 (equivale a 4,5 de 5)
export const DIARIAS_CASHBACK = 5;
// Segundo bônus: 20 diárias bem avaliadas (média >= 8,5) → mais R$ 100,00.
export const DIARIAS_CASHBACK_20 = 20;
export const MEDIA_MINIMA_CASHBACK_20 = 8.5;
export const MIN_DIARIAS_TOP = 3; // mínimo de diárias avaliadas no mês para entrar no ranking

export function mediaDaAvaliacao(a: Record<string, number>): number {
  return ASPECTOS.reduce((s, asp) => s + a[asp.key], 0) / ASPECTOS.length;
}

export function mesAtual(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export type LinhaRanking = {
  id: string;
  nome: string;
  media: number;
  diarias: number;
};

// Ranking do mês ("AAAA-MM") por média das avaliações, com mínimo de diárias.
export async function rankingDoMes(mes: string): Promise<LinhaRanking[]> {
  const avals = await prisma.avaliacao.findMany({
    where: { escala: { data: { startsWith: mes } } },
    include: { diarista: { select: { id: true, nome: true } } },
  });

  const map = new Map<string, { nome: string; soma: number; qtd: number }>();
  for (const a of avals) {
    const m = mediaDaAvaliacao(a as unknown as Record<string, number>);
    const cur = map.get(a.diaristaId) ?? { nome: a.diarista.nome, soma: 0, qtd: 0 };
    cur.soma += m;
    cur.qtd += 1;
    map.set(a.diaristaId, cur);
  }

  return [...map.entries()]
    .map(([id, v]) => ({ id, nome: v.nome, media: v.soma / v.qtd, diarias: v.qtd }))
    .filter((r) => r.diarias >= MIN_DIARIAS_TOP)
    .sort((a, b) => b.media - a.media);
}
