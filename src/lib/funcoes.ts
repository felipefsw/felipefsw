export const FUNCOES = [
  "Atendente",
  "Pizzaiolo",
  "Aux. pizzaiolo",
  "Porcionador",
  "Aux. de estoque",
  "Aux. de motorista",
] as const;

export type Funcao = (typeof FUNCOES)[number];
