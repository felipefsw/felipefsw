"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { cnpjValido } from "@/lib/cnpj";

function coord(formData: FormData, campo: string): number | null {
  const n = Number.parseFloat(String(formData.get(campo) ?? ""));
  return Number.isFinite(n) ? n : null;
}

function gestorIds(formData: FormData): { id: string }[] {
  return [...new Set(formData.getAll("gestorIds").map(String).filter(Boolean))].map((id) => ({ id }));
}

export async function createLoja(formData: FormData) {
  const nome = String(formData.get("nome") ?? "").trim();
  const cnpj = String(formData.get("cnpj") ?? "").trim();
  const cidade = String(formData.get("cidade") ?? "").trim();
  const bairro = String(formData.get("bairro") ?? "").trim();
  const endereco = String(formData.get("endereco") ?? "").trim();
  if (!nome) return;
  if (cnpj && !cnpjValido(cnpj)) redirect("/lojas/nova?erro=cnpj");

  await prisma.loja.create({
    data: {
      nome,
      cnpj: cnpj || null,
      cidade: cidade || null,
      bairro: bairro || null,
      endereco: endereco || null,
      gestores: { connect: gestorIds(formData) },
      latitude: coord(formData, "latitude"),
      longitude: coord(formData, "longitude"),
      permiteMais2Semana: formData.get("permiteMais2Semana") != null,
    },
  });
  revalidatePath("/lojas");
  redirect("/lojas");
}

export async function updateLoja(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const nome = String(formData.get("nome") ?? "").trim();
  const cnpj = String(formData.get("cnpj") ?? "").trim();
  const cidade = String(formData.get("cidade") ?? "").trim();
  const bairro = String(formData.get("bairro") ?? "").trim();
  const endereco = String(formData.get("endereco") ?? "").trim();
  if (!id || !nome) return;
  if (cnpj && !cnpjValido(cnpj)) redirect(`/lojas/${id}?erro=cnpj`);

  await prisma.loja.update({
    where: { id },
    data: {
      nome,
      cnpj: cnpj || null,
      cidade: cidade || null,
      bairro: bairro || null,
      endereco: endereco || null,
      gestores: { set: gestorIds(formData) },
      latitude: coord(formData, "latitude"),
      longitude: coord(formData, "longitude"),
      permiteMais2Semana: formData.get("permiteMais2Semana") != null,
    },
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
