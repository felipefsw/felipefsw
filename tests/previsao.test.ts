// Perfil por dia da semana e previsão (seção 6.1 do book).
//
// O teste 3 da seção 11 fixa os números reais da WLP1 (Seg 218 ... Dom 514).
// Ele só pode rodar com o export de verdade em /docs/samples/ — enquanto o
// arquivo não chega, aqui se verifica a REGRA com dados montados de propósito:
// média das semanas completas, feriado fora da conta e feriado se comportando
// como sábado.

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { dataDoTexto, somaDias } from "@/lib/painel/opsDate";
import { gravarEmLotes } from "@/lib/painel/ingestao/gravar";
import { instante } from "@/lib/painel/ingestao/valores";
import {
  diaDaSemanaDe,
  janelaDoPerfil,
  perfilPorDiaDaSemana,
  perfilPorHora,
  previsao,
  previsao14Dias,
  previsaoDaSemana,
  totaisDoPeriodo,
} from "@/lib/painel/vendas";

let storeId = "";

/** "Hoje" fixo para o teste: quinta, 17/09/2026. */
const HOJE = "2026-09-17";
/** Pedidos por dia da semana que vamos plantar (segunda=1 ... domingo=7). */
const PEDIDOS_POR_DIA: Record<number, number> = { 1: 218, 2: 222, 3: 238, 4: 259, 5: 397, 6: 441, 7: 514 };

/** Cria os pedidos de um dia, espalhados entre 18h e 21h (horário da loja). */
async function plantarDia(data: string, quantos: number) {
  const [ano, mes, dia] = data.split("-");
  const valores: Prisma.Sql[] = [];
  for (let i = 0; i < quantos; i++) {
    const hora = 18 + (i % 4);
    // Passa pelo mesmo conversor da ingestão: hora de parede da loja -> instante.
    const soldAt = instante(
      `${dia}/${mes}/${ano} ${String(hora).padStart(2, "0")}:${String(i % 60).padStart(2, "0")}`,
    );
    if (!soldAt) throw new Error(`data de teste inválida: ${data} ${hora}h`);
    valores.push(Prisma.sql`(
      ${storeId}::uuid, ${`T${data}-${i}`}::text, ${soldAt}::timestamptz, ${data}::date,
      'iFood'::text, 'D'::tipo_pedido, ${60 + (i % 20)}::numeric, false, now()
    )`);
  }
  if (valores.length === 0) return;
  // Usa o mesmo gravador em lotes da ingestão: um INSERT só com 514 linhas
  // estoura o limite de parâmetros do driver.
  await gravarEmLotes(
    valores,
    (lote) => Prisma.sql`
      INSERT INTO orders (store_id, external_id, sold_at, ops_date, channel, order_type, total, cancelled, updated_at)
      VALUES ${lote}
    `,
  );
}

async function limpar() {
  await prisma.order.deleteMany({ where: { storeId } });
  await prisma.holiday.deleteMany({ where: { name: { startsWith: "TESTE " } } });
}

beforeAll(async () => {
  const loja = await prisma.store.findFirst({ where: { name: { contains: "We Love" } } });
  if (!loja) throw new Error("rode `npx tsx prisma/seed.painel.ts` antes dos testes");
  storeId = loja.id;
  await limpar();

  // Planta 5 semanas completas antes da semana de HOJE, todas iguais.
  const { inicio, fim } = janelaDoPerfil(HOJE);
  for (let d = inicio; d <= fim; d = somaDias(d, 1)) {
    await plantarDia(d, PEDIDOS_POR_DIA[diaDaSemanaDe(d)]);
  }
  // E um dia na semana CORRENTE, que não pode entrar no perfil.
  await plantarDia(somaDias(HOJE, -1), 999);
});

afterAll(async () => {
  await limpar();
  await prisma.$disconnect();
});

describe("janela do perfil", () => {
  it("usa 5 semanas completas e para no domingo anterior", () => {
    // 17/09/2026 é quinta; a semana dela começa em 14/09.
    const { inicio, fim } = janelaDoPerfil(HOJE);
    expect(fim).toBe("2026-09-13"); // domingo passado
    expect(inicio).toBe("2026-08-10"); // 5 semanas antes, numa segunda
  });
});

