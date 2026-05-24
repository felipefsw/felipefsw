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
