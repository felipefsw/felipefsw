/*
  Dados de EXEMPLO da prévia do portal (Cockpit Diário + Termômetro Explicável 2.0).
  Tudo aqui é fictício e serve apenas para demonstrar a direção de produto que a
  auditoria recomenda. Não vem de nenhuma API real.

  Convenções da auditoria aplicadas:
  - Toda métrica carrega meta, tendência, fonte e frescor (última atualização).
  - Estados de saúde usam cor + rótulo + ícone (nunca cor sozinha).
  - O último valor válido é preservado (nada de tela zerada durante consulta).
*/

export type Faixa = "saudavel" | "atencao" | "critico";

export const FAIXA_META: Record<Faixa, { rotulo: string; icone: string }> = {
  saudavel: { rotulo: "Saudável", icone: "●" },
  atencao: { rotulo: "Atenção", icone: "▲" },
  critico: { rotulo: "Crítico", icone: "■" },
};

export function faixaDaNota(n: number): Faixa {
  if (n >= 75) return "saudavel";
  if (n >= 60) return "atencao";
  return "critico";
}

export type LojaDemo = {
  id: string;
  nome: string;
  marca: string;
  cidade: string;
  nota: number;
  tendencia: number; // variação vs período anterior (pontos)
};

export const LOJAS_DEMO: LojaDemo[] = [
  { id: "l1", nome: "Pizza Pizza — Aldeota", marca: "Pizza Pizza", cidade: "Fortaleza", nota: 82, tendencia: +3 },
  { id: "l2", nome: "We Love Pizza — Cocó", marca: "We Love Pizza", cidade: "Fortaleza", nota: 68, tendencia: -4 },
  { id: "l3", nome: "Rei da Pizza — Maracanaú", marca: "Rei da Pizza", cidade: "Maracanaú", nota: 54, tendencia: -6 },
  { id: "l4", nome: "Royal Pizza — Meireles", marca: "Royal Pizza", cidade: "Fortaleza", nota: 88, tendencia: +1 },
  { id: "l5", nome: "Pizza Pizza — Messejana", marca: "Pizza Pizza", cidade: "Fortaleza", nota: 71, tendencia: +5 },
];

// ---- Termômetro Explicável 2.0: árvore de saúde da loja selecionada (demo) ----
export type Dimensao = {
  chave: string;
  nome: string;
  nota: number;
  meta: number;
  peso: number; // contribuição para a nota final (soma = 1)
  tendencia: number;
  fonte: string;
  atualizado: string; // texto de frescor
  cobertura: string;
  causa: string;
};

export const DIMENSOES_DEMO: Dimensao[] = [
  { chave: "vendas", nome: "Vendas", nota: 78, meta: 85, peso: 0.22, tendencia: +4, fonte: "Saipos", atualizado: "há 12 min", cobertura: "100% dos dias", causa: "Ticket médio abaixo da meta no jantar." },
  { chave: "margem", nome: "Margem", nota: 64, meta: 75, peso: 0.2, tendencia: -3, fonte: "Caixa + CD", atualizado: "há 1 h", cobertura: "92% das notas", causa: "CMV de queijo 6% acima do padrão." },
  { chave: "operacao", nome: "Operação", nota: 81, meta: 80, peso: 0.18, tendencia: +2, fonte: "iFood + Saipos", atualizado: "há 8 min", cobertura: "100% dos pedidos", causa: "Tempo de produção dentro do SLA." },
  { chave: "cliente", nome: "Cliente", nota: 59, meta: 80, peso: 0.15, tendencia: -5, fonte: "iFood + Google", atualizado: "há 3 h", cobertura: "218 avaliações", causa: "Reclamações de atraso na sexta." },
  { chave: "pessoas", nome: "Pessoas", nota: 72, meta: 75, peso: 0.12, tendencia: +1, fonte: "Ponto + RH", atualizado: "há 1 dia", cobertura: "quadro completo", causa: "Absenteísmo estável, 1 vaga aberta." },
  { chave: "qualidade", nome: "Qualidade", nota: 66, meta: 90, peso: 0.08, tendencia: 0, fonte: "Inspeção nutricional", atualizado: "há 6 dias", cobertura: "última auditoria", causa: "2 não conformidades de rotulagem." },
  { chave: "execucao", nome: "Execução de planos", nota: 70, meta: 85, peso: 0.05, tendencia: +6, fonte: "Planos e CAPA", atualizado: "há 2 h", cobertura: "8 planos ativos", causa: "3 ações vencidas sem evidência." },
];

