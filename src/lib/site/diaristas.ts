/*
  Dados de EXEMPLO do gerenciamento de Diaristas (prévia). Fictícios.
  Pool confiável: disponibilidade, escala do dia, taxa de preenchimento,
  no-show, avaliação e blocklist.
*/
import type { Faixa } from "@/lib/site/portal";

export const DIARISTAS_RESUMO = {
  ativos: 24,
  escaladosHoje: 5,
  taxaPreenchimento: "92%",
  noShow30d: "4%",
  blocklist: 2,
};

export type EscalaDiarista = {
  nome: string;
  funcao: string;
  horario: string;
  status: "Confirmado" | "Pendente" | "Check-in" | "No-show";
  faixa: Faixa;
};

export const DIARISTAS_ESCALA_HOJE: EscalaDiarista[] = [
  { nome: "Juliana Prado", funcao: "Atendente", horario: "18:00 – 23:00", status: "Check-in", faixa: "saudavel" },
  { nome: "Marcos Vidal", funcao: "Auxiliar de cozinha", horario: "18:00 – 23:00", status: "Confirmado", faixa: "saudavel" },
  { nome: "Sandra Lopes", funcao: "Atendente", horario: "19:00 – 00:00", status: "Pendente", faixa: "atencao" },
  { nome: "Igor Bastos", funcao: "Motoboy", horario: "19:00 – 00:00", status: "Confirmado", faixa: "saudavel" },
  { nome: "Renata Dias", funcao: "Auxiliar de limpeza", horario: "17:00 – 22:00", status: "No-show", faixa: "critico" },
];

export type DiaristaPool = {
  nome: string;
  funcao: string;
  avaliacao: number; // 0–5
  disponivel: boolean;
  docsOk: boolean;
};

export const DIARISTAS_POOL: DiaristaPool[] = [
  { nome: "Juliana Prado", funcao: "Atendente", avaliacao: 4.8, disponivel: true, docsOk: true },
  { nome: "Marcos Vidal", funcao: "Auxiliar de cozinha", avaliacao: 4.6, disponivel: true, docsOk: true },
  { nome: "Sandra Lopes", funcao: "Atendente", avaliacao: 4.1, disponivel: true, docsOk: false },
  { nome: "Igor Bastos", funcao: "Motoboy", avaliacao: 4.9, disponivel: false, docsOk: true },
  { nome: "Renata Dias", funcao: "Auxiliar de limpeza", avaliacao: 3.4, disponivel: true, docsOk: true },
];
