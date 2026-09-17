// Os tipos de arquivo que o painel recebe (seção 5.2 do /docs/BUILD_BOOK.md).

import type { Planilha } from "./planilha";

export const TIPOS_DE_ARQUIVO = [
  "saipos_vendas",
  "saipos_itens",
  "saipos_fechamento",
  "saipos_tempo_producao",
  "saipos_tempo_status",
  "saipos_acerto",
  "saipos_clientes",
  "ifood_pedidos",
  "ifood_vendas",
  "ifood_cardapio",
  "ifood_anuncios_print",
  "ifood_promocoes_print",
  "cd_cupom",
  "contagem",
  "ponto",
] as const;

export type TipoDeArquivo = (typeof TIPOS_DE_ARQUIVO)[number];

/** Como cada tipo aparece na tela, em português. */
export const NOME_DO_TIPO: Record<TipoDeArquivo, string> = {
  saipos_vendas: "Saipos · Vendas por período",
  saipos_itens: "Saipos · Itens vendidos",
  saipos_fechamento: "Saipos · Fechamento do dia",
  saipos_tempo_producao: "Saipos · Tempo de produção (KDS)",
  saipos_tempo_status: "Saipos · Tempo por status",
  saipos_acerto: "Saipos · Acerto de entregadores",
  saipos_clientes: "Saipos · Clientes",
  ifood_pedidos: "iFood · Relatório de pedidos",
  ifood_vendas: "iFood · Vendas",
  ifood_cardapio: "iFood · Cardápio e funil",
  ifood_anuncios_print: "iFood · Print de anúncios",
  ifood_promocoes_print: "iFood · Print de promoções",
  cd_cupom: "CD · Cupom de entrega",
  contagem: "Contagem de estoque",
  ponto: "Ponto (entradas e saídas)",
};

/** O que o leitor recebe. */
export type Contexto = {
  nomeArquivo: string;
  bytes: Buffer;
  /** Preenchida quando o arquivo é xlsx/csv; null para PDF, imagem e texto solto. */
  planilha: Planilha | null;
  /** Conteúdo em texto, quando dá para ler (csv, txt). */
  texto: string | null;
  storeId: string;
  fusoHoras: number;
};

/** O que o leitor devolve. */
export type Resultado = {
  /** Frase curta do que foi lido: "2.033 pedidos de 07/09 a 13/09". */
  resumo: string;
  /** Período coberto pelo arquivo, em texto "AAAA-MM-DD". */
  periodo: { inicio: string; fim: string } | null;
  /** Avisos que não impedem gravar (ex.: período parcial) — viram status "alerta". */
  avisos: string[];
  /** Números conferidos, guardados no `summary` do upload. */
  numeros: Record<string, number>;
  /** Grava no banco. Só roda depois de a validação passar. */
  gravar(uploadId: string): Promise<void>;
};

export type Leitor = {
  kind: TipoDeArquivo;
  /** Reconhece o arquivo pelo conteúdo (assinaturas da seção 5.2). */
  reconhece(ctx: Contexto): boolean;
  ler(ctx: Contexto): Promise<Resultado>;
};

/** Erro de leitura que a tela mostra como motivo da rejeição. */
export class ArquivoRejeitado extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = "ArquivoRejeitado";
  }
}
