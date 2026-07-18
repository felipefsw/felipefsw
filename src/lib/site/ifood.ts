/*
  Dados de EXEMPLO da tela "Operação iFood Segura" (prévia). Fictícios.
  A auditoria pediu para separar a ROTINA (Agora, Pedidos, Cardápio, Avaliações)
  da ADMINISTRAÇÃO TÉCNICA (merchant ID, OAuth, homologação/testes), e deixar o
  AMBIENTE (produção x homologação) sempre explícito.
*/
import type { Faixa } from "@/lib/site/portal";

export const IFOOD_STATUS = {
  ambiente: "Produção" as "Produção" | "Homologação",
  estado: "Aberta" as "Aberta" | "Pausada" | "Fechada",
  integracao: "ok" as "ok" | "falha",
  pedidosPendentes: 3,
  horarioHoje: "18:00 – 23:30",
  avaliacaoCritica: "1 avaliação 1★ há 40 min sem resposta",
};

export type PedidoIfood = {
  id: string;
  horario: string;
  itens: number;
  valor: string;
  status: "Novo" | "Em preparo" | "Despachado" | "Concluído" | "Cancelado";
  statusFaixa: Faixa;
  tempo: string;
  obs?: string;
};

export const IFOOD_PEDIDOS: PedidoIfood[] = [
  { id: "#8842", horario: "20:41", itens: 3, valor: "R$ 92,80", status: "Novo", statusFaixa: "atencao", tempo: "aguardando aceite há 2 min", obs: "Confirmar (ACK) pendente" },
  { id: "#8841", horario: "20:33", itens: 2, valor: "R$ 61,50", status: "Em preparo", statusFaixa: "saudavel", tempo: "no prazo (P90 28 min)" },
  { id: "#8840", horario: "20:18", itens: 5, valor: "R$ 148,00", status: "Despachado", statusFaixa: "saudavel", tempo: "entregador a caminho" },
  { id: "#8839", horario: "19:57", itens: 1, valor: "R$ 39,90", status: "Cancelado", statusFaixa: "critico", tempo: "cancelado pelo cliente", obs: "Motivo: demora no aceite" },
  { id: "#8838", horario: "19:44", itens: 4, valor: "R$ 112,30", status: "Concluído", statusFaixa: "saudavel", tempo: "entregue em 31 min" },
];

export type ItemCardapio = { nome: string; preco: string; disponivel: boolean; alerta?: string };
export type CategoriaCardapio = { nome: string; itens: ItemCardapio[] };

export const IFOOD_CARDAPIO: CategoriaCardapio[] = [
  {
    nome: "Pizzas salgadas",
    itens: [
      { nome: "Calabresa", preco: "R$ 54,90", disponivel: true },
      { nome: "Portuguesa", preco: "R$ 58,90", disponivel: true },
      { nome: "Quatro queijos", preco: "R$ 62,90", disponivel: false, alerta: "Indisponível — falta mussarela" },
    ],
  },
  {
    nome: "Bebidas",
    itens: [
      { nome: "Refrigerante 2L", preco: "R$ 14,90", disponivel: true },
      { nome: "Suco lata", preco: "R$ 7,90", disponivel: true, alerta: "Preço diverge do salão (R$ 6,90)" },
    ],
  },
];

export type TemaAvaliacao = { tema: string; mencoes: number; faixa: Faixa };
export const IFOOD_AVALIACOES = {
  nota: 4.3,
  volume: 218,
  semResposta: 3,
  slaResposta: "6 h (meta 4 h)",
  temas: [
    { tema: "Tempo de entrega", mencoes: 12, faixa: "critico" as Faixa },
    { tema: "Temperatura da pizza", mencoes: 7, faixa: "atencao" as Faixa },
    { tema: "Atendimento", mencoes: 5, faixa: "saudavel" as Faixa },
  ] as TemaAvaliacao[],
};

export const IFOOD_ADMIN = {
  merchantId: "a1b2c3d4-••••-••••-••••-9f8e7d6c5b4a",
  oauth: { estado: "Conectado", detalhe: "token renova em 12 dias" },
  homologacao: "Última homologação aprovada há 3 meses",
  ultimoTeste: "Cenário Sáb/Dom testado há 8 dias",
};
