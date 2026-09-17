// Leitura de células: número em formato brasileiro e data/hora dos relatórios.
//
// Tudo que vem de planilha chega como texto, número do Excel ou Date. Estas
// funções normalizam isso SEM chutar: quando não dá para ler, devolvem null e
// quem chamou registra a pendência (princípio da seção 1 do book).

import { FUSO_LOJA_HORAS } from "../opsDate";

export type Celula = string | number | boolean | Date | null | undefined;

const MS_POR_DIA = 86_400_000;
const MS_POR_HORA = 3_600_000;
/** Dias entre a epoch do Excel (30/12/1899) e a do Unix (01/01/1970). */
const EPOCH_EXCEL = 25_569;

/** Texto limpo da célula, ou "" quando vazia. */
export function texto(c: Celula): string {
  if (c === null || c === undefined) return "";
  if (c instanceof Date) return c.toISOString();
  return String(c).trim();
}

/**
 * Número no padrão brasileiro: "1.234,56" → 1234.56. Também aceita "1234.56",
 * "R$ 1.234,56", "12,1%" e número puro. Devolve null quando não é número.
 */
export function numero(c: Celula): number | null {
  if (typeof c === "number") return Number.isFinite(c) ? c : null;
  const t = texto(c);
  if (t === "") return null;

  // Tira moeda, percentual e espaços (inclusive o espaço fino do Excel).
  let s = t.replace(/[R$\s %]/g, "");
  const negativo = /^\(.*\)$/.test(s); // (1.234,56) = negativo
  if (negativo) s = s.slice(1, -1);
  if (s === "" || s === "-") return null;

  const temVirgula = s.includes(",");
  const temPonto = s.includes(".");
  if (temVirgula && temPonto) {
    // O separador decimal é o que aparece por último.
    s = s.lastIndexOf(",") > s.lastIndexOf(".")
      ? s.replace(/\./g, "").replace(",", ".")
      : s.replace(/,/g, "");
  } else if (temVirgula) {
    s = s.replace(",", ".");
  }
  // Um ponto sozinho pode ser milhar ("1.234") ou decimal ("1.5"):
  // é milhar quando sobram exatamente 3 dígitos depois dele.
  else if (temPonto && /^-?\d{1,3}(\.\d{3})+$/.test(s)) {
    s = s.replace(/\./g, "");
  }

  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return negativo ? -n : n;
}

/** Inteiro da célula, ou null. */
export function inteiro(c: Celula): number | null {
  const n = numero(c);
  return n === null ? null : Math.round(n);
}

/** "S"/"Sim"/"true"/"1" → true. Qualquer outra coisa → false. */
export function simOuNao(c: Celula): boolean {
  const t = texto(c).toLowerCase();
  return t === "s" || t === "sim" || t === "true" || t === "1" || t === "x";
}

/**
 * Data e hora do relatório, devolvida como o INSTANTE de verdade.
 *
 * Os relatórios trazem hora de parede no fuso da loja ("14/09/2026 01:30").
 * Aqui isso vira um instante real descontando o fuso, para o `sold_at` e o
 * `ops_date` saírem certos em qualquer servidor.
 */
export function instante(c: Celula, fusoHoras: number = FUSO_LOJA_HORAS): Date | null {
  const parede = horaDeParede(c);
  if (parede === null) return null;
  return new Date(parede - fusoHoras * MS_POR_HORA);
}

/**
 * A hora de parede da célula, em milissegundos "como se fosse UTC".
 * Serve para comparar e formatar sem que o fuso do servidor interfira.
 */
export function horaDeParede(c: Celula): number | null {
  if (c === null || c === undefined || c === "") return null;

  // Número = data serial do Excel (dias desde 30/12/1899).
  if (typeof c === "number") {
    if (!Number.isFinite(c) || c <= 0) return null;
    return Math.round((c - EPOCH_EXCEL) * MS_POR_DIA);
  }

  // Date já lido pela biblioteca: a hora de parede está nos campos locais.
  if (c instanceof Date) {
    if (Number.isNaN(c.getTime())) return null;
    return Date.UTC(
      c.getFullYear(), c.getMonth(), c.getDate(),
      c.getHours(), c.getMinutes(), c.getSeconds(),
    );
  }

  const t = texto(c);

  // dd/mm/aaaa [HH:MM[:SS]]
  const br = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})(?:[ ,T]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/.exec(t);
  if (br) {
    const [, d, m, aRaw, h = "0", min = "0", s = "0"] = br;
    const ano = Number(aRaw) < 100 ? 2000 + Number(aRaw) : Number(aRaw);
    return montar(ano, Number(m), Number(d), Number(h), Number(min), Number(s));
  }

  // aaaa-mm-dd [HH:MM[:SS]]
  const iso = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?/.exec(t);
  if (iso) {
    const [, a, m, d, h = "0", min = "0", s = "0"] = iso;
    return montar(Number(a), Number(m), Number(d), Number(h), Number(min), Number(s));
  }

  return null;
}

function montar(ano: number, mes: number, dia: number, h: number, min: number, s: number): number | null {
  if (mes < 1 || mes > 12 || dia < 1 || dia > 31 || h > 23 || min > 59 || s > 59) return null;
  const ms = Date.UTC(ano, mes - 1, dia, h, min, s);
  const d = new Date(ms);
  // Rejeita data que "virou" (ex.: 31/02).
  if (d.getUTCMonth() !== mes - 1 || d.getUTCDate() !== dia) return null;
  return ms;
}

/** Só a data da célula, como texto "AAAA-MM-DD" (sem converter fuso). */
export function dataSimples(c: Celula): string | null {
  const parede = horaDeParede(c);
  return parede === null ? null : new Date(parede).toISOString().slice(0, 10);
}
