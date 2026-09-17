// Teste de aceite 2 (seção 11 do book):
// "Dia operacional: pedido às 01:30 de 14/09 pertence a 13/09."

import { describe, expect, it } from "vitest";
import {
  FUSO_LOJA_HORAS,
  diasDaSemana,
  horaOperacional,
  inicioDaSemanaOperacional,
  opsDateDe,
  somaDias,
  tipoDeDia,
} from "@/lib/painel/opsDate";

/** Monta um instante a partir do horário LOCAL da loja (Fortaleza, −3h). */
function naLoja(iso: string, hhmm: string): Date {
  const sinal = FUSO_LOJA_HORAS <= 0 ? "-" : "+";
  const hh = String(Math.abs(FUSO_LOJA_HORAS)).padStart(2, "0");
  return new Date(`${iso}T${hhmm}:00.000${sinal}${hh}:00`);
}

describe("dia operacional (06h00 às 05h59)", () => {
  it("pedido às 01:30 de 14/09 pertence ao dia 13/09", () => {
    expect(opsDateDe(naLoja("2026-09-14", "01:30"))).toBe("2026-09-13");
  });

  it("05:59 ainda é do dia anterior e 06:00 já é do dia novo", () => {
    expect(opsDateDe(naLoja("2026-09-14", "05:59"))).toBe("2026-09-13");
    expect(opsDateDe(naLoja("2026-09-14", "06:00"))).toBe("2026-09-14");
  });

  it("a noite inteira de um domingo fica no domingo", () => {
    expect(opsDateDe(naLoja("2026-09-13", "18:00"))).toBe("2026-09-13");
    expect(opsDateDe(naLoja("2026-09-13", "23:59"))).toBe("2026-09-13");
    expect(opsDateDe(naLoja("2026-09-14", "00:01"))).toBe("2026-09-13");
    expect(opsDateDe(naLoja("2026-09-14", "02:00"))).toBe("2026-09-13");
  });

  it("vira o mês e o ano sem errar", () => {
    expect(opsDateDe(naLoja("2026-10-01", "03:00"))).toBe("2026-09-30");
    expect(opsDateDe(naLoja("2027-01-01", "04:20"))).toBe("2026-12-31");
  });

  it("a hora do gráfico é a hora da loja, não a do servidor", () => {
    expect(horaOperacional(naLoja("2026-09-13", "19:36"))).toBe(19);
    expect(horaOperacional(naLoja("2026-09-14", "01:30"))).toBe(1);
  });
});

describe("semana e tipo de dia", () => {
  it("a semana da loja vai de segunda a domingo", () => {
    // 13/09/2026 é um domingo: a semana dele começa na segunda 07/09.
    expect(inicioDaSemanaOperacional("2026-09-13")).toBe("2026-09-07");
    expect(inicioDaSemanaOperacional("2026-09-07")).toBe("2026-09-07");
    expect(diasDaSemana("2026-09-07")).toEqual([
      "2026-09-07", "2026-09-08", "2026-09-09", "2026-09-10",
      "2026-09-11", "2026-09-12", "2026-09-13",
    ]);
  });

  it("classifica os quatro tipos de dia da seção 6.1", () => {
    expect(tipoDeDia("2026-09-13")).toBe("Dom");
    expect(tipoDeDia("2026-09-12")).toBe("Sáb");
    expect(tipoDeDia("2026-09-11")).toBe("Sex");
    expect(tipoDeDia("2026-09-10")).toBe("Seg–Qui");
    expect(tipoDeDia("2026-09-07")).toBe("Seg–Qui");
  });

  it("feriado se comporta como sábado", () => {
    const feriados = new Set(["2026-09-07"]); // Independência, uma segunda
    expect(tipoDeDia("2026-09-07", feriados)).toBe("Sáb");
  });

  it("soma de dias atravessa o fim do mês", () => {
    expect(somaDias("2026-08-31", 1)).toBe("2026-09-01");
    expect(somaDias("2026-03-01", -1)).toBe("2026-02-28");
  });
});
