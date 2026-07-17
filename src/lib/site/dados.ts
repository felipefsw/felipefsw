/*
  Conteúdo do site público da Rede RWP.
  Centralizado aqui para facilitar revisão de texto e futura ligação com dados reais.

  Observação: a lista de UNIDADES é uma AMOSTRA de demonstração (nível de
  bairro/cidade, sem endereço exato) para o localizador funcionar. Troque por
  dados reais quando forem integrados — o "Como chegar" abre uma busca no mapa
  pelo nome da unidade, então não dependemos de endereço fabricado.
*/

export type Marca = {
  slug: string;
  nome: string;
  logo: string; // caminho em /public/marcas
  cor: string; // cor de fundo do logo (usada em detalhes)
  descricao: string;
};

export const MARCAS: Marca[] = [
  {
    slug: "pizza-pizza",
    nome: "Pizza Pizza",
    logo: "/marcas/pizza-pizza.svg",
    cor: "#ee5a24",
    descricao:
      "A pizzaria de bairro da rede: cardápio acessível, entrega rápida e o sabor que virou rotina na vizinhança.",
  },
  {
    slug: "rei-da-pizza",
    nome: "Rei da Pizza",
    logo: "/marcas/rei.svg",
    cor: "#c0152b",
    descricao:
      "Tradição e porções generosas. A marca para quem quer pizza de família, farta e sem complicação.",
  },
  {
    slug: "we-love-pizza",
    nome: "We Love Pizza",
    logo: "/marcas/welove.svg",
    cor: "#e01e2b",
    descricao:
      "Conceito jovem e digital, forte no delivery e nos aplicativos, com combos pensados para o dia a dia.",
  },
  {
    slug: "royal-pizza",
    nome: "Royal Pizza",
    logo: "/marcas/royal.svg",
    cor: "#c0152b",
    descricao:
      "A linha premium da rede: ingredientes selecionados e receitas assinadas para ocasiões especiais.",
  },
];

export type Unidade = {
  marca: string; // slug da marca
  nome: string;
  cidade: string;
  uf: string;
  bairro: string;
  telefone?: string;
};

// Amostra de demonstração — substituir pelos dados reais das unidades.
export const UNIDADES: Unidade[] = [
  { marca: "pizza-pizza", nome: "Pizza Pizza — Aldeota", cidade: "Fortaleza", uf: "CE", bairro: "Aldeota" },
  { marca: "pizza-pizza", nome: "Pizza Pizza — Messejana", cidade: "Fortaleza", uf: "CE", bairro: "Messejana" },
  { marca: "pizza-pizza", nome: "Pizza Pizza — Parangaba", cidade: "Fortaleza", uf: "CE", bairro: "Parangaba" },
  { marca: "we-love-pizza", nome: "We Love Pizza — Cocó", cidade: "Fortaleza", uf: "CE", bairro: "Cocó" },
  { marca: "we-love-pizza", nome: "We Love Pizza — Benfica", cidade: "Fortaleza", uf: "CE", bairro: "Benfica" },
  { marca: "rei-da-pizza", nome: "Rei da Pizza — Centro", cidade: "Caucaia", uf: "CE", bairro: "Centro" },
  { marca: "rei-da-pizza", nome: "Rei da Pizza — Maracanaú", cidade: "Maracanaú", uf: "CE", bairro: "Jereissati" },
  { marca: "royal-pizza", nome: "Royal Pizza — Meireles", cidade: "Fortaleza", uf: "CE", bairro: "Meireles" },
];

export const CONTATO = {
  telefone: "(85) 92004-1420",
  telefoneLink: "+5585920041420",
  email: "contato@rederwp.com",
  razaoSocial: "RWP Comércio de Alimentos LTDA.",
  cidadeSede: "Fortaleza — CE",
};
