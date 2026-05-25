// Só mostramos a nota (de loja ou de diarista) depois de um mínimo de
// avaliações, para a média não ser injusta com poucos dados.
export const MIN_AVALIACOES = 10;

// Média pública: devolve a média apenas quando há avaliações suficientes.
export function notaPublica(soma: number, qtd: number): number | null {
  return qtd >= MIN_AVALIACOES ? soma / qtd : null;
}
