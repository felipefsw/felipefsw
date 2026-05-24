"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { parseBRLToCents } from "@/lib/format";
import { dentroDaJanelaAgendamento, hojeISO, inicioDaSemana, isISODate } from "@/lib/dates";
import { podeMaisUmaNaSemana } from "@/lib/limites";
import { notificarVagaPreenchida } from "@/lib/push";

export async function createEscala(formData: FormData) {
  const diaristaId = String(formData.get("diaristaId") ?? "");
  const lojaId = String(formData.get("lojaId") ?? "");
  const data = String(formData.get("data") ?? "");
  const valorTexto = String(formData.get("valor") ?? "").trim();

  if (!diaristaId || !lojaId || !isISODate(data) || !dentroDaJanelaAgendamento(data)) return;

  // No máximo 2 diárias por semana na mesma loja (salvo liberação da loja/RH).
  if (!(await podeMaisUmaNaSemana(diaristaId, lojaId, data))) {
    redirect(`/escala?inicio=${inicioDaSemana(data)}&erro=limite`);
  }

  let valor = parseBRLToCents(valorTexto);
  if (!valor) {
    const d = await prisma.diarista.findUnique({ where: { id: diaristaId } });
    valor = d?.valorDiaria ?? 0;
  }

  await prisma.escala.create({
    data: { diaristaId, lojaId, data, valor },
  });

  revalidatePath("/escala");
  revalidatePath("/");
  redirect(`/escala?inicio=${inicioDaSemana(data)}`);
}

// Escala um diarista direto numa vaga aberta (1 clique, pelo RH).
export async function escalarNaVaga(requisicaoId: string, diaristaId: string) {
  if (!requisicaoId || !diaristaId) return;
  const requisicao = await prisma.requisicao.findUnique({
    where: { id: requisicaoId },
    include: { _count: { select: { escalas: true } } },
  });
  if (!requisicao || requisicao.status !== "ABERTA") return;
  if (requisicao._count.escalas >= requisicao.quantidade) return;

  const [jaNoDia, bloqueio] = await Promise.all([
    prisma.escala.findFirst({ where: { data: requisicao.data, diaristaId }, select: { id: true } }),
    prisma.bloqueio.findFirst({
      where: {
        lojaId: requisicao.lojaId,
        diaristaId,
        OR: [{ ate: null }, { ate: { gt: new Date() } }],
      },
      select: { id: true },
    }),
  ]);
  if (jaNoDia || bloqueio) return;
  if (!(await podeMaisUmaNaSemana(diaristaId, requisicao.lojaId, requisicao.data))) return;

  await prisma.escala.create({
    data: {
      diaristaId,
      lojaId: requisicao.lojaId,
      data: requisicao.data,
      horaInicio: requisicao.horaInicio,
      horaFim: requisicao.horaFim,
      valor: requisicao.valorDiaria,
      requisicaoId: requisicao.id,
    },
  });

  if (requisicao._count.escalas + 1 >= requisicao.quantidade) {
    await prisma.requisicao.update({ where: { id: requisicaoId }, data: { status: "ATENDIDA" } });
    await notificarVagaPreenchida(requisicaoId);
  }

  revalidatePath("/escala/novo");
  revalidatePath("/escala");
  revalidatePath("/requisicoes");
}

// Avaliação por estrelas direto na lista da escala (RH), 1 toque.
export async function avaliarEstrelasRH(escalaId: string, estrelas: number) {
  const n = Math.round(estrelas);
  if (!escalaId || n < 1 || n > 5) return;
  const escala = await prisma.escala.findUnique({
    where: { id: escalaId },
    select: { diaristaId: true },
  });
  if (!escala) return;
  await prisma.avaliacao.upsert({
    where: { escalaId },
    update: { estrelas: n },
    create: { escalaId, diaristaId: escala.diaristaId, estrelas: n },
  });
  revalidatePath("/escala");
  revalidatePath(`/diaristas/${escala.diaristaId}`);
}

export async function marcarPresenca(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const presenca = String(formData.get("presenca") ?? "");
  if (!id || !["PENDENTE", "PRESENTE", "FALTOU"].includes(presenca)) return;

  await prisma.escala.update({ where: { id }, data: { presenca } });

  revalidatePath("/escala");
  revalidatePath("/");
  revalidatePath("/pagamentos");
}

export async function deleteEscala(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  // Não pode excluir diárias passadas ou já realizadas (check-in/presença).
  const escala = await prisma.escala.findUnique({
    where: { id },
    select: { data: true, presenca: true, checkinEm: true, checkoutEm: true },
  });
  if (!escala) return;
  const realizada =
    escala.data < hojeISO() ||
    escala.presenca === "PRESENTE" ||
    escala.checkinEm != null ||
    escala.checkoutEm != null;
  if (realizada) return;

  await prisma.escala.delete({ where: { id } });

  revalidatePath("/escala");
  revalidatePath("/");
  revalidatePath("/pagamentos");
}

export async function gerarLinkConfirmacao(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const escala = await prisma.escala.findUnique({
    where: { id },
    select: { tokenConfirmacao: true },
  });
  if (!escala) return;
  if (!escala.tokenConfirmacao) {
    await prisma.escala.update({
      where: { id },
      data: { tokenConfirmacao: crypto.randomUUID() },
    });
  }
  revalidatePath("/escala");
}

export async function salvarAvaliacao(formData: FormData) {
  const escalaId = String(formData.get("escalaId") ?? "");
  const estrelas = Number.parseInt(String(formData.get("estrelas") ?? ""), 10);
  if (!escalaId || Number.isNaN(estrelas) || estrelas < 1 || estrelas > 5) return;

  const escala = await prisma.escala.findUnique({
    where: { id: escalaId },
    select: { id: true, diaristaId: true, data: true },
  });
  if (!escala) return;

  const comentario = String(formData.get("comentario") ?? "").trim() || null;

  await prisma.avaliacao.upsert({
    where: { escalaId },
    update: { estrelas, comentario },
    create: { escalaId, diaristaId: escala.diaristaId, estrelas, comentario },
  });

  revalidatePath("/escala");
  revalidatePath(`/diaristas/${escala.diaristaId}`);
  redirect(`/escala?inicio=${inicioDaSemana(escala.data)}`);
}
