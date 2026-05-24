// Detecta a marca da loja pelo nome e mapeia para o selo (estilo iFood).
export type Marca = { slug: string; label: string };

export function marcaDeLoja(nome: string): Marca | null {
  const n = nome.toLowerCase();
  if (n.includes("pizza pizza")) return { slug: "pizza-pizza", label: "Pizza Pizza" };
  if (n.includes("royal")) return { slug: "royal", label: "Royal Pizza" };
  if (n.includes("rei da pizza") || n.includes("rei ") || n.includes("reizão"))
    return { slug: "rei", label: "Rei da Pizza" };
  if (n.includes("we love") || n.includes("we pizza") || n.startsWith("wlp"))
    return { slug: "welove", label: "We Love Pizza" };
  return null;
}

export function seloDaLoja(nome: string): { src: string; label: string } {
  const m = marcaDeLoja(nome);
  return m ? { src: `/marcas/${m.slug}.svg`, label: m.label } : { src: "/icon.svg", label: "RWP" };
}

// Agrupa a loja por marca, para exibir em quadrantes.
export function grupoDaLoja(nome: string): { key: string; label: string; ordem: number } {
  const m = marcaDeLoja(nome);
  if (!m) return { key: "rwp", label: "RWP / Outras", ordem: 9 };
  const map: Record<string, { label: string; ordem: number }> = {
    "pizza-pizza": { label: "PP — Pizza Pizza", ordem: 1 },
    welove: { label: "WLP — We Love Pizza", ordem: 2 },
    royal: { label: "Royal Pizza", ordem: 3 },
    rei: { label: "Rei da Pizza", ordem: 4 },
  };
  const g = map[m.slug] ?? { label: m.label, ordem: 8 };
  return { key: m.slug, label: g.label, ordem: g.ordem };
}
