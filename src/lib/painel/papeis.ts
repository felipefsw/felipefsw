// Papéis e permissões do Painel do Gestor (seção 3 do /docs/BUILD_BOOK.md).
//
// No book isso é RLS do Postgres com a função `has_role(store_id, roles[])`.
// Como aqui o banco é acessado só pelo Prisma no servidor, a mesma regra vive
// nesta camada: NENHUMA leitura ou escrita do Painel deve ir ao banco sem
// passar por `podeVer` / `podeEditar` / `exigePapel`.

import type { PapelPainel } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type Papel = PapelPainel;

export const PAPEIS: Papel[] = [
  "admin_rede",
  "gestor",
  "gerente",
  "equipe",
  "auditor",
  "cd",
];

export const NOME_DO_PAPEL: Record<Papel, string> = {
  admin_rede: "Administrador da rede",
  gestor: "Gestor",
  gerente: "Gerente",
  equipe: "Equipe",
  auditor: "Auditor",
  cd: "CD",
};

/** Papéis cujo escopo é a rede inteira, e não só as lojas em que têm acesso. */
export const PAPEIS_DE_REDE: Papel[] = ["admin_rede", "cd"];

/** O que cada papel pode EDITAR, pela tabela da seção 3. */
export type Area =
  | "parametros" // réguas, parâmetros, turnos, ficha técnica, feriados
  | "usuarios" // usuários e acessos
  | "modelos" // modelos de checklist e regras de gamificação
  | "meta" // meta da semana
  | "equipe" // cadastro da equipe e escala
  | "operacao" // presença, checklists, contagem, envio de relatórios, indicadores
  | "auditoria" // avaliação semanal, pesagens, fotos
  | "cd" // cupons e entregas do CD
  | "aprovacao"; // fechamento da semana e contestações

const EDITA: Record<Area, Papel[]> = {
  parametros: ["admin_rede", "gestor"],
  usuarios: ["admin_rede"],
  modelos: ["admin_rede"],
  meta: ["admin_rede", "gestor"],
  equipe: ["admin_rede", "gestor"],
  operacao: ["admin_rede", "gestor", "gerente"],
  auditoria: ["admin_rede", "auditor"],
  cd: ["admin_rede", "cd"],
  aprovacao: ["admin_rede", "gestor"],
};

/**
 * O acesso de uma pessoa: o papel dela em cada loja. `escopoRede` diz que o
 * papel vale para todas as lojas (admin_rede e cd, pela seção 3).
 */
export type Acesso = {
  userId: string;
  porLoja: Map<string, Papel>;
  papelDeRede: Papel | null;
};

/** Monta o acesso da pessoa a partir das `memberships`. */
export async function carregarAcesso(userId: string): Promise<Acesso | null> {
  const perfil = await prisma.profile.findUnique({
    where: { id: userId },
    select: { active: true, memberships: { select: { storeId: true, role: true } } },
  });
  if (!perfil || !perfil.active) return null;

  const porLoja = new Map<string, Papel>();
  let papelDeRede: Papel | null = null;
  for (const m of perfil.memberships) {
    porLoja.set(m.storeId, m.role);
    if (PAPEIS_DE_REDE.includes(m.role)) papelDeRede = m.role;
  }
  return { userId, porLoja, papelDeRede };
}

/** O papel da pessoa em uma loja (levando em conta os papéis de rede). */
export function papelNaLoja(acesso: Acesso | null, storeId: string): Papel | null {
  if (!acesso) return null;
  if (acesso.papelDeRede) return acesso.papelDeRede;
  return acesso.porLoja.get(storeId) ?? null;
}

/**
 * Equivalente ao `has_role(store_id, roles[])` do book: a pessoa tem algum
 * dos papéis pedidos naquela loja?
 */
export function temPapel(acesso: Acesso | null, storeId: string, papeis: Papel[]): boolean {
  const papel = papelNaLoja(acesso, storeId);
  return papel !== null && papeis.includes(papel);
}

/** Pode LER os dados desta loja? Todo membro da loja pode (seção 3). */
export function podeVer(acesso: Acesso | null, storeId: string): boolean {
  return papelNaLoja(acesso, storeId) !== null;
}

/** Pode ESCREVER nesta área desta loja? */
export function podeEditar(acesso: Acesso | null, storeId: string, area: Area): boolean {
  return temPapel(acesso, storeId, EDITA[area]);
}

/** Erro de permissão — as telas transformam em mensagem em português. */
export class SemPermissao extends Error {
  constructor(mensagem = "Você não tem permissão para isso.") {
    super(mensagem);
    this.name = "SemPermissao";
  }
}

/** Trava de leitura: use antes de qualquer consulta de uma loja. */
export function exigeVer(acesso: Acesso | null, storeId: string): void {
  if (!podeVer(acesso, storeId)) {
    throw new SemPermissao("Você não tem acesso a esta loja.");
  }
}

/** Trava de escrita: use no começo de toda server action do Painel. */
export function exigeEditar(acesso: Acesso | null, storeId: string, area: Area): void {
  exigeVer(acesso, storeId);
  if (!podeEditar(acesso, storeId, area)) {
    throw new SemPermissao("Seu papel não permite alterar isso.");
  }
}

/** As lojas que a pessoa enxerga, em ordem alfabética. */
export async function lojasDoAcesso(acesso: Acesso | null) {
  if (!acesso) return [];
  const where = acesso.papelDeRede
    ? { active: true }
    : { active: true, id: { in: [...acesso.porLoja.keys()] } };
  return prisma.store.findMany({
    where,
    select: { id: true, name: true, shortName: true, brand: { select: { name: true } } },
    orderBy: { name: "asc" },
  });
}
