"use server";

import { redirect } from "next/navigation";
import { setSessao } from "@/lib/auth";
import { exigeVer } from "@/lib/painel/papeis";
import { contextoPainel } from "@/lib/painel/sessao";

export async function escolherLoja(formData: FormData) {
  const storeId = String(formData.get("storeId") ?? "");
  const ctx = await contextoPainel();

  // Mesma trava do book: só troca para uma loja que a pessoa enxerga.
  exigeVer(ctx.acesso, storeId);

  await setSessao({ tipo: "painel", userId: ctx.userId, storeId });
  redirect("/painel");
}
