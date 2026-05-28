"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessao } from "@/lib/auth";

export async function salvarAgente(slug: string, formData: FormData) {
  const sessao = await getSessao();
  if (!sessao || sessao.tipo !== "gestao") throw new Error("Sem permissão");

  const nome = String(formData.get("nome") || "").trim();
  const descricao = String(formData.get("descricao") || "").trim();
  const systemPrompt = String(formData.get("systemPrompt") || "").trim();
  const modelo = String(formData.get("modelo") || "").trim() || "claude-opus-4-7";
  const ativo = formData.get("ativo") === "on";

  if (!nome || !descricao || !systemPrompt) {
    throw new Error("Nome, descrição e System Prompt são obrigatórios.");
  }

  await prisma.agente.update({
    where: { slug },
    data: { nome, descricao, systemPrompt, modelo, ativo },
  });

  revalidatePath(`/os/agentes/${slug}`);
  revalidatePath("/os/agentes");
  revalidatePath("/os");
  redirect("/os/agentes");
}
