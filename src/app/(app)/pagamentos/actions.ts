"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

// Alterna pago/não pago num único botão (verde = pago, vermelho = não pago).
export async function togglePago(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const e = await prisma.escala.findUnique({ where: { id }, select: { pago: true } });
  if (!e) return;
  await prisma.escala.update({
    where: { id },
    data: { pago: !e.pago, pagoEm: e.pago ? null : new Date() },
  });
  revalidatePath("/pagamentos");
  revalidatePath("/");
}
