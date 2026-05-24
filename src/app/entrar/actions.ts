"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { limparSessao, setSessao } from "@/lib/auth";

const soDigitos = (s: string) => s.replace(/\D/g, "");

// SEM SENHA por enquanto: entra só clicando (modo de testes/simulação).
export async function entrarComoGestao(perfil: "rh" | "ti") {
  await setSessao({ tipo: "gestao", perfil: perfil === "ti" ? "ti" : "rh" });
  redirect("/");
}

export async function entrarComoLoja(lojaId: string) {
  if (!lojaId) redirect("/entrar?perfil=lojista");
  const loja = await prisma.loja.findUnique({ where: { id: lojaId }, select: { id: true } });
  if (!loja) redirect("/entrar?perfil=lojista");
  await setSessao({ tipo: "loja", lojaId: loja.id });
  redirect("/loja");
}

export async function entrarComoGestor(gestorId: string) {
  if (!gestorId) redirect("/entrar?perfil=gestor");
  const gestor = await prisma.gestor.findUnique({
    where: { id: gestorId },
    include: { lojas: { where: { ativo: true }, select: { id: true }, orderBy: { nome: "asc" } } },
  });
  if (!gestor) redirect("/entrar?perfil=gestor");
  await setSessao({ tipo: "gestor", gestorId: gestor.id, lojaId: gestor.lojas[0]?.id ?? "" });
  redirect("/loja");
}

export async function entrarDiarista(formData: FormData) {
  const cpf = soDigitos(String(formData.get("cpf") ?? ""));
  if (!cpf) redirect("/entrar?erro=diarista");

  const diaristas = await prisma.diarista.findMany({
    where: { cpf: { not: null } },
    select: { token: true, cpf: true },
  });
  const d = diaristas.find((x) => soDigitos(x.cpf ?? "") === cpf);

  if (!d) {
    // não cadastrado ainda → leva ao cadastro
    redirect("/sou-diarista");
  }
  redirect(`/d/${d.token}`);
}

export async function sair() {
  await limparSessao();
  redirect("/entrar");
}
