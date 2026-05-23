"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { FUNCOES } from "@/lib/funcoes";
import { parseBRLToCents } from "@/lib/format";

export async function salvarValoresFuncao(formData: FormData) {
  for (let i = 0; i < FUNCOES.length; i++) {
    const funcao = FUNCOES[i];
    const valor = parseBRLToCents(String(formData.get(`valor_${i}`) ?? ""));
    await prisma.valorFuncao.upsert({
      where: { funcao },
      update: { valor },
      create: { funcao, valor },
    });
  }
  revalidatePath("/valores-funcao");
  redirect("/valores-funcao");
}
