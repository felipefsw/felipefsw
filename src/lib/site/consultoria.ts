/*
  Conteúdo da área "Para Franqueados" — a oferta consultiva da Rede RWP.
  Baseado no portfólio priorizado da auditoria: o valor não é "acesso a
  ferramentas", e sim um método contínuo — sinal → causa → ação → evidência →
  resultado medido.
*/

export type Pacote = {
  slug: string;
  nome: string;
  promessa: string;
  inclui: string[];
  ritmo: string;
};

export const PACOTES: Pacote[] = [
  {
    slug: "loja-sob-controle",
    nome: "Loja sob Controle",
    promessa: "Reduzir o tempo entre o desvio, o diagnóstico e a ação.",
    inclui: ["Cockpit Diário", "Termômetro Explicável", "Planos e CAPA", "Carteira do Consultor"],
    ritmo: "Reunião semanal por exceção e revisão mensal.",
  },
  {
    slug: "margem-protegida",
    nome: "Margem Protegida",
    promessa: "Enxergar a margem e as causas de custo que você controla.",
    inclui: ["DRE e Caixa assistidos", "Food cost e ficha técnica", "Desperdício", "Pedido inteligente"],
    ritmo: "Fechamento semanal de custos e DRE mensal.",
  },
  {
    slug: "operacao-confiavel",
    nome: "Operação Confiável",
    promessa: "Aumentar a aderência ao padrão e a velocidade de correção.",
    inclui: ["Segurança dos Alimentos", "Operação iFood segura", "Saúde tecnológica", "Checklists"],
    ritmo: "Rotina diária e auditoria mensal.",
  },
  {
    slug: "equipe-produtiva",
    nome: "Equipe Produtiva",
    promessa: "Melhorar cobertura e produtividade com critérios transparentes.",
    inclui: ["Pessoas e escala", "Ponto", "Pool de diaristas", "Academia por cargo"],
    ritmo: "Planejamento semanal e revisão mensal.",
  },
  {
    slug: "cliente-que-volta",
    nome: "Cliente que Volta",
    promessa: "Entender a voz do cliente e testar retenção com método.",
    inclui: ["Reputação 360 (Google + iFood)", "Marketing local assistido", "CRM progressivo"],
    ritmo: "Caixa diária de avaliações e ciclo mensal de campanhas.",
  },
  {
    slug: "governanca-da-franquia",
    nome: "Governança da Franquia",
    promessa: "Aumentar a confiança nos dados e reduzir risco operacional.",
    inclui: ["Documentos e licenças", "Permissões por papel", "Auditoria", "Visão executiva"],
    ritmo: "Comitê mensal de dados e revisão trimestral de acessos.",
  },
];

export type Ferramenta = {
  nome: string;
  entrega: string;
};

// Vitrine curta das principais ferramentas nativas (não é a lista completa).
export const FERRAMENTAS_DESTAQUE: Ferramenta[] = [
  { nome: "Cockpit Diário da Loja", entrega: "O que exige atenção hoje: canal, equipe, ruptura, tarefas, caixa e as ações prioritárias." },
  { nome: "Termômetro Explicável 2.0", entrega: "Saúde da loja por dimensão, com tendência, causa, confiança do dado e plano associado." },
  { nome: "Planos e CAPA", entrega: "Cada falha vira ação com dono, prazo, evidência antes/depois e verificação de eficácia." },
  { nome: "DRE e Caixa Assistidos", entrega: "Sai do livro-caixa: margem, orçamento × realizado, projeção de caixa e conciliação." },
  { nome: "Caderno de Segurança dos Alimentos", entrega: "POPs versionados, registros por turno, evidências, assinatura e correção acompanhada." },
  { nome: "Operação iFood Segura", entrega: "Rotina do dia separada de cadastro e homologação, com confirmação e trilha de auditoria." },
];

// O método em ciclo fechado — o diferencial que a consultoria vende.
export const CICLO: { titulo: string; texto: string }[] = [
  { titulo: "Sinal", texto: "Um indicador confiável aponta o desvio, com fonte e data da última atualização." },
  { titulo: "Causa", texto: "A ferramenta abre a composição da nota e as principais causas, sem achismo." },
  { titulo: "Ação", texto: "Vira um plano com dono, prazo e severidade — não termina em gráfico ou PDF." },
  { titulo: "Evidência", texto: "Registro do antes/depois, anexos e aprovação de quem é responsável." },
  { titulo: "Resultado", texto: "Verificação de eficácia: o problema voltou? O benefício foi medido?" },
];
