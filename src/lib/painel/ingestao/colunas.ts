// Casamento de colunas dos relatórios (seção 5 do book).
//
// Os exports do Saipos e do iFood mudam de acento, de maiúscula e às vezes de
// palavra. Aqui a busca é tolerante a isso, mas NUNCA adivinha: se uma coluna
// obrigatória não aparece, o arquivo é rejeitado com uma mensagem que diz qual
// coluna faltou e quais vieram no arquivo.

import { normalizarTexto } from "./planilha";
import type { Celula } from "./valores";
import { texto } from "./valores";

export class ColunaFaltando extends Error {
  constructor(
    readonly procurada: string,
    readonly encontradas: string[],
  ) {
    super(
      `Não achei a coluna "${procurada}" no arquivo. ` +
        `As colunas que vieram foram: ${encontradas.filter(Boolean).join(", ") || "(nenhuma)"}.`,
    );
    this.name = "ColunaFaltando";
  }
}

/** Índice da primeira coluna cujo título bate com algum dos nomes. -1 se não achar. */
export function acharColuna(cabecalho: Celula[], nomes: string[]): number {
  const titulos = cabecalho.map((c) => normalizarTexto(texto(c)));
  const alvos = nomes.map(normalizarTexto);

  // 1ª volta: título igual. 2ª volta: título que contém o nome procurado.
  for (const alvo of alvos) {
    const i = titulos.indexOf(alvo);
    if (i >= 0) return i;
  }
  for (const alvo of alvos) {
    const i = titulos.findIndex((t) => t !== "" && t.includes(alvo));
    if (i >= 0) return i;
  }
  return -1;
}

/**
 * Acha a linha de cabeçalho: a primeira linha (nas 20 iniciais) que contenha
 * todas as colunas obrigatórias. Exports costumam ter título e filtros antes.
 */
export function acharCabecalho(
  linhas: Celula[][],
  obrigatorias: string[][],
  limite = 20,
): number {
  const ate = Math.min(linhas.length, limite);
  for (let i = 0; i < ate; i++) {
    if (obrigatorias.every((nomes) => acharColuna(linhas[i], nomes) >= 0)) return i;
  }
  return -1;
}

/** Leitor de linha já amarrado ao cabeçalho do arquivo. */
export class Colunas {
  private readonly indices = new Map<string, number>();

  constructor(private readonly cabecalho: Celula[]) {}

  /** Registra uma coluna obrigatória. Explode com mensagem clara se faltar. */
  exige(apelido: string, nomes: string[]): this {
    const i = acharColuna(this.cabecalho, nomes);
    if (i < 0) throw new ColunaFaltando(nomes[0], this.titulos());
    this.indices.set(apelido, i);
    return this;
  }

  /** Registra uma coluna opcional. Se faltar, a leitura devolve null. */
  opcional(apelido: string, nomes: string[]): this {
    const i = acharColuna(this.cabecalho, nomes);
    if (i >= 0) this.indices.set(apelido, i);
    return this;
  }

  tem(apelido: string): boolean {
    return this.indices.has(apelido);
  }

  /** Valor bruto da célula daquela coluna, na linha informada. */
  de(linha: Celula[], apelido: string): Celula {
    const i = this.indices.get(apelido);
    return i === undefined ? null : linha[i];
  }

  titulos(): string[] {
    return this.cabecalho.map((c) => texto(c));
  }
}
