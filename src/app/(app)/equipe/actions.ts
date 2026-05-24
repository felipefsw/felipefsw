"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { gerarTokenSenha } from "@/lib/senha";

export async function createMembro(formData: FormData) {
  const nome = String(formData.get("nome") ?? "").trim();
  const usuario = String(formData.get("usuario") ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");
  const perfil = String(formData.get("perfil") ?? "").trim();
  const papel = String(formData.get("papel") ?? "").trim() || null;
  if (!nome || !usuario || (perfil !== "rh" && perfil !== "ti")) return;

  const existe = await prisma.membro.findUnique({ where: { usuario }, select: { id: true } });
  if (existe) redirect("/equipe?erro=usuario");

  // Já gera o link de 1º acesso para o RH enviar no WhatsApp.
  await prisma.membro.create({ data: { nome, usuario, perfil, papel, tokenSenha: gerarTokenSenha() } });
  revalidatePath("/equipe");
  redirect("/equipe");
}

export async function toggleMembroAtivo(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const m = await prisma.membro.findUnique({ where: { id }, select: { ativo: true } });
  if (!m) return;
  await prisma.membro.update({ where: { id }, data: { ativo: !m.ativo } });
  revalidatePath("/equipe");
}

// Gera um novo link de acesso (1º acesso ou reset): zera a senha e cria o token.
export async function gerarLinkSenhaMembro(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.membro.update({ where: { id }, data: { senha: null, tokenSenha: gerarTokenSenha() } });
  revalidatePath("/equipe");
}
