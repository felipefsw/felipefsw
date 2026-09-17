// Gravação em lote e idempotente dos fatos da ingestão.
//
// O book (seção 1) exige que reenviar um relatório NUNCA duplique: a trava é a
// chave natural de cada tabela. Aqui isso vira `INSERT ... ON CONFLICT DO
// UPDATE`, feito em lotes para dar conta de arquivos com dezenas de milhares
// de linhas.

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/** Quantas linhas por comando. Segura o limite de parâmetros do Postgres. */
const TAMANHO_DO_LOTE = 500;

export async function gravarEmLotes(
  linhas: Prisma.Sql[],
  montarComando: (lote: Prisma.Sql) => Prisma.Sql,
): Promise<number> {
  let gravadas = 0;
  for (let i = 0; i < linhas.length; i += TAMANHO_DO_LOTE) {
    const lote = linhas.slice(i, i + TAMANHO_DO_LOTE);
    gravadas += await prisma.$executeRaw(montarComando(Prisma.join(lote)));
  }
  return gravadas;
}

/** Data "AAAA-MM-DD" como literal de `date` — sem passar por fuso nenhum. */
export function sqlData(iso: string): Prisma.Sql {
  return Prisma.sql`${iso}::date`;
}

/** Número opcional para coluna `numeric`. */
export function sqlNumero(v: number | null): Prisma.Sql {
  return v === null ? Prisma.sql`NULL::numeric` : Prisma.sql`${v}::numeric`;
}

/** Texto opcional. */
export function sqlTexto(v: string | null): Prisma.Sql {
  return v === null || v === "" ? Prisma.sql`NULL::text` : Prisma.sql`${v}::text`;
}

/** Inteiro opcional. */
export function sqlInteiro(v: number | null): Prisma.Sql {
  return v === null ? Prisma.sql`NULL::int` : Prisma.sql`${v}::int`;
}

/** Valor de um enum do Postgres (ex.: 'D'::tipo_pedido). */
export function sqlEnum(v: string | null, tipo: string): Prisma.Sql {
  if (v === null) return Prisma.raw(`NULL::${tipo}`);
  return Prisma.sql`${v}${Prisma.raw(`::${tipo}`)}`;
}
