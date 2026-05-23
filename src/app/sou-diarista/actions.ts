"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export async function cadastrarDiarista(formData: FormData) {
  const nome = String(formData.get("nome") ?? "").trim();
  const cpf = String(formData.get("cpf") ?? "").trim();
  const dataNascimento = String(formData.get("dataNascimento") ?? "").trim();
  const funcao = String(formData.get("funcao") ?? "").trim();
  const telefone = String(formData.get("telefone") ?? "").trim();
  const chavePix = String(formData.get("chavePix") ?? "").trim();

  // Todos os campos são obrigatórios no auto-cadastro.
  if (!nome || !cpf || !dataNascimento || !funcao || !telefone || !chavePix) return;

  const diarista = await prisma.diarista.create({
    data: {
      nome,
      cpf,
      dataNascimento,
      funcao,
      telefone,
      chavePix,
      observacoes: String(formData.get("observacoes") ?? "").trim() || null,
    },
  });

  redirect(`/d/${diarista.token}`);
}
