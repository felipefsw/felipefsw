"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { MARCOS_DIARIAS, VALOR_BONUS, tipoMarco } from "@/lib/bonificacoes";

export async function pagarMarco(formData: FormData) {
  const diaristaId = String(formData.get("diaristaId") ?? "");
  const n = Number.parseInt(String(formData.get("marco") ?? ""), 10);
  if (!diaristaId || !(MARCOS_DIARIAS as readonly number[]).includes(n)) return;

  const tipo = tipoMarco(n);
  const ja = await prisma.bonificacao.findFirst({ where: { diaristaId, tipo } });
  if (ja) return;

  await prisma.bonificacao.create({
    data: { diaristaId, tipo, valor: VALOR_BONUS, pago: true, pagoEm: new Date() },
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
