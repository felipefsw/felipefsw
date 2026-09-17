// Parâmetros e réguas com vigência (seções 4 e 6 do /docs/BUILD_BOOK.md).
//
// Regras do book:
//  - o parâmetro da LOJA ganha do parâmetro da REDE (`store_id null`);
//  - vale a linha com o maior `valid_from` que não seja depois da data pedida;
//  - mudar um parâmetro cria uma linha nova, nunca altera cálculo passado;
//  - toda apuração grava em `params_version` a vigência que usou.

import { prisma } from "@/lib/prisma";
import { dataDoTexto, textoDaData } from "./opsDate";

/** Valores padrão da rede, exatamente como estão na seção 4 do book. */
export const PARAMETROS_PADRAO = {
  prod_target: 22,
  att_target: 25,
  min_prod: 2,
  min_att: 1,
  courier_cost: 8,
  box_cost: 1.25,
  gas_cost: 0.25,
  ifood_rate: 0.121,
  cmv_green: 29,
  cmv_yellow: 31,
  prod_time_ok: 10,
  prod_time_bad: 13,
  delivery_ok: 40,
  delivery_bad: 50,
  dough_max_min: 60,
  floor_pct: 85,
  nut_gate: 70,
  nut_excel: 90,
  late_tolerance: 1,
  weeks_in_house: 4,
  calls_green: 1.5,
  calls_red: 2.5,
  cancel_max: 1,
  nota_min: 4.8,
  prize_presence: 30,
  prize_streak: 40,
  prize_cmv_green: 40,
  prize_cmv_yellow: 20,
  prize_pizzas: 15,
  prize_pizzas_110: 25,
  prize_quality: 15,
  prize_excel: 20,
  leader_potential: 600,
  manager_potential: 900,
  commission_pct: 10,
  accelerator_pct: 20,
  manager_bonus_110: 200,
} as const;

/**
 * Chaves sem valor padrão no book: dependem da loja e do período, e por isso
 * NÃO podem ser inventadas — enquanto não forem cadastradas, quem usa recebe
 * `null` e a tela mostra pendência (princípio da seção 1).
 */
export const PARAMETROS_SEM_PADRAO = ["pizzas_per_order", "drink_cost_order"] as const;

export type ChaveParametro =
  | keyof typeof PARAMETROS_PADRAO
  | (typeof PARAMETROS_SEM_PADRAO)[number];

export const TODAS_AS_CHAVES: ChaveParametro[] = [
  ...(Object.keys(PARAMETROS_PADRAO) as (keyof typeof PARAMETROS_PADRAO)[]),
  ...PARAMETROS_SEM_PADRAO,
];

export type Parametros = {
  /** Valor da chave na data pedida, ou null quando nunca foi cadastrada. */
  valor(chave: ChaveParametro): number | null;
  /** Igual a `valor`, mas explode se faltar — para cálculos que não podem chutar. */
  exige(chave: ChaveParametro): number;
  /** A vigência mais recente usada, para gravar em `params_version`. */
  versao: Date | null;
};

/**
 * Lê os parâmetros válidos para uma loja em uma data ("AAAA-MM-DD").
 * Uma consulta só: pega todas as linhas vigentes e resolve na memória.
 */
export async function lerParametros(storeId: string, emISO: string): Promise<Parametros> {
  const ate = dataDoTexto(emISO);

  const linhas = await prisma.param.findMany({
    where: {
      OR: [{ storeId }, { storeId: null }],
      validFrom: { lte: ate },
    },
    orderBy: { validFrom: "asc" },
    select: { storeId: true, key: true, valueNum: true, validFrom: true },
  });

  // Como está ordenado por vigência crescente, a última linha lida vence.
  const daRede = new Map<string, { valor: number; vigencia: Date }>();
  const daLoja = new Map<string, { valor: number; vigencia: Date }>();
  for (const l of linhas) {
    if (l.valueNum === null) continue;
    const destino = l.storeId === null ? daRede : daLoja;
    destino.set(l.key, { valor: Number(l.valueNum), vigencia: l.validFrom });
  }

  const usadas: Date[] = [];
  const resolvido = new Map<string, number>();
  for (const chave of TODAS_AS_CHAVES) {
    const escolhido = daLoja.get(chave) ?? daRede.get(chave);
    if (escolhido) {
      resolvido.set(chave, escolhido.valor);
      usadas.push(escolhido.vigencia);
    } else if (chave in PARAMETROS_PADRAO) {
      resolvido.set(chave, PARAMETROS_PADRAO[chave as keyof typeof PARAMETROS_PADRAO]);
    }
  }

  const versao =
    usadas.length > 0
      ? usadas.reduce((a, b) => (a.getTime() > b.getTime() ? a : b))
      : null;

  return {
    valor: (chave) => resolvido.get(chave) ?? null,
    exige: (chave) => {
      const v = resolvido.get(chave);
      if (v === undefined) {
        throw new Error(
          `Parâmetro "${chave}" não cadastrado para esta loja em ${emISO}. ` +
            `Cadastre em Admin › Parâmetros antes de calcular.`,
        );
      }
      return v;
    },
    versao,
  };
}

/** Régua do CMV da seção 6.2: verde < 29, amarelo 29–31, vermelho > 31. */
export type Semaforo = "verde" | "amarelo" | "vermelho";

export function semaforoCmv(cmvPct: number, p: Parametros): Semaforo {
  const verde = p.exige("cmv_green");
  const amarelo = p.exige("cmv_yellow");
  if (cmvPct < verde) return "verde";
  if (cmvPct <= amarelo) return "amarelo";
  return "vermelho";
}

/** Régua de chamados da seção 6.3: verde ≤ 1,5%, amarelo até 2,5%, vermelho acima. */
export function semaforoChamados(callsPct: number, p: Parametros): Semaforo {
  if (callsPct <= p.exige("calls_green")) return "verde";
  if (callsPct <= p.exige("calls_red")) return "amarelo";
  return "vermelho";
}

/** Régua do tempo de produção da seção 6.1: 10 min ok, 13 min ruim. */
export function semaforoTempoProducao(minutos: number, p: Parametros): Semaforo {
  if (minutos <= p.exige("prod_time_ok")) return "verde";
  if (minutos <= p.exige("prod_time_bad")) return "amarelo";
  return "vermelho";
}

/** Data de vigência em texto, para mostrar na tela de parâmetros. */
export function vigenciaEmTexto(d: Date | null): string | null {
  return d ? textoDaData(d) : null;
}
