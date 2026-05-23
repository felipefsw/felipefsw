"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export async function confirmarPresenca(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const token = String(formData.get("token") ?? "");
  if (!id || !token) return;

  // Garante que a escala pertence à diarista dona do token (autorização pelo link).
  const escala = await prisma.escala.findUnique({
    where: { id },
    include: { diarista: true },
  });
  if (!escala || escala.diarista.token !== token) return;

  await prisma.escala.update({ where: { id }, data: { presenca: "PRESENTE" } });

  revalidatePath(`/d/${token}`);
  revalidatePath("/escala");
  revalidatePath("/");
}

function notaLoja(formData: FormData, campo: string): number {
  const n = Number.parseInt(String(formData.get(campo) ?? ""), 10);
  if (Number.isNaN(n)) return 0;
  return Math.min(10, Math.max(0, n));
}

export async function salvarAvaliacaoLoja(formData: FormData) {
  const escalaId = String(formData.get("escalaId") ?? "");
  const token = String(formData.get("token") ?? "");
  if (!escalaId || !token) return;

  // Autorização pelo link: a escala precisa ser da diarista dona do token.
  const escala = await prisma.escala.findUnique({
    where: { id: escalaId },
    include: { diarista: true },
  });
  if (!escala || escala.diarista.token !== token) return;

  const notas = {
    ambiente: notaLoja(formData, "ambiente"),
    tratamento: notaLoja(formData, "tratamento"),
    pagamentoEmDia: notaLoja(formData, "pagamentoEmDia"),
    organizacao: notaLoja(formData, "organizacao"),
    seguranca: notaLoja(formData, "seguranca"),
  };
  const comentario = String(formData.get("comentario") ?? "").trim() || null;

  await prisma.avaliacaoLoja.upsert({
    where: { escalaId },
    update: { ...notas, comentario },
    create: {
      escalaId,
      lojaId: escala.lojaId,
      diaristaId: escala.diaristaId,
      ...notas,
      comentario,
    },
  });

  revalidatePath(`/d/${token}`);
  revalidatePath(`/lojas/${escala.lojaId}`);
  redirect(`/d/${token}`);
}
