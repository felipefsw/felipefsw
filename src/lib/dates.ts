// Utilitários de data trabalhando com texto "AAAA-MM-DD" (sem fuso horário).

/** Data de hoje no formato "AAAA-MM-DD" (horário local do servidor). */
export function hojeISO(): string {
  const d = new Date();
  return toISO(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

function toISO(ano: number, mes: number, dia: number): string {
  return `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

/** Soma (ou subtrai) dias a uma data "AAAA-MM-DD". */
export function addDias(iso: string, dias: number): string {
  const [a, m, d] = iso.split("-").map(Number);
  const dt = new Date(a, m - 1, d);
  dt.setDate(dt.getDate() + dias);
  return toISO(dt.getFullYear(), dt.getMonth() + 1, dt.getDate());
}

/** Retorna a segunda-feira da semana que contém a data informada. */
export function inicioDaSemana(iso: string): string {
  const [a, m, d] = iso.split("-").map(Number);
  const dt = new Date(a, m - 1, d);
  const dow = dt.getDay(); // 0=domingo ... 6=sábado
  const diff = dow === 0 ? -6 : 1 - dow; // volta até segunda
  return addDias(iso, diff);
}

/** Lista de 7 datas a partir de uma data inicial. */
export function semana(inicioISO: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDias(inicioISO, i));
}

/** Valida se um texto está no formato "AAAA-MM-DD". */
export function isISODate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}
