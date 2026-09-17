// Perfil por dia da semana, curvas por hora e previsão (seção 6.1 do book).
//
// Todas as contas são feitas em SQL, no Postgres — a tela só recebe números
// prontos (regra do /CLAUDE.md). Os cancelados já saem de fora pela view
// v_orders_hourly e pelo filtro `cancelled = false`.

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  diasDaSemana,
  inicioDaSemanaOperacional,
  somaDias,
  tipoDeDia,
  type TipoDeDia,
} from "./opsDate";

/** Quantas semanas completas entram no perfil. O book fala em 4 a 5. */
export const SEMANAS_DO_PERFIL = 5;

/** Segunda = 1 ... domingo = 7, como o ISODOW do Postgres. */
export type DiaDaSemana = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const NOME_DO_DIA: Record<DiaDaSemana, string> = {
  1: "Segunda", 2: "Terça", 3: "Quarta", 4: "Quinta",
  5: "Sexta", 6: "Sábado", 7: "Domingo",
};

export const NOME_CURTO_DO_DIA: Record<DiaDaSemana, string> = {
  1: "Seg", 2: "Ter", 3: "Qua", 4: "Qui", 5: "Sex", 6: "Sáb", 7: "Dom",
};

export type PerfilDoDia = {
  dia: DiaDaSemana;
  /** Média de pedidos válidos daquele dia da semana. */
  mediaPedidos: number;
  minPedidos: number;
  maxPedidos: number;
  mediaFaturamento: number;
  /** Quantos dias entraram na média (quanto maior, mais confiável). */
  diasMedidos: number;
};

/** A janela de semanas completas usada pelo perfil. */
export function janelaDoPerfil(ateISO: string, semanas = SEMANAS_DO_PERFIL) {
  // Só semanas fechadas: a semana corrente (e o dia de hoje) ficam de fora.
  const fim = somaDias(inicioDaSemanaOperacional(ateISO), -1); // domingo passado
  const inicio = somaDias(fim, -(semanas * 7 - 1));
  return { inicio, fim, semanas };
}

/**
 * Média de pedidos por dia da semana nas últimas semanas completas,
 * excluindo feriados e o dia corrente (seção 6.1).
 */
export async function perfilPorDiaDaSemana(
  storeId: string,
  ateISO: string,
  semanas = SEMANAS_DO_PERFIL,
): Promise<PerfilDoDia[]> {
  const { inicio, fim } = janelaDoPerfil(ateISO, semanas);

  const linhas = await prisma.$queryRaw<
    { dia: number; media: number; minimo: number; maximo: number; faturamento: number; dias: number }[]
  >(Prisma.sql`
    WITH por_dia AS (
      SELECT o.ops_date,
             count(*)::int                  AS pedidos,
             sum(coalesce(o.total, 0))      AS faturamento
      FROM orders o
      WHERE o.store_id = ${storeId}::uuid
        AND o.cancelled = false
        AND o.ops_date BETWEEN ${inicio}::date AND ${fim}::date
        AND NOT EXISTS (SELECT 1 FROM holidays h WHERE h.date = o.ops_date)
      GROUP BY o.ops_date
    )
    SELECT EXTRACT(ISODOW FROM ops_date)::int AS dia,
           avg(pedidos)::float               AS media,
           min(pedidos)::int                 AS minimo,
           max(pedidos)::int                 AS maximo,
           avg(faturamento)::float           AS faturamento,
           count(*)::int                     AS dias
    FROM por_dia
    GROUP BY 1
    ORDER BY 1
  `);

  return linhas.map((l) => ({
    dia: l.dia as DiaDaSemana,
    mediaPedidos: Math.round(l.media),
    minPedidos: l.minimo,
    maxPedidos: l.maximo,
    mediaFaturamento: Math.round(l.faturamento * 100) / 100,
    diasMedidos: l.dias,
  }));
}

export type PrevisaoDeDia = {
  data: string;
  dia: DiaDaSemana;
  tipo: TipoDeDia;
  feriado: string | null;
  /** null quando não há histórico suficiente — o painel não chuta (seção 1). */
  pedidos: number | null;
  faturamento: number | null;
  diasMedidos: number;
};

/**
 * Previsão por data: a média do dia da semana correspondente.
 * Feriado se comporta como sábado, então usa o perfil de sábado.
 */
