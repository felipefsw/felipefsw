/*
  Dados de EXEMPLO do Ranking de lojas (prévia). Fictícios.
  Ranking por PESO de cada indicador, com filtro por gestor (lojas do gestor X, Y).
*/

export type IndicadorPeso = { chave: string; nome: string; peso: number };

// Pesos configuráveis (soma = 1). São exibidos e explicam a nota.
export const RANKING_INDICADORES: IndicadorPeso[] = [
  { chave: "vendas", nome: "Vendas", peso: 0.25 },
  { chave: "margem", nome: "Margem", peso: 0.2 },
  { chave: "operacao", nome: "Operação", peso: 0.15 },
  { chave: "cliente", nome: "Cliente", peso: 0.15 },
  { chave: "qualidade", nome: "Qualidade", peso: 0.15 },
  { chave: "pessoas", nome: "Pessoas", peso: 0.1 },
];

export type Gestor = { id: string; nome: string };
export const GESTORES: Gestor[] = [
  { id: "g1", nome: "Ana Ribeiro" },
  { id: "g2", nome: "Bruno Teixeira" },
];

export type LojaRanking = {
  id: string;
  nome: string;
  gestorId: string;
  scores: Record<string, number>;
};

export const LOJAS_RANKING: LojaRanking[] = [
  { id: "l1", nome: "Pizza Pizza — Aldeota", gestorId: "g1", scores: { vendas: 84, margem: 72, operacao: 81, cliente: 76, qualidade: 78, pessoas: 80 } },
  { id: "l2", nome: "We Love Pizza — Cocó", gestorId: "g1", scores: { vendas: 70, margem: 64, operacao: 68, cliente: 59, qualidade: 66, pessoas: 72 } },
  { id: "l5", nome: "Pizza Pizza — Messejana", gestorId: "g1", scores: { vendas: 75, margem: 70, operacao: 73, cliente: 68, qualidade: 71, pessoas: 74 } },
  { id: "l3", nome: "Rei da Pizza — Maracanaú", gestorId: "g2", scores: { vendas: 58, margem: 52, operacao: 60, cliente: 48, qualidade: 55, pessoas: 61 } },
  { id: "l4", nome: "Royal Pizza — Meireles", gestorId: "g2", scores: { vendas: 90, margem: 85, operacao: 88, cliente: 86, qualidade: 89, pessoas: 84 } },
];

// Nota ponderada = soma(score_i * peso_i), arredondada.
export function notaPonderada(loja: LojaRanking, pesos = RANKING_INDICADORES): number {
  const total = pesos.reduce((acc, ind) => acc + (loja.scores[ind.chave] ?? 0) * ind.peso, 0);
  return Math.round(total);
}

export function nomeGestor(id: string): string {
  return GESTORES.find((g) => g.id === id)?.nome ?? "—";
}
