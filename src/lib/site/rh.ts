/*
  Dados de EXEMPLO de RH e DP (prévia). Fictícios.
  Cobre funcionários, férias, processos seletivos, vagas, protocolo de
  fardamento e tabela de cargos e salários.
*/
import type { Faixa } from "@/lib/site/portal";

export type Funcionario = {
  nome: string;
  cargo: string;
  admissao: string;
  status: "Ativo" | "Férias" | "Afastado" | "Experiência";
  docPendente?: string;
};

export const RH_FUNCIONARIOS: Funcionario[] = [
  { nome: "Marina Souza", cargo: "Gerente", admissao: "12/03/2022", status: "Ativo" },
  { nome: "Rafael Lima", cargo: "Pizzaiolo", admissao: "05/08/2023", status: "Ativo" },
  { nome: "Carla Nunes", cargo: "Atendente", admissao: "20/01/2024", status: "Experiência", docPendente: "ASO pendente" },
  { nome: "Diego Alves", cargo: "Motoboy", admissao: "14/06/2023", status: "Ativo", docPendente: "CNH vence em 20 dias" },
  { nome: "Paula Reis", cargo: "Atendente", admissao: "02/11/2021", status: "Férias" },
  { nome: "Tiago Melo", cargo: "Pizzaiolo", admissao: "30/09/2020", status: "Afastado", docPendente: "Atestado em análise" },
];

export type Ferias = { nome: string; periodo: string; situacao: "Em férias" | "Programada" | "Vencendo" };
export const RH_FERIAS: Ferias[] = [
  { nome: "Paula Reis", periodo: "10/07 – 09/08", situacao: "Em férias" },
  { nome: "Rafael Lima", periodo: "01/09 – 30/09", situacao: "Programada" },
  { nome: "Bianca Rocha", periodo: "vence em 31/08", situacao: "Vencendo" },
];

export type Processo = { vaga: string; etapa: string; candidatos: number; abertaDias: number };
export const RH_PROCESSOS: Processo[] = [
  { vaga: "Atendente (noite)", etapa: "Entrevistas", candidatos: 12, abertaDias: 9 },
  { vaga: "Pizzaiolo", etapa: "Triagem", candidatos: 7, abertaDias: 4 },
  { vaga: "Motoboy", etapa: "Aprovação final", candidatos: 3, abertaDias: 15 },
];

export type Vaga = { titulo: string; loja: string; publicada: string; candidaturas: number };
export const RH_VAGAS: Vaga[] = [
  { titulo: "Atendente (noite)", loja: "Pizza Pizza — Aldeota", publicada: "há 9 dias", candidaturas: 12 },
  { titulo: "Pizzaiolo", loja: "We Love Pizza — Cocó", publicada: "há 4 dias", candidaturas: 7 },
  { titulo: "Caixa", loja: "Rei da Pizza — Maracanaú", publicada: "há 2 dias", candidaturas: 4 },
];

export type Fardamento = { colaborador: string; item: string; situacao: Faixa; texto: string };
export const RH_FARDAMENTO: Fardamento[] = [
  { colaborador: "Carla Nunes", item: "Kit uniforme (2 camisas, avental)", situacao: "atencao", texto: "Solicitado — aguardando entrega" },
  { colaborador: "Diego Alves", item: "Jaqueta motoboy", situacao: "saudavel", texto: "Entregue e assinado" },
  { colaborador: "Rafael Lima", item: "Dólmã", situacao: "critico", texto: "Protocolo pendente há 20 dias" },
];

export type Cargo = { cargo: string; nivel: string; faixa: string };
export const RH_CARGOS: Cargo[] = [
  { cargo: "Atendente", nivel: "Júnior → Pleno", faixa: "R$ 1.500 – R$ 1.900" },
  { cargo: "Caixa", nivel: "Único", faixa: "R$ 1.600 – R$ 2.000" },
  { cargo: "Pizzaiolo", nivel: "Júnior → Sênior", faixa: "R$ 1.900 – R$ 2.800" },
  { cargo: "Motoboy", nivel: "Único", faixa: "R$ 1.500 + entregas" },
  { cargo: "Gerente", nivel: "Único", faixa: "R$ 3.500 – R$ 5.000" },
];
