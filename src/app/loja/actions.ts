"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessao } from "@/lib/auth";
import { dentroDaJanelaAgendamento, isHHMM, isISODate } from "@/lib/dates";
import { parseBRLToCents } from "@/lib/format";

async function lojaSessaoId(): Promise<string> {
  const sessao = await getSessao();
  if (!sessao || sessao.tipo !== "loja") redirect("/entrar");
  return sessao.lojaId;
}

function nota(formData: FormData, campo: string): number {
  const n = Number.parseInt(String(formData.get(campo) ?? ""), 10);
  if (Number.isNaN(n)) return 0;
  return Math.min(10, Math.max(0, n));
}

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

export async function avaliarDiaristaLoja(formData: FormData) {
  const lojaId = await lojaSessaoId();
  const escalaId = String(formData.get("escalaId") ?? "");
  if (!escalaId) return;

  const escala = await prisma.escala.findUnique({
    where: { id: escalaId },
    select: { id: true, lojaId: true, diaristaId: true },
  });
  if (!escala || escala.lojaId !== lojaId) return;

  const notas = {
    pontualidade: nota(formData, "pontualidade"),
    limpeza: nota(formData, "limpeza"),
    educacao: nota(formData, "educacao"),
    rapidez: nota(formData, "rapidez"),
    habilidadeTecnica: nota(formData, "habilidadeTecnica"),
    respeito: nota(formData, "respeito"),
    espiritoEquipe: nota(formData, "espiritoEquipe"),
  };
  const comentario = String(formData.get("comentario") ?? "").trim() || null;

  await prisma.avaliacao.upsert({
    where: { escalaId },
    update: { ...notas, comentario },
    create: { escalaId, diaristaId: escala.diaristaId, ...notas, comentario },
  });

  revalidatePath("/loja");
  revalidatePath(`/diaristas/${escala.diaristaId}`);
  redirect("/loja");
}

export async function desfazerAvaliacaoDiarista(formData: FormData) {
  const lojaId = await lojaSessaoId();
  const escalaId = String(formData.get("escalaId") ?? "");
  if (!escalaId) return;

  const escala = await prisma.escala.findUnique({
    where: { id: escalaId },
    select: { lojaId: true, diaristaId: true },
  });
  if (!escala || escala.lojaId !== lojaId) return;

  await prisma.avaliacao.deleteMany({ where: { escalaId } });
  revalidatePath("/loja");
  revalidatePath(`/diaristas/${escala.diaristaId}`);
}

export async function bloquearDiaristaLoja(formData: FormData) {
  const lojaId = await lojaSessaoId();
  const diaristaId = String(formData.get("diaristaId") ?? "");
  const dias = Number.parseInt(String(formData.get("dias") ?? ""), 10);
  if (!diaristaId || ![7, 14, 30].includes(dias)) return;

  const ate = new Date(Date.now() + dias * 24 * 60 * 60 * 1000);
  await prisma.bloqueio.create({
    data: { lojaId, diaristaId, origem: "LOJA", ate },
  });
  revalidatePath("/loja");
}

export async function desbloquearDiaristaLoja(formData: FormData) {
  const lojaId = await lojaSessaoId();
  const diaristaId = String(formData.get("diaristaId") ?? "");
  if (!diaristaId) return;

  // A loja só remove os próprios bloqueios (temporários), nunca os do RH.
  await prisma.bloqueio.deleteMany({
    where: { lojaId, diaristaId, origem: "LOJA" },
  });
  revalidatePath("/loja");
}
