// Saipos · Vendas por período → tabela `orders` (seção 5.3 do book).
//
// Mapeamento do book, literal:
//   Data da venda (dd/mm/aaaa HH:MM) -> sold_at
//   ops_date = date(sold_at − 6h)
//   Canal de venda -> channel;  Tipo do pedido (D/B) -> order_type
//   Itens, Entrega, Acréscimo, Desconto, Total, Valor Entregador, Entregador, Bairro
//   Está cancelado = 'S' -> cancelled
//   external_id = Id do pedido no parceiro, ou Número do pedido no parceiro + data
//
// Cancelados são GRAVADOS com cancelled = true (as views é que os excluem),
// porque a taxa de cancelamento da seção 6.3 precisa deles.

import { Prisma } from "@prisma/client";
import { opsDateDe } from "../opsDate";
import { Colunas, acharCabecalho } from "./colunas";
import { abaPrincipal, normalizarTexto } from "./planilha";
import { ArquivoRejeitado, type Leitor, type Resultado } from "./tipos";
import { gravarEmLotes, sqlData, sqlEnum, sqlNumero, sqlTexto } from "./gravar";
import { inteiro, instante, numero, simOuNao, texto } from "./valores";

/** Colunas que precisam existir para o arquivo ser "Vendas por período". */
const OBRIGATORIAS = [
  ["Data da venda", "Data venda"],
  ["Total"],
  ["Está cancelado", "Cancelado"],
  ["Tipo do pedido", "Tipo pedido"],
  ["Canal de venda", "Canal"],
];

