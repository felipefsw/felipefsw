/*
  Dados de EXEMPLO do Dashboard de Qualidade (prévia). Fictícios.
  Reúne desempenho e conformidade num só lugar: iFood, faturamento, ticket,
  vendas do PDV, auditoria de qualidade, segurança alimentar, padrão de loja e
  planos de ação.
*/
import type { Faixa } from "@/lib/site/portal";

export const QUALIDADE_KPIS = {
  faturamentoMes: "R$ 184.320",
  faturamentoTend: +6,
  vendasPdv: "R$ 121.900",
  vendasPdvTend: +3,
  ticketMedio: "R$ 48,70",
  ticketTend: -2,
  notaIfood: "4,3 / 5",
  notaIfoodTend: +1,
};

export type Indicador = { nome: string; nota: number; meta: number; faixa: Faixa; detalhe: string };

export const QUALIDADE_INDICADORES: Indicador[] = [
  { nome: "Auditoria de qualidade", nota: 78, meta: 90, faixa: "atencao", detalhe: "Última auditoria há 12 dias" },
  { nome: "Segurança alimentar", nota: 84, meta: 95, faixa: "atencao", detalhe: "2 não conformidades abertas" },
  { nome: "Padrão de loja", nota: 91, meta: 90, faixa: "saudavel", detalhe: "Fachada, uniforme e ambiente ok" },
  { nome: "Reputação (iFood + Google)", nota: 86, meta: 90, faixa: "saudavel", detalhe: "218 avaliações no período" },
];

export type NaoConformidade = { item: string; severidade: Faixa; prazo: string };
export const QUALIDADE_NCS: NaoConformidade[] = [
  { item: "Rotulagem de validade incompleta", severidade: "critico", prazo: "hoje" },
  { item: "Temperatura de câmara fora da faixa", severidade: "critico", prazo: "hoje" },
  { item: "Registro de higienização atrasado", severidade: "atencao", prazo: "3 dias" },
];

export const QUALIDADE_PLANOS = { criticos: 2, atencao: 4, noPrazo: 5, vencidos: 3 };
