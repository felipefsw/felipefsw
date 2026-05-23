// Aspectos avaliados em cada diária (notas de 0 a 10).
// A "key" precisa bater com as colunas do model Avaliacao no schema.prisma.

export const ASPECTOS = [
  { key: "pontualidade", label: "Pontualidade" },
  { key: "limpeza", label: "Limpeza" },
  { key: "educacao", label: "Educação" },
  { key: "rapidez", label: "Rapidez" },
  { key: "habilidadeTecnica", label: "Habilidade técnica" },
  { key: "respeito", label: "Respeito" },
  { key: "espiritoEquipe", label: "Espírito de equipe" },
] as const;

export type AspectoKey = (typeof ASPECTOS)[number]["key"];

export const NOTA_MIN = 0;
export const NOTA_MAX = 10;
