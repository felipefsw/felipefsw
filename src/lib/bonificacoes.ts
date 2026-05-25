import { prisma } from "./prisma";

// Regra de bônus: a cada marco de diárias realizadas, mantendo a média acima
// do mínimo, o diarista ganha R$ 100,00. Marcos em 5, 10, 20 e 50 diárias.
export const VALOR_BONUS = 10000; // R$ 100,00 em centavos (vale para todo marco)
export const MEDIA_MINIMA = 4.5; // média (1 a 5 estrelas) mínima para ganhar o marco
export const MARCOS_DIARIAS = [5, 10, 20, 50] as const;
export const MIN_DIARIAS_TOP = 3; // mínimo de diárias avaliadas no mês p/ entrar no ranking

// Tipo guardado na bonificação para cada marco (ex.: "MARCO_5").
export function tipoMarco(n: number): string {
  return `MARCO_${n}`;
}

// A nota de cada diária é a quantidade de estrelas (1 a 5).
export function mediaDaAvaliacao(a: { estrelas: number }): number {
  return a.estrelas;
}

// Média geral das avaliações (0 quando não há avaliações).
export function mediaGeral(avs: { estrelas: number }[]): number {
  if (avs.length === 0) return 0;
  return avs.reduce((s, a) => s + a.estrelas, 0) / avs.length;
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
