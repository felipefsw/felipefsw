export const FUNCOES = [
  "Atendente",
  "Pizzaiolo",
  "Auxiliar de cozinha",
  "Motoqueiro",
] as const;

export type Funcao = (typeof FUNCOES)[number];
