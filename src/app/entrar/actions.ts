"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { entrarDiaristaSessao, limparSessao, setSessao } from "@/lib/auth";
import { conferirSenha, gerarHashSenha, senhaForte } from "@/lib/senha";

const soDigitos = (s: string) => s.replace(/\D/g, "");

// Precisa definir senha quando ainda não há hash (null ou texto legado "123456").
const precisaDefinirSenha = (senha: string | null | undefined) => !senha || !senha.includes(":");

// RH/TI: clica no nome e, no primeiro acesso, cria a senha; depois confere.
export async function entrarComoGestao(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const senha = String(formData.get("senha") ?? "");
  const confirmar = String(formData.get("confirmarSenha") ?? "");
  const m = await prisma.membro.findUnique({ where: { id } });
  if (!m || !m.ativo) redirect("/entrar?perfil=gestao");

  if (precisaDefinirSenha(m.senha)) {
    if (!senhaForte(senha) || senha !== confirmar)
      redirect(`/entrar?perfil=gestao&id=${id}&erro=senha`);
    await prisma.membro.update({ where: { id }, data: { senha: gerarHashSenha(senha) } });
  } else if (!conferirSenha(senha, m.senha)) {
    redirect(`/entrar?perfil=gestao&id=${id}&erro=login`);
  }

  await setSessao({
    tipo: "gestao",
    perfil: m.perfil === "ti" ? "ti" : "rh",
    nome: m.nome,
    papel: m.papel ?? undefined,
  });
  redirect("/");
}

export async function entrarComoLoja(lojaId: string) {
  if (!lojaId) redirect("/entrar?perfil=lojista");
  const loja = await prisma.loja.findUnique({ where: { id: lojaId }, select: { id: true } });
  if (!loja) redirect("/entrar?perfil=lojista");
  await setSessao({ tipo: "loja", lojaId: loja.id });
  redirect("/loja");
}

// Gestor: clica no nome e, no primeiro acesso, cria a senha; depois confere.
export async function entrarComoGestor(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const senha = String(formData.get("senha") ?? "");
  const confirmar = String(formData.get("confirmarSenha") ?? "");
  const gestor = await prisma.gestor.findUnique({
    where: { id },
    include: { lojas: { where: { ativo: true }, select: { id: true }, orderBy: { nome: "asc" } } },
  });
  if (!gestor || !gestor.ativo) redirect("/entrar?perfil=gestor");

  if (precisaDefinirSenha(gestor.senha)) {
    if (!senhaForte(senha) || senha !== confirmar)
      redirect(`/entrar?perfil=gestor&id=${id}&erro=senha`);
    await prisma.gestor.update({ where: { id }, data: { senha: gerarHashSenha(senha) } });
  } else if (!conferirSenha(senha, gestor.senha)) {
    redirect(`/entrar?perfil=gestor&id=${id}&erro=login`);
  }

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
