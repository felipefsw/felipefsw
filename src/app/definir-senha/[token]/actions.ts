"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { gerarHashSenha, senhaForte } from "@/lib/senha";
import { setSessao } from "@/lib/auth";

// Define a senha a partir do link secreto (1º acesso ou reset). Vale para
// loja, gestor ou membro (RH/TI). Consome o token (uso único) e já entra.
export async function definirSenhaPorToken(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const senha = String(formData.get("senha") ?? "");
  const confirmar = String(formData.get("confirmarSenha") ?? "");
  if (!token) redirect("/entrar");
  if (!senhaForte(senha) || senha !== confirmar) redirect(`/definir-senha/${token}?erro=senha`);

  const hash = gerarHashSenha(senha);

  const loja = await prisma.loja.findUnique({ where: { tokenSenha: token }, select: { id: true } });
  if (loja) {
    await prisma.loja.update({ where: { id: loja.id }, data: { senha: hash, tokenSenha: null } });
    await setSessao({ tipo: "loja", lojaId: loja.id });
    redirect("/loja");
  }

  const gestor = await prisma.gestor.findUnique({
    where: { tokenSenha: token },
    select: { id: true, lojas: { where: { ativo: true }, select: { id: true }, orderBy: { nome: "asc" } } },
  });
  if (gestor) {
    await prisma.gestor.update({ where: { id: gestor.id }, data: { senha: hash, tokenSenha: null } });
    await setSessao({ tipo: "gestor", gestorId: gestor.id, lojaId: gestor.lojas[0]?.id ?? "" });
    redirect("/loja");
  }

  const membro = await prisma.membro.findUnique({
    where: { tokenSenha: token },
    select: { id: true, perfil: true, nome: true, papel: true },
  });
  if (membro) {
    await prisma.membro.update({ where: { id: membro.id }, data: { senha: hash, tokenSenha: null } });
    await setSessao({
      tipo: "gestao",
      perfil: membro.perfil === "ti" ? "ti" : "rh",
      nome: membro.nome,
      papel: membro.papel ?? undefined,
    });
    redirect("/");
  }

  redirect("/entrar");
}
