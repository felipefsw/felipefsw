// Leitura determinística de planilhas e textos enviados (seção 5.1 do book):
// xlsx/csv não passam por IA — são lidos aqui, célula por célula.

import * as XLSX from "xlsx";
import type { Celula } from "./valores";

export type Aba = { nome: string; linhas: Celula[][] };
export type Planilha = { abas: Aba[] };

/** Decodifica bytes de texto: tenta UTF-8 e cai para Windows-1252 (comum nos exports). */
export function decodificarTexto(bytes: Buffer): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return new TextDecoder("windows-1252").decode(bytes);
  }
}

/** Descobre se o CSV usa ponto e vírgula, vírgula ou tabulação. */
export function separadorDoCsv(texto: string): string {
  const primeiraLinha = texto.split(/\r?\n/, 1)[0] ?? "";
  const candidatos = [";", ",", "\t", "|"];
  let melhor = ";";
  let maior = -1;
  for (const c of candidatos) {
    const n = primeiraLinha.split(c).length - 1;
    if (n > maior) {
      maior = n;
      melhor = c;
    }
  }
  return melhor;
}

function ehPlanilhaBinaria(nome: string): boolean {
  return /\.(xlsx|xlsm|xlsb|xls|ods)$/i.test(nome);
}

function ehTextoTabular(nome: string): boolean {
  return /\.(csv|tsv|txt)$/i.test(nome);
}

/**
 * Lê o arquivo como planilha. Devolve null quando não é planilha nem texto
 * tabular (aí o arquivo segue para a extração por IA, na seção 5.1 do book).
 */
export function lerPlanilha(bytes: Buffer, nomeArquivo: string): Planilha | null {
  const binaria = ehPlanilhaBinaria(nomeArquivo);
  const tabular = ehTextoTabular(nomeArquivo);
  if (!binaria && !tabular) return null;

  const livro = binaria
    ? XLSX.read(bytes, { type: "buffer", raw: true, cellDates: false })
    : XLSX.read(decodificarTexto(bytes), {
        type: "string",
        raw: true,
        cellDates: false,
        FS: separadorDoCsv(decodificarTexto(bytes)),
      });

  const abas: Aba[] = livro.SheetNames.map((nome) => {
    const ws = livro.Sheets[nome];
    const linhas = XLSX.utils.sheet_to_json<Celula[]>(ws, {
      header: 1,
      raw: true,
      blankrows: false,
      defval: null,
    });
    return { nome, linhas };
  });

  return { abas };
}

/** A primeira aba com conteúdo, ou null. */
export function abaPrincipal(p: Planilha | null): Aba | null {
  if (!p) return null;
  return p.abas.find((a) => a.linhas.length > 0) ?? null;
}

/** Acha uma aba pelo nome (ignorando acento e maiúscula). */
export function acharAba(p: Planilha | null, nome: string): Aba | null {
  if (!p) return null;
  const alvo = normalizarTexto(nome);
  return p.abas.find((a) => normalizarTexto(a.nome) === alvo) ?? null;
}

/** Tira acento, pontuação e espaço sobrando — base de toda comparação de texto. */
export function normalizarTexto(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[.:]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
