"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { inicioDaSemana, isISODate } from "@/lib/dates";

export async function createRequisicao(formData: FormData) {
  const lojaId = String(formData.get("lojaId") ?? "");
  const data = String(formData.get("data") ?? "");
  const funcao = String(formData.get("funcao") ?? "").trim() || null;
  const quantidade = Math.max(1, Number.parseInt(String(formData.get("quantidade") ?? "1"), 10) || 1);
  const observacoes = String(formData.get("observacoes") ?? "").trim() || null;

  if (!lojaId || !isISODate(data)) return;

  await prisma.requisicao.create({
    data: { lojaId, data, funcao, quantidade, observacoes },
  });

  revalidatePath("/requisicoes");
  revalidatePath("/");
  redirect("/requisicoes");
}

export async function fecharRequisicao(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const data = String(formData.get("data") ?? "");
  const diaristaIds = formData.getAll("diaristaIds").map(String).filter(Boolean);

  if (!id || !isISODate(data) || diaristaIds.length === 0) return;

  const requisicao = await prisma.requisicao.findUnique({ where: { id } });
  if (!requisicao) return;

  const diaristas = await prisma.diarista.findMany({
    where: { id: { in: diaristaIds } },
    select: { id: true, valorDiaria: true },
  });

  await prisma.$transaction([
    prisma.escala.createMany({
      data: diaristas.map((d) => ({
        diaristaId: d.id,
        lojaId: requisicao.lojaId,
        data,
        valor: d.valorDiaria,
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
