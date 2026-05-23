export const FUNCOES = [
  "Atendente",
  "Pizzaiolo",
  "Aux. pizzaiolo",
  "Motoqueiro",
] as const;

export type Funcao = (typeof FUNCOES)[number];
