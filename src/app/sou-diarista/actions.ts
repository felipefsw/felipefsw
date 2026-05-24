"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { cpfValido } from "@/lib/cpf";
import { isISODate } from "@/lib/dates";
import { gerarHashSenha, senhaForte } from "@/lib/senha";
import { entrarDiaristaSessao } from "@/lib/auth";

export async function cadastrarDiarista(formData: FormData) {
  const nome = String(formData.get("nome") ?? "").trim();
  const sobrenome = String(formData.get("sobrenome") ?? "").trim();
  const cpf = String(formData.get("cpf") ?? "").trim();
  const dataNascimento = String(formData.get("dataNascimento") ?? "").trim();
  const funcao = String(formData.get("funcao") ?? "").trim();
  const telefone = String(formData.get("telefone") ?? "").trim();
  const chavePix = String(formData.get("chavePix") ?? "").trim();
  const senha = String(formData.get("senha") ?? "");
  const confirmarSenha = String(formData.get("confirmarSenha") ?? "");
  const vagaParam = String(formData.get("vaga") ?? "").trim();

  const erroUrl = (e: string) =>
    `/sou-diarista${vagaParam ? `?vaga=${vagaParam}&erro=${e}` : `?erro=${e}`}`;

  // Obrigatórios: nome, sobrenome, CPF, data de nascimento e função.
  if (!nome || !sobrenome || !cpf || !isISODate(dataNascimento) || !funcao) redirect(erroUrl("campos"));
  if (!cpfValido(cpf)) redirect(erroUrl("cpf"));
  if (!senhaForte(senha) || senha !== confirmarSenha) redirect(erroUrl("senha"));

  const diarista = await prisma.diarista.create({
    data: {
      nome: `${nome} ${sobrenome}`,
      cpf,
      dataNascimento,
      funcao,
      telefone: telefone || null,
      chavePix: chavePix || null,
      senha: gerarHashSenha(senha),
      observacoes: String(formData.get("observacoes") ?? "").trim() || null,
    },
  });

  // Se veio por um convite de vaga, já inscreve o novo candidato nela.
  if (vagaParam) {
    const req = await prisma.requisicao.findUnique({
      where: { id: vagaParam },
      select: { id: true, status: true },
    });
    if (req && req.status === "ABERTA") {
      await prisma.inscricao
        .create({ data: { requisicaoId: vagaParam, diaristaId: diarista.id } })
        .catch(() => {});
    }
  }

  await entrarDiaristaSessao(diarista.id);
  redirect(`/d/${diarista.token}`);
}
