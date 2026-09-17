"use server";

import { redirect } from "next/navigation";
import { limparSessao, setSessao } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { conferirSenha } from "@/lib/senha";
import { carregarAcesso, lojasDoAcesso } from "@/lib/painel/papeis";

export async function entrarNoPainel(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const senha = String(formData.get("senha") ?? "");

  const perfil = await prisma.profile.findUnique({
    where: { email },
    select: { id: true, senha: true, active: true },
  });

  // Mensagem única de propósito: não entrega se o e-mail existe ou não.
  if (!perfil || !perfil.active || !conferirSenha(senha, perfil.senha)) {
    redirect("/painel/entrar?erro=login");
  }

  const acesso = await carregarAcesso(perfil.id);
  const lojas = await lojasDoAcesso(acesso);
  if (lojas.length === 0) {
    await setSessao({ tipo: "painel", userId: perfil.id, storeId: "" });
    redirect("/painel/sem-acesso");
  }

  await setSessao({ tipo: "painel", userId: perfil.id, storeId: lojas[0].id });
  redirect(lojas.length > 1 ? "/painel/trocar-loja" : "/painel");
}

export async function sairDoPainel() {
  await limparSessao();
  redirect("/painel/entrar");
}
