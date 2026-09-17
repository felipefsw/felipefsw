// Teste de aceite 1 (seção 11 do book): "Ingestão idempotente e mapeamento de
// colunas (seção 5)". O arquivo é montado aqui com o layout que a seção 5.2/5.3
// descreve; quando chegar um export de verdade, ele entra em /docs/samples/ e
// este teste passa a rodar contra ele também.

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";
import { detectarTipo, montarContexto, receberArquivo, sha256De } from "@/lib/painel/ingestao";
import { FUSO_LOJA_HORAS } from "@/lib/painel/opsDate";

let storeId = "";

const CABECALHO = [
  "Número do pedido", "Id do pedido no parceiro", "Data da venda", "Canal de venda",
  "Tipo do pedido", "Itens", "Entrega", "Acréscimo", "Desconto", "Total",
  "Valor Entregador", "Entregador", "Bairro", "Está cancelado",
];

type Venda = {
  numero: number; id: string; data: string; canal: string; tipo: string;
  itens: string; entrega: string; acrescimo: string; desconto: string; total: string;
  valorEntregador: string; entregador: string; bairro: string; cancelado: string;
};

function venda(p: Partial<Venda> & { id: string; data: string; total: string }): Venda {
  return {
    numero: 1, canal: "iFood", tipo: "D", itens: p.total, entrega: "0,00",
    acrescimo: "0,00", desconto: "0,00", valorEntregador: "8,00",
    entregador: "Joao", bairro: "Aldeota", cancelado: "N", ...p,
  };
}

/** Monta um .xlsx igual ao export do Saipos, com título antes do cabeçalho. */
function planilhaSaipos(vendas: Venda[], { comTitulo = true } = {}): Buffer {
  const linhas: (string | number)[][] = [];
  if (comTitulo) {
    linhas.push(["Vendas por período"], ["Loja: We Love Pizza 1"], []);
  }
  linhas.push(CABECALHO);
  for (const v of vendas) {
    linhas.push([
      v.numero, v.id, v.data, v.canal, v.tipo, v.itens, v.entrega, v.acrescimo,
      v.desconto, v.total, v.valorEntregador, v.entregador, v.bairro, v.cancelado,
    ]);
  }
  linhas.push(["Total geral", "", "", "", "", "", "", "", "", ""]); // rodapé sem data

  const ws = XLSX.utils.aoa_to_sheet(linhas);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Vendas");
  return Buffer.from(XLSX.write(wb, { type: "buffer", bookType: "xlsx" }));
}

const TRES_VENDAS = [
  venda({ id: "A1", data: "13/09/2026 19:36", total: "62,50" }),
  venda({ id: "A2", data: "14/09/2026 01:30", total: "80,00", canal: "Balcão", tipo: "B" }),
  venda({ id: "A3", data: "14/09/2026 20:00", total: "45,00", cancelado: "S" }),
];

async function enviar(bytes: Buffer, nome = "vendas.xlsx") {
  return receberArquivo({ storeId, fusoHoras: FUSO_LOJA_HORAS, nomeArquivo: nome, bytes });
}

async function limpar() {
  await prisma.order.deleteMany({ where: { storeId } });
  await prisma.upload.deleteMany({ where: { storeId } });
}

beforeAll(async () => {
  const loja = await prisma.store.findFirst({ where: { name: { contains: "We Love" } } });
  if (!loja) throw new Error("rode `npx tsx prisma/seed.painel.ts` antes dos testes");
  storeId = loja.id;
  await limpar();
});

afterAll(async () => {
  await limpar();
  await prisma.$disconnect();
});

describe("detecção pelo conteúdo (seção 5.2)", () => {
  it("reconhece o Vendas por período pelas colunas, mesmo com título antes", () => {
    const ctx = montarContexto("qualquer-nome.xlsx", planilhaSaipos(TRES_VENDAS), storeId, FUSO_LOJA_HORAS);
    expect(detectarTipo(ctx)).toBe("saipos_vendas");
  });

  it("não reconhece uma planilha qualquer", () => {
    const ws = XLSX.utils.aoa_to_sheet([["Nome", "Idade"], ["Ana", 30]]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "P");
    const bytes = Buffer.from(XLSX.write(wb, { type: "buffer", bookType: "xlsx" }));
    const ctx = montarContexto("p.xlsx", bytes, storeId, FUSO_LOJA_HORAS);
    expect(detectarTipo(ctx)).toBeNull();
  });
});

