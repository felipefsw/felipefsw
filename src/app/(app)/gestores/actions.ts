"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export async function createGestor(formData: FormData) {
  const nome = String(formData.get("nome") ?? "").trim();
  const usuario = String(formData.get("usuario") ?? "").trim().toLowerCase();
  const senha = String(formData.get("senha") ?? "").trim() || "123456";
  if (!nome || !usuario) return;

  // Precisa alocar pelo menos uma loja ao criar o gestor.
  const lojaIds = [...new Set(formData.getAll("lojaIds").map(String).filter(Boolean))];
  if (lojaIds.length === 0) redirect("/gestores?erro=lojas");

  const existe = await prisma.gestor.findUnique({ where: { usuario } });
  if (existe) redirect("/gestores?erro=usuario");

  await prisma.gestor.create({
    data: { nome, usuario, senha, lojas: { connect: lojaIds.map((id) => ({ id })) } },
  });
  revalidatePath("/gestores");
  revalidatePath("/lojas");
  redirect("/gestores");
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
