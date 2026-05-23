"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { parseBRLToCents } from "@/lib/format";
import { inicioDaSemana, isISODate } from "@/lib/dates";

export async function createEscala(formData: FormData) {
  const diaristaId = String(formData.get("diaristaId") ?? "");
  const lojaId = String(formData.get("lojaId") ?? "");
  const data = String(formData.get("data") ?? "");
  const valorTexto = String(formData.get("valor") ?? "").trim();

  if (!diaristaId || !lojaId || !isISODate(data)) return;

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
  await prisma.escala.delete({ where: { id } });

  revalidatePath("/escala");
  revalidatePath("/");
  revalidatePath("/pagamentos");
}

function nota(formData: FormData, campo: string): number {
  const n = Number.parseInt(String(formData.get(campo) ?? ""), 10);
  if (Number.isNaN(n)) return 0;
  return Math.min(10, Math.max(0, n));
}

export async function salvarAvaliacao(formData: FormData) {
  const escalaId = String(formData.get("escalaId") ?? "");
  if (!escalaId) return;

  const escala = await prisma.escala.findUnique({
    where: { id: escalaId },
    select: { id: true, diaristaId: true, data: true },
  });
  if (!escala) return;

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

  revalidatePath("/escala");
  revalidatePath(`/diaristas/${escala.diaristaId}`);
  redirect(`/escala?inicio=${inicioDaSemana(escala.data)}`);
}