describe("mapeamento das colunas (seção 5.3)", () => {
  it("grava os pedidos com ops_date, canal, tipo e valores certos", async () => {
    const r = await enviar(planilhaSaipos(TRES_VENDAS));
    expect(r.status).toBe("alerta"); // o rodapé sem data vira aviso
    expect(r.kind).toBe("saipos_vendas");
    expect(r.resumo).toContain("2 pedidos válidos");

    const pedidos = await prisma.order.findMany({ where: { storeId }, orderBy: { soldAt: "asc" } });
    expect(pedidos).toHaveLength(3); // o cancelado também é gravado

    const [p1, p2, p3] = pedidos;
    // A venda da 01:30 de 14/09 pertence ao dia operacional 13/09.
    expect(p1.opsDate.toISOString().slice(0, 10)).toBe("2026-09-13");
    expect(p2.opsDate.toISOString().slice(0, 10)).toBe("2026-09-13");
    expect(p3.opsDate.toISOString().slice(0, 10)).toBe("2026-09-14");

    expect(p1.channel).toBe("iFood");
    expect(p1.orderType).toBe("D");
    expect(Number(p1.total)).toBe(62.5);
    expect(Number(p1.courierPay)).toBe(8);
    expect(p1.district).toBe("Aldeota");
    expect(p1.cancelled).toBe(false);

    expect(p2.orderType).toBe("B");
    expect(p3.cancelled).toBe(true);
  });

  it("o resumo conta só os válidos e soma só o que não foi cancelado", async () => {
    const upload = await prisma.upload.findFirst({ where: { storeId }, orderBy: { createdAt: "desc" } });
    const s = upload?.summary as { numeros: Record<string, number> };
    expect(s.numeros.pedidos_validos).toBe(2);
    expect(s.numeros.pedidos_cancelados).toBe(1);
    expect(s.numeros.total_faturado).toBe(142.5);
  });

  it("guarda o período que o arquivo cobre", async () => {
    const upload = await prisma.upload.findFirst({ where: { storeId }, orderBy: { createdAt: "desc" } });
    expect(upload?.periodStart?.toISOString().slice(0, 10)).toBe("2026-09-13");
    expect(upload?.periodEnd?.toISOString().slice(0, 10)).toBe("2026-09-14");
  });
});

describe("idempotência (seção 1 do book)", () => {
  it("reenviar o mesmo arquivo não duplica nem regrava", async () => {
    const bytes = planilhaSaipos(TRES_VENDAS);
    const antes = await prisma.order.count({ where: { storeId } });

    const r = await enviar(bytes, "outro-nome.xlsx");
    expect(r.jaExistia).toBe(true);
    expect(r.resumo).toContain("Já processado antes");

    expect(await prisma.order.count({ where: { storeId } })).toBe(antes);
    expect(await prisma.upload.count({ where: { storeId } })).toBe(1);
  });

  it("um arquivo diferente com os mesmos pedidos corrige em vez de duplicar", async () => {
    const corrigido = [...TRES_VENDAS];
    corrigido[0] = venda({ id: "A1", data: "13/09/2026 19:36", total: "70,00" });

    const r = await enviar(planilhaSaipos(corrigido));
    expect(r.jaExistia).toBe(false);

    const pedidos = await prisma.order.findMany({ where: { storeId } });
    expect(pedidos).toHaveLength(3); // continua 3, não 6
    const a1 = pedidos.find((p) => p.externalId === "A1");
    expect(Number(a1?.total)).toBe(70); // valor corrigido
  });

  it("o mesmo pedido repetido dentro do arquivo entra uma vez só", async () => {
    await limpar();
    const repetido = [TRES_VENDAS[0], TRES_VENDAS[0], TRES_VENDAS[1]];
    const r = await enviar(planilhaSaipos(repetido));
    expect(r.avisos.join(" ")).toContain("repetidos");
    expect(await prisma.order.count({ where: { storeId } })).toBe(2);
  });

  it("dois arquivos diferentes têm sha256 diferente", () => {
    expect(sha256De(planilhaSaipos(TRES_VENDAS))).not.toBe(sha256De(planilhaSaipos([TRES_VENDAS[0]])));
  });
});

describe("arquivo que não dá para ler", () => {
  it("planilha sem as colunas do Saipos é rejeitada com o motivo", async () => {
    await limpar();
    const ws = XLSX.utils.aoa_to_sheet([["Nome", "Idade"], ["Ana", 30]]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "P");
    const bytes = Buffer.from(XLSX.write(wb, { type: "buffer", bookType: "xlsx" }));

    const r = await enviar(bytes, "lista.xlsx");
    expect(r.status).toBe("rejeitado");
    expect(r.erro).toContain("Não reconheci este arquivo");
    // Mesmo rejeitado, fica no histórico.
    expect(await prisma.upload.count({ where: { storeId } })).toBe(1);
  });

  it("arquivo com cabeçalho certo mas sem linhas é rejeitado", async () => {
    await limpar();
    const r = await enviar(planilhaSaipos([]));
    expect(r.status).toBe("rejeitado");
    expect(r.erro).toContain("nenhuma linha de pedido");
  });
});
