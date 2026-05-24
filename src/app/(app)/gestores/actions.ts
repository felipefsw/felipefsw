"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export async function createGestor(formData: FormData) {
  const nome = String(formData.get("nome") ?? "").trim();
  const usuario = String(formData.get("usuario") ?? "").trim().toLowerCase();
  const senha = String(formData.get("senha") ?? "").trim() || "123456";
  if (!nome || !usuario) return;

  const existe = await prisma.gestor.findUnique({ where: { usuario } });
  if (existe) redirect("/gestores?erro=usuario");

  await prisma.gestor.create({ data: { nome, usuario, senha } });
  revalidatePath("/gestores");
  redirect("/gestores");
}

// Atribui (e desatribui) lojas a um gestor a partir da tela de gestores.
export async function atribuirLojasAoGestor(formData: FormData) {
  const gestorId = String(formData.get("gestorId") ?? "");
  if (!gestorId) return;
  const lojaIds = formData.getAll("lojaIds").map(String).filter(Boolean);

  if (lojaIds.length > 0) {
    // As selecionadas passam a ser deste gestor.
    await prisma.loja.updateMany({ where: { id: { in: lojaIds } }, data: { gestorId } });
    // As que eram deste gestor e foram desmarcadas ficam sem gestor.
    await prisma.loja.updateMany({
      where: { gestorId, id: { notIn: lojaIds } },
      data: { gestorId: null },
    });
  } else {
    await prisma.loja.updateMany({ where: { gestorId }, data: { gestorId: null } });
  }

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
