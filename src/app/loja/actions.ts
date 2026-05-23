"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessao } from "@/lib/auth";
import { dentroDaJanelaAgendamento, isHHMM, isISODate } from "@/lib/dates";
import { parseBRLToCents } from "@/lib/format";

export async function criarRequisicaoLoja(formData: FormData) {
  const sessao = await getSessao();
  if (!sessao || sessao.tipo !== "loja") redirect("/entrar");

  const data = String(formData.get("data") ?? "");
  const horaInicio = String(formData.get("horaInicio") ?? "");
  const horaFim = String(formData.get("horaFim") ?? "");
  const funcao = String(formData.get("funcao") ?? "").trim() || null;
  const quantidade = Math.max(1, Number.parseInt(String(formData.get("quantidade") ?? "1"), 10) || 1);
  const valorDiaria = parseBRLToCents(String(formData.get("valorDiaria") ?? ""));
  const observacoes = String(formData.get("observacoes") ?? "").trim() || null;

  if (
    !isISODate(data) ||
    !dentroDaJanelaAgendamento(data) ||
    !isHHMM(horaInicio) ||
    !isHHMM(horaFim) ||
    valorDiaria <= 0
  ) {
    return;
  }

  await prisma.requisicao.create({
    data: {
      lojaId: sessao.lojaId,
      data,
      horaInicio,
      horaFim,
      funcao,
      quantidade,
      valorDiaria,
      observacoes,
    },
  });

  revalidatePath("/loja");
  revalidatePath("/requisicoes");
  redirect("/loja");
}
