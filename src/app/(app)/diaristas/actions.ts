"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { cpfValido } from "@/lib/cpf";

// Lê as lojas preferidas do formulário, remove vazias e duplicadas (máx. 5).
function lojasPreferidasIds(formData: FormData): { id: string }[] {
  const ids = [1, 2, 3, 4, 5]
    .map((i) => String(formData.get(`lojaPreferida${i}`) ?? ""))
    .filter(Boolean);
  return [...new Set(ids)].slice(0, 5).map((id) => ({ id }));
}

export async function createDiarista(formData: FormData) {
  const nome = String(formData.get("nome") ?? "").trim();
  if (!nome) return;
  if (!cpfValido(String(formData.get("cpf") ?? ""))) redirect("/diaristas/nova?erro=cpf");

  await prisma.diarista.create({
    data: {
      nome,
      cpf: String(formData.get("cpf") ?? "").trim() || null,
      fotoUrl: String(formData.get("fotoUrl") ?? "").trim() || null,
      funcao: String(formData.get("funcao") ?? "").trim() || null,
      telefone: String(formData.get("telefone") ?? "").trim() || null,
      chavePix: String(formData.get("chavePix") ?? "").trim() || null,
      lojasPreferidas: { connect: lojasPreferidasIds(formData) },
    },
  });
  revalidatePath("/diaristas");
  redirect("/diaristas");
}

export async function updateDiarista(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const nome = String(formData.get("nome") ?? "").trim();
  if (!id || !nome) return;
  if (!cpfValido(String(formData.get("cpf") ?? ""))) redirect(`/diaristas/${id}?erro=cpf`);

  await prisma.diarista.update({
    where: { id },
    data: {
      nome,
      cpf: String(formData.get("cpf") ?? "").trim() || null,
      fotoUrl: String(formData.get("fotoUrl") ?? "").trim() || null,
      funcao: String(formData.get("funcao") ?? "").trim() || null,
      telefone: String(formData.get("telefone") ?? "").trim() || null,
      chavePix: String(formData.get("chavePix") ?? "").trim() || null,
      lojasPreferidas: { set: lojasPreferidasIds(formData) },
    },
  });
  revalidatePath("/diaristas");
  redirect("/diaristas");
}

export async function toggleDiaristaAtivo(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const d = await prisma.diarista.findUnique({ where: { id } });
  if (!d) return;
  await prisma.diarista.update({ where: { id }, data: { ativo: !d.ativo } });
  revalidatePath("/diaristas");
}

export async function bloquearPermanente(formData: FormData) {
  const diaristaId = String(formData.get("diaristaId") ?? "");
  const lojaId = String(formData.get("lojaId") ?? "");
  if (!diaristaId || !lojaId) return;
  await prisma.bloqueio.create({
    data: { diaristaId, lojaId, origem: "RH", ate: null },
  });
  revalidatePath(`/diaristas/${diaristaId}`);
}

export async function removerBloqueio(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const diaristaId = String(formData.get("diaristaId") ?? "");
  if (!id) return;
  await prisma.bloqueio.delete({ where: { id } });
  if (diaristaId) revalidatePath(`/diaristas/${diaristaId}`);
}

export async function deleteDiarista(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.diarista.delete({ where: { id } });
  revalidatePath("/diaristas");
  redirect("/diaristas");
}
