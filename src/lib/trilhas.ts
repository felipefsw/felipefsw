// Conteúdo das trilhas de aprendizado (guia passo a passo por tipo de usuário).
// "alvo" é um seletor CSS do elemento real a destacar (holofote). Sem alvo
// (ou se o elemento não estiver na tela), o passo aparece centralizado.
export type PassoTrilha = {
  emoji?: string;
  titulo: string;
  descricao: string;
  alvo?: string;
};

export const TRILHA_RH: PassoTrilha[] = [
  {
    emoji: "🏠",
    titulo: "Painel do dia",
    descricao:
      "Na tela inicial você vê o resumo do dia: diaristas escalados, presenças pendentes e o total a pagar.",
    alvo: '[data-tour="nav-inicio"]',
  },
  {
    emoji: "🧑‍🍳",
    titulo: "Cadastre os diaristas",
    descricao:
      "Aqui você cadastra quem vai trabalhar ou envia o link de convite pelo WhatsApp — a pessoa se cadastra sozinha (nome, sobrenome, CPF e nascimento).",
    alvo: '[data-tour="nav-diaristas"]',
  },
  {
    emoji: "🏪",
    titulo: "Confira as lojas",
    descricao: "Veja as lojas da rede, as vagas abertas de cada uma e quem são os gestores.",
    alvo: '[data-tour="nav-lojas"]',
  },
  {
    emoji: "📋",
    titulo: "Crie as requisições",
    descricao:
      "Abra as solicitações de diaristas (dia, horário, função e valor). O 'Click mágico' preenche as vagas com os melhores automaticamente.",
    alvo: '[data-tour="nav-pedidos"]',
  },
  {
    emoji: "🗓️",
    titulo: "Monte a escala",
    descricao:
      "Agende manualmente ou pelas vagas abertas. O sistema bloqueia furos: 1 diária por pessoa por dia.",
    alvo: '[data-tour="nav-escala"]',
  },
  {
    emoji: "💰",
    titulo: "Pagamentos",
    descricao: "Acompanhe o que está a pagar por diarista, copie o Pix e marque como pago.",
    alvo: '[data-tour="nav-pagamentos"]',
  },
  {
    emoji: "⭐",
    titulo: "Avaliações e ranking",
    descricao:
      "Avalie cada diária com estrelas e acompanhe o ranking dos melhores diaristas da rede.",
  },
];

export const TRILHA_TI: PassoTrilha[] = [
  {
    emoji: "🛠️",
    titulo: "Acesso completo",
    descricao:
      "Como TI, você tem acesso a todo o painel para configurar o sistema e dar suporte ao RH e às lojas.",
  },
  {
    emoji: "🏪",
    titulo: "Lojas e gestores",
    descricao:
      "Cadastre lojas, vincule os gestores (sócios) de cada uma e mantenha os dados sempre em dia.",
    alvo: '[data-tour="nav-lojas"]',
  },
  {
    emoji: "💵",
    titulo: "Valores por função",
    descricao: "Defina o valor padrão da diária para cada função (Atendente, Pizzaiolo, Aux.).",
  },
  {
    emoji: "🧑‍🍳",
    titulo: "Diaristas",
    descricao: "Cadastre diaristas ou envie o link de auto-cadastro pelo WhatsApp.",
    alvo: '[data-tour="nav-diaristas"]',
  },
  {
    emoji: "🔔",
    titulo: "Notificações",
    descricao:
      "O app avisa diaristas e lojas por push e Telegram. As chaves ficam configuradas no Vercel.",
  },
  {
    emoji: "📊",
    titulo: "Acompanhe tudo",
    descricao:
      "Requisições, escala, pagamentos e ranking estão disponíveis para você acompanhar e dar suporte.",
    alvo: '[data-tour="nav-inicio"]',
  },
];

export const TRILHA_LOJA: PassoTrilha[] = [
  {
    emoji: "📲",
    titulo: "Convide diaristas",
    descricao:
      "Use este botão para mandar o link de cadastro pelo WhatsApp de quem você quer chamar.",
    alvo: '[data-tour="loja-convidar"]',
  },
  {
    emoji: "➕",
    titulo: "Solicite diaristas",
    descricao:
      "Toque aqui para abrir uma vaga: escolha o dia, o horário, a função e o valor da diária.",
    alvo: '[data-tour="loja-solicitar"]',
  },
  {
    emoji: "👍",
    titulo: "Aprove os candidatos",
    descricao:
      "Nas suas requisições, quando alguém se candidatar, aprove com um toque (Sim/Não) ou convoque quem mais trabalha aí.",
    alvo: '[data-tour="loja-requisicoes"]',
  },
  {
    emoji: "✅",
    titulo: "Resumo de hoje",
    descricao:
      "Veja quem trabalha hoje, copie a lista pronta pro grupo e acompanhe o check-in de cada um.",
    alvo: '[data-tour="loja-resumo"]',
  },
  {
    emoji: "💸",
    titulo: "Pague e avalie",
    descricao:
      "No resumo de hoje você copia o Pix, marca como pago e avalia a diária (obrigatório para abrir novas vagas).",
    alvo: '[data-tour="loja-resumo"]',
  },
];

export const TRILHA_GESTOR: PassoTrilha[] = [
  {
    emoji: "🏬",
    titulo: "Suas lojas",
    descricao: "Aqui você vê as vagas abertas de todas as lojas que administra, num lugar só.",
    alvo: '[data-tour="gestor-lojas"]',
  },
  {
    emoji: "✅",
    titulo: "Resumo de hoje",
    descricao:
      "As diárias de hoje de todas as suas lojas, com função e valor. Copie a lista pronta pro grupo dos diaristas.",
    alvo: '[data-tour="loja-resumo"]',
  },
  {
    emoji: "➕",
    titulo: "Solicite diaristas",
    descricao: "Abra vagas para qualquer loja sua (dia, horário, função e valor).",
    alvo: '[data-tour="loja-solicitar"]',
  },
  {
    emoji: "👍",
    titulo: "Aprove e convoque",
    descricao: "Aprove candidatos com um toque ou convoque os top diaristas de cada loja.",
    alvo: '[data-tour="loja-requisicoes"]',
  },
  {
    emoji: "💸",
    titulo: "Pague e avalie",
    descricao:
      "No resumo de hoje você copia o Pix, marca como pago e avalia (obrigatório para liberar novas vagas).",
    alvo: '[data-tour="loja-resumo"]',
  },
];

export const TRILHA_DIARISTA: PassoTrilha[] = [
  {
    emoji: "🔔",
    titulo: "Convocações",
    descricao:
      "Se uma loja te chamar, a convocação aparece no topo da sua tela. É só aceitar ou recusar.",
  },
  {
    emoji: "🔎",
    titulo: "Ache diárias",
    descricao:
      "Veja as vagas abertas e candidate-se nas que quiser, tocando em 'Quero trabalhar aqui'.",
    alvo: '[data-tour="diarista-vagas"]',
  },
  {
    emoji: "📍",
    titulo: "Faça o check-in",
    descricao:
      "No dia da diária, faça o check-in ao chegar. Você precisa estar a até 100m da loja.",
  },
  {
    emoji: "⭐",
    titulo: "Avalie a loja",
    descricao:
      "Ao terminar, avalie a loja com estrelas. É rápido e libera novas diárias para você.",
  },
  {
    emoji: "💬",
    titulo: "Fale com o RH",
    descricao: "Use o chat com o RH para tirar dúvidas, avisar imprevistos ou receber recados.",
    alvo: '[data-tour="diarista-chat"]',
  },
];
