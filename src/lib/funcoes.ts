// Motoqueiro desativado por enquanto: consideramos só o diarista de loja.
export const FUNCOES = [
  "Atendente",
  "Pizzaiolo",
  "Aux. pizzaiolo",
] as const;

export type Funcao = (typeof FUNCOES)[number];
