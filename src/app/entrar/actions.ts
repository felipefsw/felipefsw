"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { entrarDiaristaSessao, limparSessao, setSessao } from "@/lib/auth";
import { membroEquipe } from "@/lib/equipe";
import { conferirSenha } from "@/lib/senha";

const soDigitos = (s: string) => s.replace(/\D/g, "");

// SEM SENHA por enquanto: entra só clicando (modo de testes/simulação).
// Recebe o id da pessoa da equipe (RH/TI); aceita "rh"/"ti" como atalho legado.
export async function entrarComoGestao(membroId: string) {
  const m = membroEquipe(membroId);
  if (m) {
    await setSessao({ tipo: "gestao", perfil: m.perfil, nome: m.nome, papel: m.papel });
  } else {
    await setSessao({ tipo: "gestao", perfil: membroId === "ti" ? "ti" : "rh" });
  }
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
  const senha = String(formData.get("senha") ?? "");
  if (!cpf) redirect("/entrar?perfil=diarista&erro=diarista");

  const diaristas = await prisma.diarista.findMany({
    where: { cpf: { not: null } },
    select: { id: true, token: true, cpf: true, senha: true },
  });
  const d = diaristas.find((x) => soDigitos(x.cpf ?? "") === cpf);

  if (!d) {
    // não cadastrado ainda → leva ao cadastro
    redirect("/sou-diarista");
  }
  // Primeiro acesso (sem senha definida): vai ao link pessoal para criar a senha.
  if (!d.senha) {
    await entrarDiaristaSessao(d.id);
    redirect(`/d/${d.token}`);
  }
  // Já tem senha: confere.
  if (!conferirSenha(senha, d.senha)) {
    redirect("/entrar?perfil=diarista&erro=senha");
  }
  await entrarDiaristaSessao(d.id);
  redirect(`/d/${d.token}`);
}

export async function sair() {
  await limparSessao();
  redirect("/entrar");
}
