// Aspectos que o DIARISTA avalia na LOJA (notas de 0 a 10).
// A "key" precisa bater com as colunas do model AvaliacaoLoja no schema.prisma.
// Resultado é restrito à área de gestão (RH/devs).

export const ASPECTOS_LOJA = [
  { key: "ambiente", label: "Ambiente de trabalho" },
  { key: "tratamento", label: "Respeito / tratamento" },
  { key: "pagamentoEmDia", label: "Pagamento em dia" },
  { key: "organizacao", label: "Organização" },
  { key: "seguranca", label: "Segurança" },
] as const;

export type AspectoLojaKey = (typeof ASPECTOS_LOJA)[number]["key"];
