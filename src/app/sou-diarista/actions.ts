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

  // Se veio por um convite de vaga, já inscreve o novo candidato nela.
  const vaga = String(formData.get("vaga") ?? "").trim();
  if (vaga) {
    const req = await prisma.requisicao.findUnique({
      where: { id: vaga },
      select: { id: true, status: true },
    });
    if (req && req.status === "ABERTA") {
      await prisma.inscricao
        .create({ data: { requisicaoId: vaga, diaristaId: diarista.id } })
        .catch(() => {});
    }
  }

  redirect(`/d/${diarista.token}`);
}
