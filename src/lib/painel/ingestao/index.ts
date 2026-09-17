// Fluxo de ingestão (seção 5.1 do /docs/BUILD_BOOK.md).
//
//   1. calcula o sha256 do arquivo; se já veio antes, devolve o envio anterior
//      sem gravar nada de novo (idempotência);
//   2. detecta o tipo pelo conteúdo (ou usa o tipo escolhido à mão);
//   3. lê, valida e grava, sempre pela chave natural de cada tabela;
//   4. o envio fica com status processado / alerta / rejeitado, e o histórico
//      mostra o que foi lido.

import crypto from "crypto";
import type { StatusUpload } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { dataDoTexto } from "../opsDate";
import { decodificarTexto, lerPlanilha } from "./planilha";
import { leitorSaiposVendas } from "./saiposVendas";
import {
  ArquivoRejeitado,
  NOME_DO_TIPO,
  type Contexto,
  type Leitor,
  type TipoDeArquivo,
} from "./tipos";

/** Leitores registrados. A ordem importa na detecção automática. */
export const LEITORES: Leitor[] = [leitorSaiposVendas];

export const TIPOS_COM_LEITOR: TipoDeArquivo[] = LEITORES.map((l) => l.kind);

export type Recebimento = {
  uploadId: string;
  nomeArquivo: string;
  status: StatusUpload;
  kind: TipoDeArquivo | null;
  rotulo: string;
  resumo: string;
  avisos: string[];
  erro: string | null;
  /** true quando o arquivo já tinha sido enviado antes e nada foi regravado. */
  jaExistia: boolean;
};

export function sha256De(bytes: Buffer): string {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

/** Monta o contexto de leitura a partir dos bytes do arquivo. */
export function montarContexto(
  nomeArquivo: string,
  bytes: Buffer,
  storeId: string,
  fusoHoras: number,
): Contexto {
  let planilha = null;
  try {
    planilha = lerPlanilha(bytes, nomeArquivo);
  } catch {
    planilha = null; // arquivo corrompido ou formato não suportado
  }
  const ehTexto = /\.(csv|tsv|txt)$/i.test(nomeArquivo);
  return {
    nomeArquivo,
    bytes,
    planilha,
    texto: ehTexto ? decodificarTexto(bytes) : null,
    storeId,
    fusoHoras,
  };
}

/** Descobre o tipo do arquivo pelo conteúdo. Null quando nenhum leitor reconhece. */
export function detectarTipo(ctx: Contexto): TipoDeArquivo | null {
  for (const leitor of LEITORES) {
    try {
      if (leitor.reconhece(ctx)) return leitor.kind;
    } catch {
      // Leitor que não conseguiu nem olhar o arquivo simplesmente não é este.
    }
  }
  return null;
}

/**
 * Recebe um arquivo: idempotente por sha256, grava os fatos e devolve o que foi
 * lido, em português, para a tela mostrar.
 */
export async function receberArquivo(opts: {
  storeId: string;
  fusoHoras: number;
  nomeArquivo: string;
  bytes: Buffer;
  /** Tipo escolhido à mão pelo usuário; quando ausente, detecta pelo conteúdo. */
  tipoManual?: TipoDeArquivo | null;
  criadoPor?: string;
}): Promise<Recebimento> {
  const sha256 = sha256De(opts.bytes);

  const anterior = await prisma.upload.findUnique({
    where: { sha256 },
    select: {
      id: true, storeId: true, kind: true, status: true, summary: true, error: true,
      store: { select: { name: true } },
    },
  });

  if (anterior) {
    const resumo = (anterior.summary as { resumo?: string } | null)?.resumo ?? "";
    const deOutraLoja = anterior.storeId !== opts.storeId;
    return {
      uploadId: anterior.id,
      nomeArquivo: opts.nomeArquivo,
      status: anterior.status,
      kind: (anterior.kind as TipoDeArquivo) || null,
      rotulo: rotuloDoTipo(anterior.kind),
      resumo: deOutraLoja
        ? `Este arquivo já foi enviado — mas para a loja ${anterior.store.name}. Confira se não trocou de loja.`
        : `Já processado antes: ${resumo || "nada de novo foi gravado"}.`,
      avisos: deOutraLoja ? ["O arquivo pertence a outra loja."] : [],
      erro: anterior.error,
      jaExistia: true,
    };
  }

  const ctx = montarContexto(opts.nomeArquivo, opts.bytes, opts.storeId, opts.fusoHoras);
  const kind = opts.tipoManual ?? detectarTipo(ctx);
  const leitor = kind ? LEITORES.find((l) => l.kind === kind) : undefined;

  const upload = await prisma.upload.create({
    data: {
      storeId: opts.storeId,
      kind: kind ?? "desconhecido",
      sha256,
      status: "recebido",
      createdBy: opts.criadoPor ?? null,
    },
    select: { id: true },
  });

  if (!leitor) {
    const erro = kind
      ? `O painel ainda não sabe ler "${NOME_DO_TIPO[kind]}". Esse tipo entra em um sprint mais à frente.`
      : "Não reconheci este arquivo. Escolha o tipo na lista e envie de novo.";
    await prisma.upload.update({ where: { id: upload.id }, data: { status: "rejeitado", error: erro } });
    return {
      uploadId: upload.id, nomeArquivo: opts.nomeArquivo, status: "rejeitado",
      kind: kind ?? null, rotulo: rotuloDoTipo(kind), resumo: "", avisos: [],
      erro, jaExistia: false,
    };
  }

  try {
    const r = await leitor.ler(ctx);
    await r.gravar(upload.id);

    const status: StatusUpload = r.avisos.length > 0 ? "alerta" : "processado";
    await prisma.upload.update({
      where: { id: upload.id },
      data: {
        status,
        summary: { resumo: r.resumo, avisos: r.avisos, numeros: r.numeros },
        periodStart: r.periodo ? dataDoTexto(r.periodo.inicio) : null,
        periodEnd: r.periodo ? dataDoTexto(r.periodo.fim) : null,
        error: null,
      },
    });

    return {
      uploadId: upload.id, nomeArquivo: opts.nomeArquivo, status,
      kind: leitor.kind, rotulo: NOME_DO_TIPO[leitor.kind],
      resumo: r.resumo, avisos: r.avisos, erro: null, jaExistia: false,
    };
  } catch (e) {
    const erro =
      e instanceof ArquivoRejeitado || e instanceof Error
        ? e.message
        : "Erro desconhecido ao ler o arquivo.";
    await prisma.upload.update({
      where: { id: upload.id },
      data: { status: "rejeitado", error: erro.slice(0, 2000) },
    });
    return {
      uploadId: upload.id, nomeArquivo: opts.nomeArquivo, status: "rejeitado",
      kind: leitor.kind, rotulo: NOME_DO_TIPO[leitor.kind], resumo: "",
      avisos: [], erro, jaExistia: false,
    };
  }
}

/**
 * Apaga um envio para que o mesmo arquivo possa ser mandado de novo.
 * Os fatos já gravados continuam no lugar: eles serão sobrescritos pela chave
 * natural quando o arquivo voltar.
 */
export async function apagarEnvio(uploadId: string, storeId: string): Promise<void> {
  await prisma.upload.deleteMany({ where: { id: uploadId, storeId } });
}

function rotuloDoTipo(kind: string | null | undefined): string {
  if (!kind || !(kind in NOME_DO_TIPO)) return "Tipo desconhecido";
  return NOME_DO_TIPO[kind as TipoDeArquivo];
}
