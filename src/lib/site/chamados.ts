/*
  Dados de EXEMPLO do módulo TI — Chamados (prévia). Fictícios.
  Ideia: a loja descreve o problema, o ASSISTENTE (robô) tenta resolver pela
  base de conhecimento; só o que ele não resolve é ESCALADO para um técnico.
*/
import type { Faixa } from "@/lib/site/portal";

export const CHAMADOS_KPIS = {
  abertosHoje: 7,
  resolvidosAssistente: 5, // resolvidos sem técnico
  escalados: 2,
  deflection: "71%", // % resolvido pelo robô
  tmr: "1h20", // tempo médio de resolução dos escalados
  slaEmDia: "94%",
};

// Base de conhecimento do assistente (respostas prontas por palavra-chave).
export type ArtigoKB = { chave: string; palavras: string[]; titulo: string; passos: string[] };

export const KB: ArtigoKB[] = [
  {
    chave: "impressora",
    palavras: ["impressora", "imprimir", "cupom", "não imprime", "nao imprime"],
    titulo: "Impressora não imprime",
    passos: [
      "Confira se a impressora está ligada e com papel.",
      "Desligue e ligue a impressora pelo botão (aguarde 10s).",
      "No PDV: Configurações → Impressora → Testar impressão.",
      "Verifique se o cabo USB/rede está firme.",
    ],
  },
  {
    chave: "ifood",
    palavras: ["ifood", "pedido não chega", "pedido nao chega", "integração", "integracao"],
    titulo: "Pedidos do iFood não chegam",
    passos: [
      "Abra Operação iFood → aba Agora e confira se a loja está Aberta.",
      "Toque em “Atualizar tudo”.",
      "Veja se a Integração está “Saudável”. Se estiver em falha, aguarde 2 min e atualize.",
    ],
  },
  {
    chave: "internet",
    palavras: ["internet", "wifi", "wi-fi", "lenta", "sem conexão", "sem conexao", "caiu"],
    titulo: "Internet lenta ou fora do ar",
    passos: [
      "Desligue o roteador da tomada por 30 segundos e ligue de novo.",
      "Teste a internet em outro aparelho (celular no Wi-Fi).",
      "Se só o PDV está sem rede, confira o cabo de rede do equipamento.",
    ],
  },
  {
    chave: "pdv",
    palavras: ["pdv", "travou", "travando", "lento", "caixa não abre", "caixa nao abre", "saipos"],
    titulo: "PDV / Saipos travando",
    passos: [
      "Aguarde 1 minuto — pode ser sincronização.",
      "Feche e reabra o aplicativo do PDV.",
      "Se não abrir, reinicie o computador e faça login novamente no Saipos.",
    ],
  },
  {
    chave: "maquininha",
    palavras: ["maquininha", "cartão", "cartao", "pagamento", "pos", "não passa", "nao passa"],
    titulo: "Maquininha de cartão não passa",
    passos: [
      "Confira se a maquininha está conectada ao Wi-Fi/rede.",
      "Reinicie a maquininha.",
      "Teste outra bandeira/cartão para isolar o problema.",
    ],
  },
];

export const PROBLEMAS_SUGERIDOS = KB.map((a) => a.titulo);

export function buscarKB(texto: string): ArtigoKB | null {
  const t = texto.toLowerCase();
  return KB.find((a) => a.palavras.some((p) => t.includes(p)) || t.includes(a.titulo.toLowerCase())) ?? null;
}

export type Chamado = {
  id: string;
  loja: string;
  assunto: string;
  status: "Resolvido pelo assistente" | "Escalado à TI" | "Em atendimento" | "Resolvido pela TI";
  faixa: Faixa;
  quando: string;
};

export const CHAMADOS_RECENTES: Chamado[] = [
  { id: "#4821", loja: "Pizza Pizza — Aldeota", assunto: "Impressora não imprime", status: "Resolvido pelo assistente", faixa: "saudavel", quando: "há 12 min" },
  { id: "#4820", loja: "We Love Pizza — Cocó", assunto: "Pedidos iFood não chegam", status: "Escalado à TI", faixa: "atencao", quando: "há 25 min" },
  { id: "#4819", loja: "Rei da Pizza — Maracanaú", assunto: "PDV travando no fechamento", status: "Em atendimento", faixa: "atencao", quando: "há 40 min" },
  { id: "#4818", loja: "Royal Pizza — Meireles", assunto: "Wi-Fi lento no salão", status: "Resolvido pelo assistente", faixa: "saudavel", quando: "há 1 h" },
  { id: "#4817", loja: "Pizza Pizza — Messejana", assunto: "Maquininha fora do ar", status: "Resolvido pela TI", faixa: "saudavel", quando: "há 2 h" },
];
