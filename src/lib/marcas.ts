// Detecta a marca da loja pelo nome e mapeia para o selo (estilo iFood).
export type Marca = { slug: string; label: string };

export function marcaDeLoja(nome: string): Marca | null {
  const n = nome.toLowerCase().trim();
  if (n === "cd" || n.startsWith("cd ") || n.includes("centro de distribui"))
    return { slug: "cd", label: "CD" };
  if (n.includes("pizza pizza")) return { slug: "pizza-pizza", label: "Pizza Pizza" };
  if (n.includes("royal")) return { slug: "royal", label: "Royal Pizza" };
  if (n.includes("rei da pizza") || n.includes("rei ") || n.includes("reizão"))
    return { slug: "rei", label: "Rei da Pizza" };
  if (n.includes("we love") || n.includes("we pizza") || n.startsWith("wlp"))
    return { slug: "welove", label: "We Love Pizza" };
  return null;
}

// Classes Tailwind por marca (fundo + texto). Pra cards quadrados coloridos.
export function coresDaMarca(nome: string): { bg: string; text: string; sub: string; selo: string } {
  const m = marcaDeLoja(nome);
  switch (m?.slug) {
    case "rei":
      return { bg: "bg-yellow-400", text: "text-gray-900", sub: "text-gray-800", selo: "bg-white/70" };
    case "welove":
      return { bg: "bg-red-600", text: "text-white", sub: "text-red-50", selo: "bg-white/20" };
    case "pizza-pizza":
      return { bg: "bg-orange-500", text: "text-white", sub: "text-orange-50", selo: "bg-white/20" };
    case "royal":
      return { bg: "bg-gray-500", text: "text-white", sub: "text-gray-100", selo: "bg-white/20" };
    case "cd":
      return { bg: "bg-black", text: "text-white", sub: "text-gray-300", selo: "bg-white/15" };
    default:
      return { bg: "bg-white", text: "text-gray-900", sub: "text-gray-500", selo: "bg-gray-100" };
  }
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
    cd: { label: "CD — Centro de Distribuição", ordem: 5 },
  };
  const g = map[m.slug] ?? { label: m.label, ordem: 8 };
  return { key: m.slug, label: g.label, ordem: g.ordem };
}
