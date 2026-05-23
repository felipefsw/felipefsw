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

export async function toggleGestorAtivo(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const g = await prisma.gestor.findUnique({ where: { id } });
  if (!g) return;
  await prisma.gestor.update({ where: { id }, data: { ativo: !g.ativo } });
  revalidatePath("/gestores");
}
