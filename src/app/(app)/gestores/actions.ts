"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { gerarTokenSenha } from "@/lib/senha";

export async function createGestor(formData: FormData) {
  const nome = String(formData.get("nome") ?? "").trim();
  const usuario = String(formData.get("usuario") ?? "").trim().toLowerCase();
  if (!nome || !usuario) return;

  // Precisa alocar pelo menos uma loja ao criar o gestor.
  const lojaIds = [...new Set(formData.getAll("lojaIds").map(String).filter(Boolean))];
  if (lojaIds.length === 0) redirect("/gestores?erro=lojas");

  const existe = await prisma.gestor.findUnique({ where: { usuario } });
  if (existe) redirect("/gestores?erro=usuario");

  // A senha é criada pelo gestor no 1º acesso (link). Já geramos o token.
  await prisma.gestor.create({
    data: {
      nome,
      usuario,
      tokenSenha: gerarTokenSenha(),
      lojas: { connect: lojaIds.map((id) => ({ id })) },
    },
  });
  revalidatePath("/gestores");
  revalidatePath("/lojas");
  redirect("/gestores");
}

// Gera novo link de acesso (1º acesso/reset): invalida a senha e cria o token.
export async function gerarLinkSenhaGestor(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.gestor.update({
    where: { id },
    data: { senha: "123456", tokenSenha: gerarTokenSenha() },
  });
  revalidatePath("/gestores");
}

// Define exatamente as lojas deste gestor (marca/desmarca de uma vez).
export async function atribuirLojasAoGestor(formData: FormData) {
  const gestorId = String(formData.get("gestorId") ?? "");
  if (!gestorId) return;
  const lojaIds = [...new Set(formData.getAll("lojaIds").map(String).filter(Boolean))];

  await prisma.gestor.update({
    where: { id: gestorId },
    data: { lojas: { set: lojaIds.map((id) => ({ id })) } },
  });

  revalidatePath("/gestores");
  revalidatePath("/lojas");
}

export async function toggleGestorAtivo(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const g = await prisma.gestor.findUnique({ where: { id } });
  if (!g) return;
  await prisma.gestor.update({ where: { id }, data: { ativo: !g.ativo } });
  revalidatePath("/gestores");
}
