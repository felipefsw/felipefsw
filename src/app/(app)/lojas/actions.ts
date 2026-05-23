"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export async function createLoja(formData: FormData) {
  const nome = String(formData.get("nome") ?? "").trim();
  const endereco = String(formData.get("endereco") ?? "").trim();
  if (!nome) return;

  await prisma.loja.create({
    data: { nome, endereco: endereco || null },
  });
  revalidatePath("/lojas");
  redirect("/lojas");
}

export async function updateLoja(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const nome = String(formData.get("nome") ?? "").trim();
  const endereco = String(formData.get("endereco") ?? "").trim();
  if (!id || !nome) return;

  await prisma.loja.update({
    where: { id },
    data: { nome, endereco: endereco || null },
  });
  revalidatePath("/lojas");
  redirect("/lojas");
}

export async function toggleLojaAtivo(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const loja = await prisma.loja.findUnique({ where: { id } });
  if (!loja) return;
  await prisma.loja.update({ where: { id }, data: { ativo: !loja.ativo } });
  revalidatePath("/lojas");
}

export async function deleteLoja(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.loja.delete({ where: { id } });
  revalidatePath("/lojas");
  redirect("/lojas");
}
