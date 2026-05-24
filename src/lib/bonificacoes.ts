import { prisma } from "./prisma";

export const VALOR_BONUS = 10000; // R$ 100,00 em centavos
export const MEDIA_MINIMA_CASHBACK = 4.5; // de 1 a 5 estrelas
export const DIARIAS_CASHBACK = 5;
// Segundo bônus: 20 diárias bem avaliadas (média >= 4,5) → mais R$ 100,00.
export const DIARIAS_CASHBACK_20 = 20;
export const MEDIA_MINIMA_CASHBACK_20 = 4.5;
// Bônus por marco de diárias realizadas (independe da nota).
export const VALOR_BONUS_30 = 20000; // R$ 200,00
export const DIARIAS_MILESTONE_30 = 30;
export const VALOR_BONUS_50 = 30000; // R$ 300,00
export const DIARIAS_MILESTONE_50 = 50;
export const MIN_DIARIAS_TOP = 3; // mínimo de diárias avaliadas no mês para entrar no ranking

// A nota de cada diária é a quantidade de estrelas (1 a 5).
export function mediaDaAvaliacao(a: { estrelas: number }): number {
  return a.estrelas;
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
    const m = mediaDaAvaliacao(a);
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