export async function previsao(
  storeId: string,
  datas: string[],
  ateISO: string,
  semanas = SEMANAS_DO_PERFIL,
): Promise<PrevisaoDeDia[]> {
  const [perfil, feriados] = await Promise.all([
    perfilPorDiaDaSemana(storeId, ateISO, semanas),
    feriadosDoPeriodo(datas),
  ]);

  const porDia = new Map(perfil.map((p) => [p.dia, p]));

  return datas.map((data) => {
    const feriado = feriados.get(data) ?? null;
    const diaReal = diaDaSemanaDe(data);
    // Feriado se comporta como sábado (seção 6.1): usa o perfil de sábado.
    const diaUsado: DiaDaSemana = feriado ? 6 : diaReal;
    const p = porDia.get(diaUsado);

    return {
      data,
      dia: diaReal,
      tipo: tipoDeDia(data, new Set(feriados.keys())),
      feriado,
      pedidos: p ? p.mediaPedidos : null,
      faturamento: p ? p.mediaFaturamento : null,
      diasMedidos: p?.diasMedidos ?? 0,
    };
  });
}

/**
 * Previsão dos próximos 14 dias a partir de uma data (seção 6.1).
 * `ateISO` é o "hoje" que define a janela de semanas completas do perfil;
 * normalmente é o próprio dia em que a tabela começa.
 */
export async function previsao14Dias(
  storeId: string,
  deISO: string,
  ateISO: string = deISO,
  semanas = SEMANAS_DO_PERFIL,
): Promise<PrevisaoDeDia[]> {
  const datas = Array.from({ length: 14 }, (_, i) => somaDias(deISO, i));
  return previsao(storeId, datas, ateISO, semanas);
}

/** Previsão da semana: os 7 dias e a soma. */
export async function previsaoDaSemana(
  storeId: string,
  inicioSemanaISO: string,
  ateISO: string,
  semanas = SEMANAS_DO_PERFIL,
) {
  const dias = await previsao(storeId, diasDaSemana(inicioSemanaISO), ateISO, semanas);
  const medidos = dias.filter((d) => d.pedidos !== null);
  return {
    dias,
    /** null quando algum dia da semana ainda não tem histórico. */
    totalPedidos: medidos.length === 7 ? medidos.reduce((s, d) => s + (d.pedidos ?? 0), 0) : null,
    totalFaturamento:
      medidos.length === 7
        ? Math.round(medidos.reduce((s, d) => s + (d.faturamento ?? 0), 0) * 100) / 100
        : null,
  };
}

export type HoraDoPerfil = { dia: DiaDaSemana; hora: number; pedidos: number; faturamento: number };

/**
 * Média de pedidos por dia da semana E por hora — o mapa de calor da seção 7.6.
 * A média divide pelo número de dias daquele dia da semana na janela, e não
 * pelo número de horas com movimento: hora sem pedido é zero, não é "sem dado".
 */
export async function perfilPorHora(
  storeId: string,
  ateISO: string,
  semanas = SEMANAS_DO_PERFIL,
): Promise<HoraDoPerfil[]> {
  const { inicio, fim } = janelaDoPerfil(ateISO, semanas);

  const linhas = await prisma.$queryRaw<
    { dia: number; hora: number; pedidos: number; faturamento: number }[]
  >(Prisma.sql`
    WITH dias_validos AS (
      SELECT DISTINCT o.ops_date
      FROM orders o
      WHERE o.store_id = ${storeId}::uuid
        AND o.cancelled = false
        AND o.ops_date BETWEEN ${inicio}::date AND ${fim}::date
        AND NOT EXISTS (SELECT 1 FROM holidays h WHERE h.date = o.ops_date)
    ),
    dias_por_semana AS (
      SELECT EXTRACT(ISODOW FROM ops_date)::int AS dia, count(*)::int AS quantos
      FROM dias_validos GROUP BY 1
    ),
    por_hora AS (
      SELECT EXTRACT(ISODOW FROM v.ops_date)::int AS dia,
             v.hour                               AS hora,
             sum(v.orders)::int                   AS pedidos,
             sum(v.revenue)                       AS faturamento
      FROM v_orders_hourly v
      JOIN dias_validos d ON d.ops_date = v.ops_date
      WHERE v.store_id = ${storeId}::uuid
      GROUP BY 1, 2
    )
    SELECT p.dia, p.hora,
           (p.pedidos::float / s.quantos)     AS pedidos,
           (p.faturamento::float / s.quantos) AS faturamento
    FROM por_hora p
    JOIN dias_por_semana s ON s.dia = p.dia
    ORDER BY p.dia, p.hora
  `);

  return linhas.map((l) => ({
    dia: l.dia as DiaDaSemana,
    hora: l.hora,
    pedidos: Math.round(l.pedidos * 10) / 10,
    faturamento: Math.round(l.faturamento * 100) / 100,
  }));
}

export type DiaRealizado = {
  data: string;
  dia: DiaDaSemana;
  pedidos: number;
  faturamento: number;
  ticket: number;
  entregas: number;
  balcao: number;
};

