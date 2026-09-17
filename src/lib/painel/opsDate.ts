// Dia operacional do Painel do Gestor (seção 6.1 do /docs/BUILD_BOOK.md).
//
// O dia operacional vai das 06h00 às 05h59 do dia seguinte: uma venda feita
// à 01:30 de 14/09 pertence ao dia 13/09. A regra do book é `ops_date =
// date(ts − 6h)`.
//
// Tudo aqui trabalha em UTC de propósito. As colunas `date` do Postgres não
// têm fuso; o Prisma lê e escreve elas como meia-noite UTC. Converter no
// fuso do servidor faria a data "andar" conforme onde o app roda.

/** Quantas horas o dia operacional começa depois da meia-noite. */
export const HORA_INICIO_DIA_OPERACIONAL = 6;

const MS_POR_HORA = 60 * 60 * 1000;

/**
 * Fuso das lojas. Fortaleza não tem horário de verão desde 2019, então o
 * deslocamento é fixo em −3h — por isso dá para usar um número simples no
 * lugar de uma biblioteca de fusos.
 */
export const FUSO_LOJA_HORAS = -3;

/**
 * Converte um instante (o `sold_at` do relatório, já em UTC) no `ops_date`
 * a que ele pertence, como texto "AAAA-MM-DD".
 */
export function opsDateDe(ts: Date, fusoHoras: number = FUSO_LOJA_HORAS): string {
  const local = new Date(ts.getTime() + fusoHoras * MS_POR_HORA);
  const deslocado = new Date(local.getTime() - HORA_INICIO_DIA_OPERACIONAL * MS_POR_HORA);
  return deslocado.toISOString().slice(0, 10);
}

/**
 * A hora do dia operacional (0–23) em que o instante caiu, no horário da loja.
 * Usada pelas curvas por hora da seção 6.1.
 */
export function horaOperacional(ts: Date, fusoHoras: number = FUSO_LOJA_HORAS): number {
  const local = new Date(ts.getTime() + fusoHoras * MS_POR_HORA);
  return local.getUTCHours();
}

/** Texto "AAAA-MM-DD" -> Date de meia-noite UTC, que é como o Postgres guarda `date`. */
export function dataDoTexto(iso: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    throw new Error(`Data inválida: "${iso}". Use o formato AAAA-MM-DD.`);
  }
  return new Date(`${iso}T00:00:00.000Z`);
}

/** Date de uma coluna `date` -> texto "AAAA-MM-DD". */
export function textoDaData(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Soma (ou subtrai) dias a uma data "AAAA-MM-DD". */
export function somaDias(iso: string, dias: number): string {
  const d = dataDoTexto(iso);
  d.setUTCDate(d.getUTCDate() + dias);
  return textoDaData(d);
}

/** Segunda-feira da semana que contém a data (a semana da loja vai de segunda a domingo). */
export function inicioDaSemanaOperacional(iso: string): string {
  const d = dataDoTexto(iso);
  const dow = d.getUTCDay(); // 0 = domingo
  return somaDias(iso, dow === 0 ? -6 : 1 - dow);
}

/** As 7 datas da semana que começa na data informada. */
export function diasDaSemana(inicioISO: string): string[] {
  return Array.from({ length: 7 }, (_, i) => somaDias(inicioISO, i));
}

/** Primeiro dia do mês da data informada (as apurações mensais usam `month date`). */
export function inicioDoMes(iso: string): string {
  return `${iso.slice(0, 7)}-01`;
}

/** Tipos de dia da seção 6.1. Feriado se comporta como sábado. */
export type TipoDeDia = "Dom" | "Sáb" | "Sex" | "Seg–Qui";

const TIPO_POR_DIA_SEMANA: TipoDeDia[] = [
  "Dom", // 0
  "Seg–Qui", // 1
  "Seg–Qui", // 2
  "Seg–Qui", // 3
  "Seg–Qui", // 4
  "Sex", // 5
  "Sáb", // 6
];

/**
 * Tipo do dia operacional. Se a data estiver na lista de feriados, o book
 * manda tratar como sábado (o `behaves_like` da tabela `holidays`).
 */
export function tipoDeDia(iso: string, feriados?: Set<string>): TipoDeDia {
  if (feriados?.has(iso)) return "Sáb";
  return TIPO_POR_DIA_SEMANA[dataDoTexto(iso).getUTCDay()];
}

/** O ops_date de agora, para telas do dia (dashboard, contagem, checklist). */
export function opsDateDeHoje(fusoHoras: number = FUSO_LOJA_HORAS): string {
  return opsDateDe(new Date(), fusoHoras);
}
