// Limite simples por chave (ex.: IP), em memória. É um obstáculo básico contra
// volume/bots — em serverless reinicia a cada cold start e é por instância, então
// serve junto com o honeypot, não como proteção absoluta.
const baldes = new Map<string, number[]>();

export function limitePassou(chave: string, max: number, janelaMs: number): boolean {
  const agora = Date.now();
  const recentes = (baldes.get(chave) ?? []).filter((t) => agora - t < janelaMs);
  if (recentes.length >= max) {
    baldes.set(chave, recentes);
    return false;
  }
  recentes.push(agora);
  baldes.set(chave, recentes);
  return true;
}
