"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export async function confirmarPorLink(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const nome = String(formData.get("nome") ?? "").trim();
  if (!token || !nome) return;

  const escala = await prisma.escala.findUnique({
    where: { tokenConfirmacao: token },
    select: { id: true, diaristaId: true },
  });
  if (!escala) return;

  await prisma.$transaction([
    prisma.diarista.update({ where: { id: escala.diaristaId }, data: { nome } }),
    prisma.escala.update({ where: { id: escala.id }, data: { presenca: "PRESENTE" } }),
  ]);

  revalidatePath(`/confirmar/${token}`);
  revalidatePath("/escala");
  revalidatePath("/");
  redirect(`/confirmar/${token}`);
}