export type FonteStatus = { nome: string; estado: "ok" | "atrasada" | "falha"; detalhe: string };

// Painel de confiança das fontes — resolve a tela "Consultando API... zeros".
export const FONTES_DEMO: FonteStatus[] = [
  { nome: "Saipos (vendas/produção)", estado: "ok", detalhe: "Sincronizado há 8 min" },
  { nome: "iFood (pedidos/avaliações)", estado: "atrasada", detalhe: "Último dado há 3 h — reprocessando" },
  { nome: "Caixa / CD (custos)", estado: "ok", detalhe: "Sincronizado há 1 h" },
  { nome: "Inspeção nutricional", estado: "ok", detalhe: "Última auditoria há 6 dias" },
];

// ---- Cockpit Diário: "Hoje" da loja selecionada (demo) ----
export type KpiHoje = {
  chave: string;
  rotulo: string;
  valor: string;
  meta?: string;
  tendencia?: number;
  contexto: string;
};

export const KPIS_HOJE_DEMO: KpiHoje[] = [
  { chave: "vendas", rotulo: "Vendas hoje", valor: "R$ 6.480", meta: "R$ 7.500", tendencia: +8, contexto: "86% da meta do dia" },
  { chave: "pedidos", rotulo: "Pedidos", valor: "142", meta: "160", tendencia: +5, contexto: "salão + delivery" },
  { chave: "ticket", rotulo: "Ticket médio", valor: "R$ 45,60", meta: "R$ 52,00", tendencia: -3, contexto: "abaixo da meta" },
  { chave: "producao", rotulo: "Produção P90", valor: "28 min", meta: "25 min", tendencia: -2, contexto: "acima do SLA no pico" },
];

export type Pendencia = {
  titulo: string;
  severidade: Faixa;
  dono: string;
  prazo: string;
  origem: string;
};

export const PENDENCIAS_DEMO: Pendencia[] = [
  { titulo: "iFood: 3 avaliações 1★ sem resposta", severidade: "critico", dono: "Gerente", prazo: "hoje", origem: "Cliente e Reputação" },
  { titulo: "CMV de queijo 6% acima do padrão", severidade: "critico", dono: "Franqueado", prazo: "amanhã", origem: "Margem / Food cost" },
  { titulo: "2 não conformidades de rotulagem", severidade: "atencao", dono: "Nutrição", prazo: "3 dias", origem: "Segurança dos Alimentos" },
  { titulo: "1 vaga de atendente aberta há 9 dias", severidade: "atencao", dono: "RH", prazo: "esta semana", origem: "Pessoas" },
  { titulo: "3 ações de plano vencidas sem evidência", severidade: "atencao", dono: "Gerente", prazo: "hoje", origem: "Planos e CAPA" },
];

// Vendas dos últimos 14 dias (para o sparkbars, hue único) — em reais (milhares).
export const VENDAS_14D_DEMO: number[] = [5.2, 6.1, 5.8, 7.0, 6.4, 8.1, 9.2, 5.5, 6.0, 6.7, 7.3, 6.9, 8.4, 6.48];

export type EquipeDemo = { escalados: number; presentes: number; faltas: number };
export const EQUIPE_DEMO: EquipeDemo = { escalados: 9, presentes: 8, faltas: 1 };

export type RupturaItem = { item: string; diasEstoque: number; faixa: Faixa };
export const RUPTURA_DEMO: RupturaItem[] = [
  { item: "Queijo mussarela", diasEstoque: 1, faixa: "critico" },
  { item: "Molho de tomate", diasEstoque: 2, faixa: "atencao" },
  { item: "Embalagem 35cm", diasEstoque: 3, faixa: "atencao" },
];
