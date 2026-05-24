"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { gerarTokenSenha } from "@/lib/senha";

// Aprova o pedido: libera o gestor e gera o link de 1º acesso (pega em Gestores).
export async function aprovarSolicitacao(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.gestor.update({
    where: { id },
    data: { aprovado: true, tokenSenha: gerarTokenSenha() },
  });
  revalidatePath("/solicitacoes");
  revalidatePath("/gestores");
  redirect("/gestores");
}

export async function recusarSolicitacao(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.gestor.delete({ where: { id } });
  revalidatePath("/solicitacoes");
}
