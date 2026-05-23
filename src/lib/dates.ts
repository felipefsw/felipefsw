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

/** Hora atual no formato "HH:MM" (horário local do servidor). */
export function agoraHHMM(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** Valida se um texto está no formato "HH:MM". */
export function isHHMM(s: string): boolean {
  return /^\d{2}:\d{2}$/.test(s);
}

/**
 * Diz se o turno de uma escala já terminou, comparando com a data/hora de hoje.
 * Se não houver horário de fim, considera terminado quando a data já passou.
 */
export function turnoFinalizado(data: string, horaFim: string | null): boolean {
  const hoje = hojeISO();
  if (data < hoje) return true;
  if (data > hoje) return false;
  // mesmo dia
  if (!horaFim) return false;
  return agoraHHMM() >= horaFim;
}
