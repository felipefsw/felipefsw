// Sessão do Painel do Gestor: quem está logado e em que loja está.

import { redirect } from "next/navigation";
import { getSessao, setSessao } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { carregarAcesso, lojasDoAcesso, papelNaLoja, type Acesso, type Papel } from "./papeis";

export type ContextoPainel = {
  userId: string;
  nome: string;
  storeId: string;
  lojaNome: string;
  papel: Papel;
  acesso: Acesso;
};

/**
 * Carrega o contexto da tela: usuário, loja aberta e papel dele nessa loja.
 * Manda para o login quando não há sessão, e para o seletor quando a loja
 * da sessão não existe mais ou o acesso foi removido.
 */
export async function contextoPainel(): Promise<ContextoPainel> {
  const sessao = await getSessao();
  if (!sessao || sessao.tipo !== "painel") redirect("/painel/entrar");

  const acesso = await carregarAcesso(sessao.userId);
  if (!acesso) redirect("/painel/entrar");

  const lojas = await lojasDoAcesso(acesso);
  if (lojas.length === 0) redirect("/painel/sem-acesso");

  const lojaAtual = lojas.find((l) => l.id === sessao.storeId) ?? lojas[0];
  const papel = papelNaLoja(acesso, lojaAtual.id);
  if (!papel) redirect("/painel/sem-acesso");

  // A sessão apontava para uma loja que a pessoa não vê mais: corrige.
  if (lojaAtual.id !== sessao.storeId) {
    await setSessao({ tipo: "painel", userId: sessao.userId, storeId: lojaAtual.id });
  }

  const perfil = await prisma.profile.findUnique({
    where: { id: sessao.userId },
    select: { name: true },
  });

  return {
    userId: sessao.userId,
    nome: perfil?.name ?? "",
    storeId: lojaAtual.id,
    lojaNome: lojaAtual.shortName ?? lojaAtual.name,
    papel,
    acesso,
  };
}

/** Versão que não redireciona — para rotas públicas como o modo TV. */
export async function contextoPainelOpcional(): Promise<ContextoPainel | null> {
  const sessao = await getSessao();
  if (!sessao || sessao.tipo !== "painel") return null;
  const acesso = await carregarAcesso(sessao.userId);
  if (!acesso) return null;
  const papel = papelNaLoja(acesso, sessao.storeId);
  if (!papel) return null;
  const loja = await prisma.store.findUnique({
    where: { id: sessao.storeId },
    select: { name: true, shortName: true },
  });
  if (!loja) return null;
  const perfil = await prisma.profile.findUnique({
    where: { id: sessao.userId },
    select: { name: true },
  });
  return {
    userId: sessao.userId,
    nome: perfil?.name ?? "",
    storeId: sessao.storeId,
    lojaNome: loja.shortName ?? loja.name,
    papel,
    acesso,
  };
}
