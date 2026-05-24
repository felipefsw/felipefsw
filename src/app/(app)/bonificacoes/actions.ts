"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { VALOR_BONUS, VALOR_BONUS_30, VALOR_BONUS_50 } from "@/lib/bonificacoes";

export async function pagarCashback(formData: FormData) {
  const diaristaId = String(formData.get("diaristaId") ?? "");
  if (!diaristaId) return;
  const ja = await prisma.bonificacao.findFirst({
    where: { diaristaId, tipo: "CASHBACK_5" },
  });
  if (ja) return;
  await prisma.bonificacao.create({
    data: { diaristaId, tipo: "CASHBACK_5", valor: VALOR_BONUS, pago: true, pagoEm: new Date() },
  });
  revalidatePath("/bonificacoes");
}

export async function pagarCashback20(formData: FormData) {
  const diaristaId = String(formData.get("diaristaId") ?? "");
  if (!diaristaId) return;
  const ja = await prisma.bonificacao.findFirst({
    where: { diaristaId, tipo: "CASHBACK_20" },
  });
  if (ja) return;
  await prisma.bonificacao.create({
    data: { diaristaId, tipo: "CASHBACK_20", valor: VALOR_BONUS, pago: true, pagoEm: new Date() },
  });
  revalidatePath("/bonificacoes");
}

export async function pagarMilestone(formData: FormData) {
  const diaristaId = String(formData.get("diaristaId") ?? "");
  const marco = String(formData.get("marco") ?? ""); // "30" ou "50"
  if (!diaristaId || (marco !== "30" && marco !== "50")) return;
  const tipo = marco === "30" ? "MILESTONE_30" : "MILESTONE_50";
  const valor = marco === "30" ? VALOR_BONUS_30 : VALOR_BONUS_50;
  const ja = await prisma.bonificacao.findFirst({ where: { diaristaId, tipo } });
  if (ja) return;
  await prisma.bonificacao.create({
    data: { diaristaId, tipo, valor, pago: true, pagoEm: new Date() },
  });
  revalidatePath("/bonificacoes");
}

export async function pagarTopMes(formData: FormData) {
  const diaristaId = String(formData.get("diaristaId") ?? "");
  const referencia = String(formData.get("referencia") ?? "");
  if (!diaristaId || !referencia) return;
  const ja = await prisma.bonificacao.findFirst({
    where: { diaristaId, tipo: "TOP_MES", referencia },
  });
  if (ja) return;
  await prisma.bonificacao.create({
    data: { diaristaId, tipo: "TOP_MES", referencia, valor: VALOR_BONUS, pago: true, pagoEm: new Date() },
  });
  revalidatePath("/bonificacoes");
}
