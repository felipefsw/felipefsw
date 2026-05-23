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
