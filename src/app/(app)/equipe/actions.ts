"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

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

  await prisma.membro.create({ data: { nome, usuario, perfil, papel } });
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

// Esqueceu a senha: zera para cair de novo no primeiro acesso.
export async function resetarSenhaMembro(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.membro.update({ where: { id }, data: { senha: null } });
  revalidatePath("/equipe");
}