/** O que realmente aconteceu, dia a dia, no período (seção 7.6). */
export async function diaADia(
  storeId: string,
  deISO: string,
  ateISO: string,
): Promise<DiaRealizado[]> {
  const linhas = await prisma.$queryRaw<
    { data: Date; pedidos: number; faturamento: number; entregas: number; balcao: number }[]
  >(Prisma.sql`
    SELECT o.ops_date                                        AS data,
           count(*)::int                                     AS pedidos,
           sum(coalesce(o.total, 0))::float                  AS faturamento,
           count(*) FILTER (WHERE o.order_type = 'D')::int   AS entregas,
           count(*) FILTER (WHERE o.order_type = 'B')::int   AS balcao
    FROM orders o
    WHERE o.store_id = ${storeId}::uuid
      AND o.cancelled = false
      AND o.ops_date BETWEEN ${deISO}::date AND ${ateISO}::date
    GROUP BY o.ops_date
    ORDER BY o.ops_date
  `);

  return linhas.map((l) => {
    const data = l.data.toISOString().slice(0, 10);
    return {
      data,
      dia: diaDaSemanaDe(data),
      pedidos: l.pedidos,
      faturamento: Math.round(l.faturamento * 100) / 100,
      ticket: l.pedidos > 0 ? Math.round((l.faturamento / l.pedidos) * 100) / 100 : 0,
      entregas: l.entregas,
      balcao: l.balcao,
    };
  });
}

/** Totais do período: faturamento, pedidos, ticket e cancelamento. */
export async function totaisDoPeriodo(storeId: string, deISO: string, ateISO: string) {
  const [linha] = await prisma.$queryRaw<
    { pedidos: number; faturamento: number; cancelados: number; entregas: number }[]
  >(Prisma.sql`
    SELECT count(*) FILTER (WHERE NOT o.cancelled)::int                        AS pedidos,
           coalesce(sum(o.total) FILTER (WHERE NOT o.cancelled), 0)::float     AS faturamento,
           count(*) FILTER (WHERE o.cancelled)::int                            AS cancelados,
           count(*) FILTER (WHERE NOT o.cancelled AND o.order_type = 'D')::int AS entregas
    FROM orders o
    WHERE o.store_id = ${storeId}::uuid
      AND o.ops_date BETWEEN ${deISO}::date AND ${ateISO}::date
  `);

  const pedidos = linha?.pedidos ?? 0;
  const faturamento = Math.round((linha?.faturamento ?? 0) * 100) / 100;
  const cancelados = linha?.cancelados ?? 0;
  const total = pedidos + cancelados;

  return {
    pedidos,
    faturamento,
    cancelados,
    entregas: linha?.entregas ?? 0,
    ticket: pedidos > 0 ? Math.round((faturamento / pedidos) * 100) / 100 : 0,
    // Taxa de cancelamento sobre TODOS os pedidos do período (seção 6.3).
    cancelPct: total > 0 ? Math.round((cancelados / total) * 1000) / 10 : 0,
  };
}

/** O período que já tem dado no banco, para a tela abrir em algo útil. */
export async function periodoComDados(storeId: string): Promise<{ inicio: string; fim: string } | null> {
  const [l] = await prisma.$queryRaw<{ inicio: Date | null; fim: Date | null }[]>(Prisma.sql`
    SELECT min(ops_date) AS inicio, max(ops_date) AS fim
    FROM orders WHERE store_id = ${storeId}::uuid AND cancelled = false
  `);
  if (!l?.inicio || !l?.fim) return null;
  return { inicio: l.inicio.toISOString().slice(0, 10), fim: l.fim.toISOString().slice(0, 10) };
}

async function feriadosDoPeriodo(datas: string[]): Promise<Map<string, string>> {
  if (datas.length === 0) return new Map();
  const ordenadas = [...datas].sort();
  const linhas = await prisma.$queryRaw<{ date: Date; name: string }[]>(Prisma.sql`
    SELECT date, name FROM holidays
    WHERE date BETWEEN ${ordenadas[0]}::date AND ${ordenadas[ordenadas.length - 1]}::date
  `);
  return new Map(linhas.map((l) => [l.date.toISOString().slice(0, 10), l.name]));
}

/** Segunda = 1 ... domingo = 7, a partir de "AAAA-MM-DD". */
export function diaDaSemanaDe(iso: string): DiaDaSemana {
  const dow = new Date(`${iso}T00:00:00.000Z`).getUTCDay(); // 0 = domingo
  return (dow === 0 ? 7 : dow) as DiaDaSemana;
}
