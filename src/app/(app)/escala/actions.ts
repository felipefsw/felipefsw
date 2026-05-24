"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { parseBRLToCents } from "@/lib/format";
import { dentroDaJanelaAgendamento, hojeISO, inicioDaSemana, isISODate } from "@/lib/dates";

export async function createEscala(formData: FormData) {
  const diaristaId = String(formData.get("diaristaId") ?? "");
  const lojaId = String(formData.get("lojaId") ?? "");
  const data = String(formData.get("data") ?? "");
  const valorTexto = String(formData.get("valor") ?? "").trim();

  if (!diaristaId || !lojaId || !isISODate(data) || !dentroDaJanelaAgendamento(data)) return;

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
