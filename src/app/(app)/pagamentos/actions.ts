"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function marcarPago(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.escala.update({
    where: { id },
    data: { pago: true, pagoEm: new Date() },
  });
  revalidatePath("/pagamentos");
  revalidatePath("/");
}

export async function desfazerPago(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.escala.update({
    where: { id },
    data: { pago: false, pagoEm: null },
  });
  revalidatePath("/pagamentos");
  revalidatePath("/");
}

// Marca como pagas as diárias indicadas (usado por grupo de marca + diarista).
export async function pagarEscalas(formData: FormData) {
  const ids = formData.getAll("escalaIds").map(String).filter(Boolean);
  if (ids.length === 0) return;
  await prisma.escala.updateMany({
    where: { id: { in: ids }, pago: false },
    data: { pago: true, pagoEm: new Date() },
  });
  revalidatePath("/pagamentos");
  revalidatePath("/");
}

export async function pagarTudoDoDiarista(formData: FormData) {
  const diaristaId = String(formData.get("diaristaId") ?? "");
  if (!diaristaId) return;
  await prisma.escala.updateMany({
    where: { diaristaId, presenca: "PRESENTE", pago: false },
    data: { pago: true, pagoEm: new Date() },
  });
  revalidatePath("/pagamentos");
  revalidatePath("/");
}