describe("perfil por dia da semana", () => {
  it("dá a média de cada dia da semana, já sem os feriados", async () => {
    // A janela pega 5 de cada dia da semana, menos os que caíram em feriado —
    // 07/09 (Independência, segunda) e 15/08 (padroeira, sábado) estão nela.
    const { inicio, fim } = janelaDoPerfil(HOJE);
    const feriados = await prisma.holiday.findMany({
      where: { date: { gte: dataDoTexto(inicio), lte: dataDoTexto(fim) } },
      select: { date: true },
    });
    const esperados = new Map([1, 2, 3, 4, 5, 6, 7].map((d) => [d, 5]));
    for (const f of feriados) {
      const d = diaDaSemanaDe(f.date.toISOString().slice(0, 10));
      esperados.set(d, esperados.get(d)! - 1);
    }

    const perfil = await perfilPorDiaDaSemana(storeId, HOJE);
    expect(perfil).toHaveLength(7);
    for (const p of perfil) {
      expect(p.mediaPedidos).toBe(PEDIDOS_POR_DIA[p.dia]);
      expect(p.diasMedidos, `dias medidos do dia ${p.dia}`).toBe(esperados.get(p.dia));
      expect(p.minPedidos).toBe(PEDIDOS_POR_DIA[p.dia]);
      expect(p.maxPedidos).toBe(PEDIDOS_POR_DIA[p.dia]);
    }
  });

  it("os feriados de 2026 realmente caem dentro da janela do teste", async () => {
    const { inicio, fim } = janelaDoPerfil(HOJE);
    const quantos = await prisma.holiday.count({
      where: { date: { gte: dataDoTexto(inicio), lte: dataDoTexto(fim) } },
    });
    expect(quantos).toBeGreaterThan(0); // senão o teste acima não provaria nada
  });

  it("não deixa o dia da semana corrente entrar na média", async () => {
    // Plantamos 999 pedidos na quarta desta semana; a média da quarta segue 238.
    const perfil = await perfilPorDiaDaSemana(storeId, HOJE);
    expect(perfil.find((p) => p.dia === 3)?.mediaPedidos).toBe(238);
  });

  it("feriado sai da conta da média", async () => {
    const umaSexta = "2026-09-11";
    await prisma.holiday.create({
      data: { date: dataDoTexto(umaSexta), name: "TESTE feriado", behavesLike: "Sáb" },
    });
    // Sem essa sexta, sobram 4 sextas — mas todas com 397, então a média não muda.
    const perfil = await perfilPorDiaDaSemana(storeId, HOJE);
    const sexta = perfil.find((p) => p.dia === 5);
    expect(sexta?.diasMedidos).toBe(4);
    expect(sexta?.mediaPedidos).toBe(397);
    await prisma.holiday.deleteMany({ where: { name: "TESTE feriado" } });
  });
});

describe("previsão", () => {
  it("a previsão do dia é a média daquele dia da semana", async () => {
    const [sexta] = await previsao(storeId, ["2026-09-18"], HOJE);
    expect(sexta.dia).toBe(5);
    expect(sexta.pedidos).toBe(397);
    expect(sexta.tipo).toBe("Sex");
  });

  it("feriado se comporta como sábado", async () => {
    const umaSegunda = "2026-09-21";
    await prisma.holiday.create({
      data: { date: dataDoTexto(umaSegunda), name: "TESTE feriadão", behavesLike: "Sáb" },
    });
    const [dia] = await previsao(storeId, [umaSegunda], HOJE);
    expect(dia.dia).toBe(1); // continua sendo uma segunda no calendário
    expect(dia.tipo).toBe("Sáb"); // mas se comporta como sábado
    expect(dia.pedidos).toBe(441); // e usa a média de sábado, não a de segunda
    expect(dia.feriado).toBe("TESTE feriadão");
    await prisma.holiday.deleteMany({ where: { name: "TESTE feriadão" } });
  });

  it("a previsão da semana é a soma dos 7 dias", async () => {
    const semana = await previsaoDaSemana(storeId, "2026-09-21", HOJE);
    const esperado = Object.values(PEDIDOS_POR_DIA).reduce((a, b) => a + b, 0);
    expect(semana.dias).toHaveLength(7);
    expect(semana.totalPedidos).toBe(esperado); // 2.289
  });

  it("a previsão de 14 dias traz uma linha por data", async () => {
    const dias = await previsao14Dias(storeId, "2026-09-18", HOJE);
    expect(dias).toHaveLength(14);
    expect(dias[0].data).toBe("2026-09-18");
    expect(dias[13].data).toBe("2026-10-01");
    expect(dias.every((d) => d.pedidos !== null)).toBe(true);
  });

  it("sem histórico, a previsão fica em branco em vez de chutar", async () => {
    const outra = await prisma.store.findFirst({ where: { name: { contains: "Rei da Pizza" } } });
    const [dia] = await previsao(outra!.id, ["2026-09-18"], HOJE);
    expect(dia.pedidos).toBeNull();
    expect(dia.diasMedidos).toBe(0);
  });
});

describe("perfil por hora e totais", () => {
  it("as horas somam o total do dia", async () => {
    const horas = await perfilPorHora(storeId, HOJE);
    const domingo = horas.filter((h) => h.dia === 7);
    const soma = domingo.reduce((s, h) => s + h.pedidos, 0);
    expect(Math.round(soma)).toBe(PEDIDOS_POR_DIA[7]);
    // Plantamos tudo entre 18h e 21h.
    expect(domingo.every((h) => h.hora >= 18 && h.hora <= 21)).toBe(true);
  });

  it("os totais do período trazem ticket e cancelamento", async () => {
    const t = await totaisDoPeriodo(storeId, "2026-09-07", "2026-09-13");
    const esperado = Object.values(PEDIDOS_POR_DIA).reduce((a, b) => a + b, 0);
    expect(t.pedidos).toBe(esperado);
    expect(t.cancelados).toBe(0);
    expect(t.cancelPct).toBe(0);
    expect(t.ticket).toBeGreaterThan(59);
    expect(t.ticket).toBeLessThan(80);
  });
});
