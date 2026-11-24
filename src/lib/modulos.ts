// Catálogo de módulos da migração rederwp → felipefsw.
// "diaristas" fica sempre ativo (produto atual). Os demais só aparecem se
// ModuloFlag.ativo=true no banco ou se MODULES_ENABLED listar o slug.

export type ModuloSlug =
  | "diaristas"
  | "mestres"
  | "rh"
  | "ponto"
  | "tecnologia"
  | "operacional"
  | "nutricao"
  | "cd"
  | "frotas"
  | "financeiro"
  | "espacos"
  | "marketing"
  | "recepcao";

export type ModuloDef = {
  slug: ModuloSlug;
  titulo: string;
  descricao: string;
  fase: number;
  href: string;
  /** Sempre ligado — núcleo do felipefsw. */
  sempreAtivo?: boolean;
};

export const MODULOS: ModuloDef[] = [
  {
    slug: "diaristas",
    titulo: "Diaristas",
    descricao: "Escala, pedidos, banco por loja, check-in e pagamentos Pix",
    fase: 1,
    href: "/",
    sempreAtivo: true,
  },
  {
    slug: "mestres",
    titulo: "Cadastros mestres",
    descricao: "Lojas unificadas, usuários e permissões (roles_acess)",
    fase: 2,
    href: "/modulos/mestres",
  },
  {
    slug: "rh",
    titulo: "RH / DP",
    descricao: "Funcionários, documentos, fardamento, seletivos, portal",
    fase: 3,
    href: "/modulos/rh",
  },
  {
    slug: "ponto",
    titulo: "Ponto",
    descricao: "Cartão, banco de horas, relógios, Fortes, ajustes",
    fase: 4,
    href: "/modulos/ponto",
  },
  {
    slug: "tecnologia",
    titulo: "Tecnologia",
    descricao: "Chamados, OS, inventário TI, deslocamentos",
    fase: 5,
    href: "/modulos/tecnologia",
  },
  {
    slug: "operacional",
    titulo: "Operacional",
    descricao: "Tarefas, checking, reclamações, gestão iFood",
    fase: 6,
    href: "/modulos/operacional",
  },
  {
    slug: "nutricao",
    titulo: "Nutrição",
    descricao: "Inspeções, planos de ação, relatórios de lojas",
    fase: 7,
    href: "/modulos/nutricao",
  },
  {
    slug: "cd",
    titulo: "Centro de Distribuição",
    descricao: "Estoque, pedidos, KDS, corridas, compras",
    fase: 8,
    href: "/modulos/cd",
  },
  {
    slug: "frotas",
    titulo: "Frotas",
    descricao: "Veículos, mapa, checklist do motorista",
    fase: 8,
    href: "/modulos/frotas",
  },
  {
    slug: "financeiro",
    titulo: "Financeiro",
    descricao: "Caixa, boletos, conciliações, NF-e",
    fase: 9,
    href: "/modulos/financeiro",
  },
  {
    slug: "espacos",
    titulo: "Espaços de trabalho",
    descricao: "Kanban, tarefas e agent API",
    fase: 10,
    href: "/modulos/espacos",
  },
  {
    slug: "marketing",
    titulo: "Marketing",
    descricao: "Campanhas, cupons CW, shoping, TVs",
    fase: 10,
    href: "/modulos/marketing",
  },
  {
    slug: "recepcao",
    titulo: "Recepção",
    descricao: "Entradas, salas, ramais",
    fase: 10,
    href: "/modulos/recepcao",
  },
];

/** Slugs liberados via env (ex.: MODULES_ENABLED=rh,ponto). */
export function modulosViaEnv(): Set<string> {
  const raw = process.env.MODULES_ENABLED ?? "";
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
}

export function moduloPorSlug(slug: string): ModuloDef | undefined {
  return MODULOS.find((m) => m.slug === slug);
}
