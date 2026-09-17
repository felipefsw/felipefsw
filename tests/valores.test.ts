// Leitura de células dos relatórios: número brasileiro e data/hora.
// Cobre o caso do teste 2 do book chegando pelo arquivo, e não pelo código.

import { describe, expect, it } from "vitest";
import { dataSimples, instante, numero, simOuNao } from "@/lib/painel/ingestao/valores";
import { opsDateDe } from "@/lib/painel/opsDate";

describe("números no padrão brasileiro", () => {
  it("lê milhar com ponto e decimal com vírgula", () => {
    expect(numero("1.234,56")).toBe(1234.56);
    expect(numero("613.154,00")).toBe(613154);
    expect(numero("R$ 1.234,56")).toBe(1234.56);
    expect(numero("12,1%")).toBe(12.1);
  });

  it("lê também o padrão americano e número puro", () => {
    expect(numero("1234.56")).toBe(1234.56);
    expect(numero(1234.56)).toBe(1234.56);
    expect(numero("1,234.56")).toBe(1234.56);
  });

  it("não confunde milhar com decimal quando só há ponto", () => {
    expect(numero("1.234")).toBe(1234); // milhar
    expect(numero("1.5")).toBe(1.5); // decimal
    expect(numero("10.205")).toBe(10205); // pedidos do teste de aceite
  });

  it("entende negativo entre parênteses e devolve null no que não é número", () => {
    expect(numero("(1.234,56)")).toBe(-1234.56);
    expect(numero("-8,50")).toBe(-8.5);
    expect(numero("")).toBeNull();
    expect(numero(null)).toBeNull();
    expect(numero("Entregador")).toBeNull();
  });

  it("'S' de cancelado vira verdadeiro", () => {
    expect(simOuNao("S")).toBe(true);
    expect(simOuNao("N")).toBe(false);
    expect(simOuNao("")).toBe(false);
  });
});

describe("data e hora dos relatórios", () => {
  it("lê o formato do Saipos e devolve o instante certo", () => {
    const d = instante("14/09/2026 01:30");
    // 01:30 em Fortaleza (−3h) é 04:30 UTC.
    expect(d?.toISOString()).toBe("2026-09-14T04:30:00.000Z");
  });

  it("o pedido da 01:30 de 14/09 cai no dia operacional 13/09", () => {
    expect(opsDateDe(instante("14/09/2026 01:30")!)).toBe("2026-09-13");
    expect(opsDateDe(instante("13/09/2026 19:36")!)).toBe("2026-09-13");
    expect(opsDateDe(instante("14/09/2026 06:00")!)).toBe("2026-09-14");
  });

  it("lê data serial do Excel sem depender do fuso do servidor", () => {
    // 46279 = 14/09/2026; + 1,5/24 de dia = 01:30.
    expect(dataSimples(46279)).toBe("2026-09-14");
    expect(opsDateDe(instante(46279 + 1.5 / 24)!)).toBe("2026-09-13");
  });

  it("aceita o formato ISO e recusa data inexistente", () => {
    expect(dataSimples("2026-09-14")).toBe("2026-09-14");
    expect(dataSimples("31/02/2026")).toBeNull();
    expect(dataSimples("qualquer coisa")).toBeNull();
    expect(instante("")).toBeNull();
  });
});
