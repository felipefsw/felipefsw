"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function responderMensagem(formData: FormData) {
  const diaristaId = String(formData.get("diaristaId") ?? "");
  const texto = String(formData.get("texto") ?? "").trim();
  if (!diaristaId || !texto) return;

  await prisma.$transaction([
    prisma.mensagem.create({ data: { diaristaId, autor: "GESTAO", texto } }),
    prisma.mensagem.updateMany({
      where: { diaristaId, autor: "DIARISTA", lida: false },
      data: { lida: true },
    }),
  ]);
  revalidatePath(`/mensagens/${diaristaId}`);
  revalidatePath("/mensagens");
  revalidatePath("/", "layout");
}

export async function marcarLidas(formData: FormData) {
  const diaristaId = String(formData.get("diaristaId") ?? "");
  if (!diaristaId) return;
  await prisma.mensagem.updateMany({
    where: { diaristaId, autor: "DIARISTA", lida: false },
    data: { lida: true },
  });
  revalidatePath("/mensagens");
  revalidatePath(`/mensagens/${diaristaId}`);
  revalidatePath("/", "layout");
}
