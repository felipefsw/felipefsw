/** Mapeamento rederwp.diaristas / diarias → modelos Prisma do felipefsw. */

export type RederwpDiarista = {
  id: number;
  user?: string | null;
  nome?: string | null;
  cpf?: string | null;
  telefone?: string | null;
  pix?: string | null;
  type?: string | null;
  funcao?: string | null;
  status?: number | boolean | null;
  loja_id?: number | null;
  password?: string | null;
};

export type RederwpDiaria = {
  id: number;
  diarista_id?: number | null;
  loja_id?: number | null;
  loja?: string | null;
  funcao?: string | null;
  data: string;
  hora_inicio?: string | null;
  hora_fim?: string | null;
  remuneracao?: number | string | null;
  observacoes?: string | null;
  status?: string | null;
  checkin_at?: string | null;
  checkout_at?: string | null;
  nota_diarista?: number | null;
  comentario_avaliacao?: string | null;
};

export function nomeDiarista(row: RederwpDiarista): string {
  return (row.nome || row.user || `Diarista #${row.id}`).trim();
}

export function funcaoDiarista(row: RederwpDiarista): string | null {
  return row.funcao || row.type || null;
}

/** Remuneração MySQL (reais) → centavos. */
export function remuneracaoCentavos(v: number | string | null | undefined): number {
  if (v == null || v === "") return 0;
  const n = typeof v === "number" ? v : Number(String(v).replace(",", "."));
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

export function dataIso(d: string): string {
  // MySQL dateStrings → "YYYY-MM-DD" ou datetime
  return String(d).slice(0, 10);
}

export function horaHm(t: string | null | undefined): string | null {
  if (!t) return null;
  const s = String(t);
  return s.length >= 5 ? s.slice(0, 5) : s;
}

export function presencaDeStatus(status: string | null | undefined, checkin?: string | null): string {
  const s = (status || "").toLowerCase();
  if (s === "cancelada" || s === "rejeitada") return "FALTOU";
  if (s === "concluida" || s === "em_andamento" || checkin) return "PRESENTE";
  if (s === "aceita" || s === "disponivel") return "PENDENTE";
  return "PENDENTE";
}

export const MAPA_CAMPOS = {
  diaristas: {
    rederwp: ["id", "user/nome", "cpf", "telefone", "pix", "type/funcao", "status", "loja_id"],
    felipefsw: ["rederwpId", "nome", "cpf", "telefone", "chavePix", "funcao", "ativo", "BancoLoja"],
  },
  diarias: {
    rederwp: ["id", "diarista_id", "loja_id", "data", "hora_inicio", "hora_fim", "remuneracao", "status", "checkin_at", "checkout_at"],
    felipefsw: ["Escala + EscalaRederwpMap", "diaristaId", "lojaId", "data", "horaInicio", "horaFim", "valor(centavos)", "presenca", "checkinEm", "checkoutEm"],
  },
} as const;
