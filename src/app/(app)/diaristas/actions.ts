"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { parseBRLToCents } from "@/lib/format";

// Lê as 3 lojas preferidas do formulário, remove vazias e duplicadas (máx. 3).
function lojasPreferidasIds(formData: FormData): { id: string }[] {
  const ids = [
    String(formData.get("lojaPreferida1") ?? ""),
    String(formData.get("lojaPreferida2") ?? ""),
    String(formData.get("lojaPreferida3") ?? ""),
  ].filter(Boolean);
  return [...new Set(ids)].slice(0, 3).map((id) => ({ id }));
}

export async function createDiarista(formData: FormData) {
  const nome = String(formData.get("nome") ?? "").trim();
  if (!nome) return;

  await prisma.diarista.create({
    data: {
      nome,
      funcao: String(formData.get("funcao") ?? "").trim() || null,
      telefone: String(formData.get("telefone") ?? "").trim() || null,
      chavePix: String(formData.get("chavePix") ?? "").trim() || null,
      valorDiaria: parseBRLToCents(String(formData.get("valorDiaria") ?? "")),
      observacoes: String(formData.get("observacoes") ?? "").trim() || null,
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

  await prisma.diarista.update({
    where: { id },
    data: {
      nome,
      funcao: String(formData.get("funcao") ?? "").trim() || null,
      telefone: String(formData.get("telefone") ?? "").trim() || null,
      chavePix: String(formData.get("chavePix") ?? "").trim() || null,
      valorDiaria: parseBRLToCents(String(formData.get("valorDiaria") ?? "")),
      observacoes: String(formData.get("observacoes") ?? "").trim() || null,
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

export async function deleteDiarista(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.diarista.delete({ where: { id } });
  revalidatePath("/diaristas");
  redirect("/diaristas");
}
