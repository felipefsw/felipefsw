"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { dentroDaJanelaAgendamento, inicioDaSemana, isHHMM, isISODate } from "@/lib/dates";
import { parseBRLToCents } from "@/lib/format";

export async function createRequisicao(formData: FormData) {
  const lojaId = String(formData.get("lojaId") ?? "");
  const data = String(formData.get("data") ?? "");
  const horaInicio = String(formData.get("horaInicio") ?? "");
  const horaFim = String(formData.get("horaFim") ?? "");
  const funcao = String(formData.get("funcao") ?? "").trim() || null;
  const quantidade = Math.max(1, Number.parseInt(String(formData.get("quantidade") ?? "1"), 10) || 1);
  const valorDiaria = parseBRLToCents(String(formData.get("valorDiaria") ?? ""));
  const observacoes = String(formData.get("observacoes") ?? "").trim() || null;

  // valor da diária é obrigatório (> 0); data dentro da janela (hoje..+7)
  if (
    !lojaId ||
    !isISODate(data) ||
    !dentroDaJanelaAgendamento(data) ||
    !isHHMM(horaInicio) ||
    !isHHMM(horaFim) ||
    valorDiaria <= 0
  ) {
    return;
  }

  await prisma.requisicao.create({
    data: { lojaId, data, horaInicio, horaFim, funcao, quantidade, valorDiaria, observacoes },
  });

  revalidatePath("/requisicoes");
  revalidatePath("/");
  redirect("/requisicoes");
}

export async function fecharRequisicao(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const data = String(formData.get("data") ?? "");
  const diaristaIds = formData.getAll("diaristaIds").map(String).filter(Boolean);

  if (!id || !isISODate(data) || !dentroDaJanelaAgendamento(data) || diaristaIds.length === 0) return;

  const requisicao = await prisma.requisicao.findUnique({ where: { id } });
  if (!requisicao) return;

  // Evita conflito: remove quem já está escalado nesse dia (em qualquer loja).
  const jaEscalados = await prisma.escala.findMany({
    where: { data, diaristaId: { in: diaristaIds } },
    select: { diaristaId: true },
  });
  const ocupados = new Set(jaEscalados.map((e) => e.diaristaId));
  const livres = diaristaIds.filter((d) => !ocupados.has(d));
  if (livres.length === 0) return;

  await prisma.$transaction([
    prisma.escala.createMany({
      data: livres.map((diaristaId) => ({
        diaristaId,
        lojaId: requisicao.lojaId,
        data,
        horaInicio: requisicao.horaInicio,
        horaFim: requisicao.horaFim,
        valor: requisicao.valorDiaria,
        requisicaoId: requisicao.id,
      })),
    }),
    prisma.requisicao.update({ where: { id }, data: { status: "ATENDIDA" } }),
  ]);

  revalidatePath("/requisicoes");
  revalidatePath("/escala");
  revalidatePath("/");
  redirect(`/escala?inicio=${inicioDaSemana(data)}`);
}

export async function cancelarRequisicao(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.requisicao.update({ where: { id }, data: { status: "CANCELADA" } });
  revalidatePath("/requisicoes");
  revalidatePath("/");
}

export async function reabrirRequisicao(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.requisicao.update({ where: { id }, data: { status: "ABERTA" } });
  revalidatePath("/requisicoes");
  revalidatePath("/");
}

export async function deleteRequisicao(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.requisicao.delete({ where: { id } });
  revalidatePath("/requisicoes");
  revalidatePath("/");
}
