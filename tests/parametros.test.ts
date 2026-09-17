// Aceite da seção 7.1 do book:
// "alteração de parâmetro cria nova linha com valid_from e não altera cálculos anteriores."

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { dataDoTexto } from "@/lib/painel/opsDate";
import {
  PARAMETROS_PADRAO,
  lerParametros,
  semaforoChamados,
  semaforoCmv,
  semaforoTempoProducao,
  vigenciaEmTexto,
} from "@/lib/painel/parametros";

let wlp1 = "";
const CHAVE = "cmv_green";

beforeAll(async () => {
  const loja = await prisma.store.findFirst({ where: { name: { contains: "We Love" } } });
  if (!loja) throw new Error("rode `npx tsx prisma/seed.painel.ts` antes dos testes");
  wlp1 = loja.id;
  await prisma.param.deleteMany({ where: { storeId: wlp1 } });
});

afterAll(async () => {
  await prisma.param.deleteMany({ where: { storeId: wlp1 } });
  await prisma.$disconnect();
});

describe("parâmetros com vigência", () => {
  it("sem linha da loja, vale o valor da rede", async () => {
    const p = await lerParametros(wlp1, "2026-09-15");
    expect(p.valor(CHAVE)).toBe(PARAMETROS_PADRAO.cmv_green);
    expect(vigenciaEmTexto(p.versao)).toBe("2026-09-01");
  });

  it("o valor da loja ganha do valor da rede", async () => {
    await prisma.param.create({
      data: { storeId: wlp1, key: CHAVE, valueNum: 27, validFrom: dataDoTexto("2026-09-10") },
    });
    const p = await lerParametros(wlp1, "2026-09-15");
    expect(p.valor(CHAVE)).toBe(27);
  });

  it("um valor novo não mexe no passado", async () => {
    await prisma.param.create({
      data: { storeId: wlp1, key: CHAVE, valueNum: 26, validFrom: dataDoTexto("2026-09-20") },
    });

    const antes = await lerParametros(wlp1, "2026-09-15");
    const depois = await lerParametros(wlp1, "2026-09-25");

    expect(antes.valor(CHAVE)).toBe(27); // dia anterior segue com o valor antigo
    expect(depois.valor(CHAVE)).toBe(26);
    expect(vigenciaEmTexto(depois.versao)).toBe("2026-09-20");
  });

  it("um valor agendado para o futuro ainda não vale", async () => {
    await prisma.param.create({
      data: { storeId: wlp1, key: CHAVE, valueNum: 24, validFrom: dataDoTexto("2026-12-01") },
    });
    const p = await lerParametros(wlp1, "2026-09-25");
    expect(p.valor(CHAVE)).toBe(26);
  });

  it("as duas chaves sem padrão no book ficam em branco, nunca chutadas", async () => {
    const p = await lerParametros(wlp1, "2026-09-25");
    expect(p.valor("pizzas_per_order")).toBeNull();
    expect(p.valor("drink_cost_order")).toBeNull();
    expect(() => p.exige("pizzas_per_order")).toThrow(/não cadastrado/);
  });
});

describe("réguas da seção 6", () => {
  it("CMV: verde abaixo de 29, amarelo até 31, vermelho acima", async () => {
    const p = await lerParametros(wlp1, "2026-01-01"); // antes de qualquer linha: usa o padrão
    expect(semaforoCmv(28.9, p)).toBe("verde");
    expect(semaforoCmv(29, p)).toBe("amarelo");
    expect(semaforoCmv(31, p)).toBe("amarelo");
    expect(semaforoCmv(31.1, p)).toBe("vermelho");
  });

  it("chamados: verde até 1,5%, amarelo até 2,5%, vermelho acima", async () => {
    const p = await lerParametros(wlp1, "2026-01-01");
    expect(semaforoChamados(1.5, p)).toBe("verde");
    expect(semaforoChamados(2.5, p)).toBe("amarelo");
    expect(semaforoChamados(2.6, p)).toBe("vermelho");
  });

  it("tempo de produção: régua 10/13 minutos", async () => {
    const p = await lerParametros(wlp1, "2026-01-01");
    expect(semaforoTempoProducao(8.1, p)).toBe("verde");
    expect(semaforoTempoProducao(10, p)).toBe("verde");
    expect(semaforoTempoProducao(13, p)).toBe("amarelo");
    expect(semaforoTempoProducao(13.1, p)).toBe("vermelho");
  });
});
