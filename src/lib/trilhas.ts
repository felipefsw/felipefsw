// Conteúdo das trilhas de aprendizado (guia passo a passo por tipo de usuário).
export type PassoTrilha = {
  emoji?: string;
  titulo: string;
  descricao: string;
  href?: string;
  hrefLabel?: string;
};

export const TRILHA_RH: PassoTrilha[] = [
  {
    emoji: "🏠",
    titulo: "Painel do dia",
    descricao:
      "Na tela inicial você vê o resumo do dia: diaristas escalados, presenças pendentes e o total a pagar.",
    href: "/",
    hrefLabel: "Ver painel",
  },
  {
    emoji: "🧑‍🍳",
    titulo: "Cadastre os diaristas",
    descricao:
      "Cadastre quem vai trabalhar ou use 'Convidar diarista' para enviar o link pelo WhatsApp — a pessoa se cadastra sozinha (nome, sobrenome, CPF e nascimento).",
    href: "/diaristas",
    hrefLabel: "Ir para Diaristas",
  },
  {
    emoji: "🏪",
    titulo: "Confira as lojas",
    descricao: "Veja as lojas da rede, as vagas abertas de cada uma e quem são os gestores.",
    href: "/lojas",
    hrefLabel: "Ir para Lojas",
  },
  {
    emoji: "📋",
    titulo: "Crie as requisições",
    descricao:
      "Abra as solicitações de diaristas (dia, horário, função e valor). O 'Click mágico' preenche as vagas com os melhores automaticamente.",
    href: "/requisicoes",
    hrefLabel: "Ir para Requisições",
  },
  {
    emoji: "🗓️",
    titulo: "Monte a escala",
    descricao:
      "Agende manualmente ou pelas vagas abertas. O sistema bloqueia furos: 1 diária por pessoa por dia.",
    href: "/escala",
    hrefLabel: "Ir para Escala",
  },
  {
    emoji: "💰",
    titulo: "Pagamentos",
    descricao: "Acompanhe o que está a pagar por diarista, copie o Pix e marque como pago.",
    href: "/pagamentos",
    hrefLabel: "Ir para Pagamentos",
  },
  {
    emoji: "⭐",
    titulo: "Avaliações e ranking",
    descricao:
      "Avalie cada diária com estrelas e acompanhe o ranking dos melhores diaristas da rede.",
    href: "/ranking",
    hrefLabel: "Ver ranking",
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
    href: "/lojas",
    hrefLabel: "Ir para Lojas",
  },
  {
    emoji: "💵",
    titulo: "Valores por função",
    descricao: "Defina o valor padrão da diária para cada função (Atendente, Pizzaiolo, Aux.).",
    href: "/valores-funcao",
    hrefLabel: "Definir valores",
  },
  {
    emoji: "🧑‍🍳",
    titulo: "Diaristas",
    descricao: "Cadastre diaristas ou envie o link de auto-cadastro pelo WhatsApp.",
    href: "/diaristas",
    hrefLabel: "Ir para Diaristas",
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
    href: "/",
    hrefLabel: "Ver painel",
  },
];

export const TRILHA_LOJA: PassoTrilha[] = [
  {
    emoji: "📲",
    titulo: "Convide diaristas",
    descricao:
      "Use 'Convidar diarista' para mandar o link de cadastro pelo WhatsApp de quem você quer chamar.",
  },
  {
    emoji: "➕",
    titulo: "Solicite diaristas",
    descricao:
      "Toque em 'Solicitar diaristas' para abrir uma vaga: escolha o dia, o horário, a função e o valor.",
  },
  {
    emoji: "👍",
    titulo: "Aprove os candidatos",
    descricao:
      "Quando alguém se candidatar, aprove com um toque (Sim/Não). Você também pode convocar quem mais trabalha aí.",
  },
  {
    emoji: "✅",
    titulo: "Resumo de hoje",
    descricao:
      "Veja quem trabalha hoje, copie a lista pronta pro grupo e acompanhe o check-in de cada um.",
  },
  {
    emoji: "💸",
    titulo: "Pague e avalie",
    descricao:
      "Copie o Pix, marque como pago e avalie a diária. A avaliação é obrigatória para abrir novas vagas.",
  },
];

export const TRILHA_GESTOR: PassoTrilha[] = [
  {
    emoji: "🏬",
    titulo: "Suas lojas",
    descricao: "Você vê as vagas abertas de todas as lojas que administra, num lugar só.",
  },
  {
    emoji: "✅",
    titulo: "Resumo de hoje",
    descricao:
      "As diárias de hoje de todas as suas lojas, com função e valor. Copie a lista pronta pro grupo dos diaristas.",
  },
  {
    emoji: "➕",
    titulo: "Solicite diaristas",
    descricao: "Abra vagas para qualquer loja sua (dia, horário, função e valor).",
  },
  {
    emoji: "👍",
    titulo: "Aprove e convoque",
    descricao: "Aprove candidatos com um toque ou convoque os top diaristas de cada loja.",
  },
  {
    emoji: "💸",
    titulo: "Pague e avalie",
    descricao:
      "Copie o Pix, marque como pago e avalie a diária (obrigatório para liberar novas vagas).",
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
    descricao: "Tem um chat com o RH para tirar dúvidas, avisar imprevistos ou receber recados.",
  },
];
