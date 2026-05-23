// Funções para formatar dinheiro (em centavos) e datas (texto "AAAA-MM-DD").

/** Converte centavos (ex: 12050) para texto "R$ 120,50". */
export function formatBRL(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/**
 * Converte um texto digitado pelo usuário ("120,50", "120.50", "R$ 120,50", "120")
 * para centavos (12050). Retorna 0 se não houver número válido.
 */
export function parseBRLToCents(input: string | null | undefined): number {
  if (!input) return 0;
  // Mantém apenas dígitos, vírgula e ponto.
  let s = String(input).replace(/[^\d.,]/g, "").trim();
  if (!s) return 0;
  // Se tem vírgula, ela é o separador decimal (padrão BR): remove pontos de milhar.
  if (s.includes(",")) {
    s = s.replace(/\./g, "").replace(",", ".");
  }
  const valor = Number.parseFloat(s);
  if (Number.isNaN(valor)) return 0;
  return Math.round(valor * 100);
}

const MESES = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];

const DIAS_SEMANA = [
  "domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado",
];

/** "2026-05-23" -> "23/05/2026" */
export function formatDate(iso: string): string {
  const [a, m, d] = iso.split("-");
  return `${d}/${m}/${a}`;
}

/** "2026-05-23" -> "23 mai" */
export function formatDateShort(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d} ${MESES[Number(m) - 1]}`;
}

/** "2026-05-23" -> "sábado, 23/05" */
export function formatDateWithWeekday(iso: string): string {
  const [a, m, d] = iso.split("-").map(Number);
  const dow = new Date(a, m - 1, d).getDay();
  return `${DIAS_SEMANA[dow]}, ${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}`;
}