export const leitorSaiposVendas: Leitor = {
  kind: "saipos_vendas",

  reconhece(ctx) {
    const aba = abaPrincipal(ctx.planilha);
    if (!aba) return false;
    return acharCabecalho(aba.linhas, OBRIGATORIAS) >= 0;
  },

  async ler(ctx): Promise<Resultado> {
    const aba = abaPrincipal(ctx.planilha);
    if (!aba) throw new ArquivoRejeitado("Não consegui abrir o arquivo como planilha.");

    const iCabecalho = acharCabecalho(aba.linhas, OBRIGATORIAS);
    if (iCabecalho < 0) {
      throw new ArquivoRejeitado(
        "Este arquivo não parece o Vendas por período do Saipos: " +
          "faltam as colunas Data da venda, Total, Canal de venda, Tipo do pedido e Está cancelado.",
      );
    }

    const col = new Colunas(aba.linhas[iCabecalho])
      .exige("dataVenda", ["Data da venda", "Data venda"])
      .exige("total", ["Total"])
      .exige("cancelado", ["Está cancelado", "Cancelado"])
      .exige("tipoPedido", ["Tipo do pedido", "Tipo pedido"])
      .exige("canal", ["Canal de venda", "Canal"])
      .opcional("itens", ["Itens"])
      .opcional("entrega", ["Entrega", "Taxa de entrega"])
      .opcional("acrescimo", ["Acréscimo", "Acrescimo"])
      .opcional("desconto", ["Desconto"])
      .opcional("valorEntregador", ["Valor Entregador", "Valor do entregador"])
      .opcional("entregador", ["Entregador"])
      .opcional("bairro", ["Bairro"])
      .opcional("idParceiro", ["Id do pedido no parceiro", "Id pedido parceiro"])
      .opcional("numeroParceiro", ["Número do pedido no parceiro", "Numero do pedido no parceiro"])
      .opcional("numeroPedido", ["Número do pedido", "Numero do pedido", "Pedido"]);

    if (!col.tem("idParceiro") && !col.tem("numeroParceiro") && !col.tem("numeroPedido")) {
      throw new ArquivoRejeitado(
        "O arquivo não tem nenhuma coluna de identificação do pedido " +
          "(Id do pedido no parceiro, Número do pedido no parceiro ou Número do pedido). " +
          "Sem isso não dá para garantir que reenviar o relatório não duplique os pedidos.",
      );
    }

    type Pedido = {
      externalId: string;
      soldAt: Date;
      opsDate: string;
      channel: string | null;
      orderType: "D" | "B" | null;
      itemsValue: number | null;
      deliveryFee: number | null;
      surcharge: number | null;
      discount: number | null;
      total: number | null;
      courierPay: number | null;
      courierName: string | null;
      district: string | null;
      cancelled: boolean;
    };

    const pedidos: Pedido[] = [];
    const vistos = new Set<string>();
    let semData = 0;
    let duplicadosNoArquivo = 0;

    for (let i = iCabecalho + 1; i < aba.linhas.length; i++) {
      const linha = aba.linhas[i];
      if (!linha || linha.every((c) => c === null || c === undefined || c === "")) continue;

      const soldAt = instante(col.de(linha, "dataVenda"), ctx.fusoHoras);
      if (!soldAt) {
        // Linha de rodapé ("Total geral") ou data ilegível: conta e segue.
        semData++;
        continue;
      }

      const opsDate = opsDateDe(soldAt, ctx.fusoHoras);
      const externalId = identificar(col, linha, soldAt);

      // O mesmo pedido repetido dentro do próprio arquivo: fica só o primeiro,
      // senão o ON CONFLICT reclama de atualizar a mesma linha duas vezes.
      const chave = `${externalId}|${soldAt.toISOString()}`;
      if (vistos.has(chave)) {
        duplicadosNoArquivo++;
        continue;
      }
      vistos.add(chave);

      pedidos.push({
        externalId,
        soldAt,
        opsDate,
        channel: texto(col.de(linha, "canal")) || null,
        orderType: tipoDoPedido(col.de(linha, "tipoPedido")),
        itemsValue: numero(col.de(linha, "itens")),
        deliveryFee: numero(col.de(linha, "entrega")),
        surcharge: numero(col.de(linha, "acrescimo")),
        discount: numero(col.de(linha, "desconto")),
        total: numero(col.de(linha, "total")),
        courierPay: numero(col.de(linha, "valorEntregador")),
        courierName: texto(col.de(linha, "entregador")) || null,
        district: texto(col.de(linha, "bairro")) || null,
        cancelled: simOuNao(col.de(linha, "cancelado")),
      });
    }

    if (pedidos.length === 0) {
      throw new ArquivoRejeitado("O arquivo tem o cabeçalho certo, mas nenhuma linha de pedido.");
    }

    const datas = pedidos.map((p) => p.opsDate).sort();
    const periodo = { inicio: datas[0], fim: datas[datas.length - 1] };

    const validos = pedidos.filter((p) => !p.cancelled);
    const cancelados = pedidos.length - validos.length;
    const faturamento = validos.reduce((s, p) => s + (p.total ?? 0), 0);

    const avisos: string[] = [];
    if (semData > 0) {
      avisos.push(`${semData} linha(s) sem data de venda foram ignoradas (costuma ser o rodapé de total).`);
    }
    if (duplicadosNoArquivo > 0) {
      avisos.push(`${duplicadosNoArquivo} pedido(s) apareciam repetidos dentro do próprio arquivo.`);
    }

    return {
      resumo:
        `${validos.length.toLocaleString("pt-BR")} pedidos válidos ` +
        `de ${formatarBR(periodo.inicio)} a ${formatarBR(periodo.fim)} · ` +
        `${faturamento.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}` +
        (cancelados > 0 ? ` · ${cancelados} cancelado(s)` : ""),
      periodo,
      avisos,
      numeros: {
        pedidos_validos: validos.length,
        pedidos_cancelados: cancelados,
        total_faturado: Math.round(faturamento * 100) / 100,
      },

      async gravar(uploadId: string) {
        const valores = pedidos.map(
          (p) => Prisma.sql`(
            ${ctx.storeId}::uuid,
            ${p.externalId}::text,
            ${p.soldAt}::timestamptz,
            ${sqlData(p.opsDate)},
            ${sqlTexto(p.channel)},
            ${sqlEnum(p.orderType, "tipo_pedido")},
            ${sqlNumero(p.itemsValue)},
            ${sqlNumero(p.deliveryFee)},
            ${sqlNumero(p.surcharge)},
            ${sqlNumero(p.discount)},
            ${sqlNumero(p.total)},
            ${sqlNumero(p.courierPay)},
            ${sqlTexto(p.courierName)},
            ${sqlTexto(p.district)},
            ${p.cancelled}::boolean,
            ${uploadId}::uuid,
            now()
          )`,
        );

        await gravarEmLotes(
          valores,
          (lote) => Prisma.sql`
            INSERT INTO orders (
              store_id, external_id, sold_at, ops_date, channel, order_type,
              items_value, delivery_fee, surcharge, discount, total,
              courier_pay, courier_name, district, cancelled, upload_id, updated_at
            )
            VALUES ${lote}
            ON CONFLICT (store_id, external_id, sold_at) DO UPDATE SET
              ops_date     = EXCLUDED.ops_date,
              channel      = EXCLUDED.channel,
              order_type   = EXCLUDED.order_type,
              items_value  = EXCLUDED.items_value,
              delivery_fee = EXCLUDED.delivery_fee,
              surcharge    = EXCLUDED.surcharge,
              discount     = EXCLUDED.discount,
              total        = EXCLUDED.total,
              courier_pay  = EXCLUDED.courier_pay,
              courier_name = EXCLUDED.courier_name,
              district     = EXCLUDED.district,
              cancelled    = EXCLUDED.cancelled,
              upload_id    = EXCLUDED.upload_id,
              updated_at   = now()
          `,
        );
      },
    };
  },
};

/**
 * Identificação do pedido, na ordem que o book manda: Id do parceiro; senão o
 * Número do parceiro junto com a data; senão o número do pedido com a data.
 */
function identificar(col: Colunas, linha: Parameters<Colunas["de"]>[0], soldAt: Date): string {
  const id = texto(col.de(linha, "idParceiro"));
  if (id) return id;

  const dia = soldAt.toISOString().slice(0, 10);
  const numeroParceiro = texto(col.de(linha, "numeroParceiro"));
  if (numeroParceiro) return `${numeroParceiro}@${dia}`;

  const n = inteiro(col.de(linha, "numeroPedido"));
  return `${n ?? texto(col.de(linha, "numeroPedido"))}@${dia}`;
}

/** "D" = delivery, "B" = balcão. Qualquer outra coisa fica em branco. */
function tipoDoPedido(c: Parameters<typeof texto>[0]): "D" | "B" | null {
  const t = normalizarTexto(texto(c));
  if (t === "d" || t.startsWith("deliver") || t.startsWith("entrega")) return "D";
  if (t === "b" || t.startsWith("balcao") || t.startsWith("mesa")) return "B";
  return null;
}

function formatarBR(iso: string): string {
  const [a, m, d] = iso.split("-");
  return `${d}/${m}/${a}`;
}
