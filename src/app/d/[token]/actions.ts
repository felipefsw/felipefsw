"use server";

import { revalidatePath } from "next/cache";
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
