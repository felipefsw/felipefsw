"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { acessoSemSenha, entrarDiaristaSessao, limparSessao, setSessao } from "@/lib/auth";
import { conferirSenha } from "@/lib/senha";

const soDigitos = (s: string) => s.replace(/\D/g, "");

// Tem senha definida (hash com ":")? Senão, é primeiro acesso (só pelo link).
const semSenha = (senha: string | null | undefined) => !senha || !senha.includes(":");

// RH/TI: clica no nome e digita a senha. 1º acesso/reset é só pelo link secreto.
export async function entrarComoGestao(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const senha = String(formData.get("senha") ?? "");
  const m = await prisma.membro.findUnique({ where: { id } });
  if (!m || !m.ativo) redirect("/entrar?perfil=gestao");
  if (!acessoSemSenha()) {
    if (semSenha(m.senha)) redirect(`/entrar?perfil=gestao&id=${id}&erro=semsenha`);
    if (!conferirSenha(senha, m.senha)) redirect(`/entrar?perfil=gestao&id=${id}&erro=login`);
  }

  await setSessao({
    tipo: "gestao",
    perfil: m.perfil === "ti" ? "ti" : "rh",
    nome: m.nome,
    papel: m.papel ?? undefined,
  });
  redirect("/");
}

// Loja (lojista): clica na loja e digita a senha. 1º acesso/reset é só pelo link.
export async function entrarComoLoja(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const senha = String(formData.get("senha") ?? "");
  const loja = await prisma.loja.findUnique({ where: { id }, select: { id: true, senha: true } });
  if (!loja) redirect("/entrar?perfil=lojista");
  if (!acessoSemSenha()) {
    if (semSenha(loja.senha)) redirect(`/entrar?perfil=lojista&id=${id}&erro=semsenha`);
    if (!conferirSenha(senha, loja.senha)) redirect(`/entrar?perfil=lojista&id=${id}&erro=login`);
  }

  await setSessao({ tipo: "loja", lojaId: loja.id });
  redirect("/loja");
}

// Gestor: clica no nome e digita a senha. 1º acesso/reset é só pelo link secreto.
export async function entrarComoGestor(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const senha = String(formData.get("senha") ?? "");
  const gestor = await prisma.gestor.findUnique({
    where: { id },
    include: { lojas: { where: { ativo: true }, select: { id: true }, orderBy: { nome: "asc" } } },
  });
  if (!gestor || !gestor.ativo) redirect("/entrar?perfil=gestor");
  if (!acessoSemSenha()) {
    if (!gestor.aprovado) redirect("/entrar?perfil=gestor");
    if (semSenha(gestor.senha)) redirect(`/entrar?perfil=gestor&id=${id}&erro=semsenha`);
    if (!conferirSenha(senha, gestor.senha)) redirect(`/entrar?perfil=gestor&id=${id}&erro=login`);
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
  if (!acessoSemSenha()) {
    // Primeiro acesso é pelo link pessoal (enviado no WhatsApp), não pelo CPF.
    if (!d.senha) {
      redirect("/entrar?perfil=diarista&erro=semsenha");
    }
    if (!conferirSenha(senha, d.senha)) {
      redirect("/entrar?perfil=diarista&erro=senha");
    }
  }
  await entrarDiaristaSessao(d.id);
  redirect(`/d/${d.token}`);
}

// TEMPORÁRIO (fase de testes): entra como um diarista escolhido numa lista, sem senha.
export async function entrarDiaristaPorId(formData: FormData) {
  if (!acessoSemSenha()) redirect("/entrar?perfil=diarista");
  const id = String(formData.get("id") ?? "");
  const d = await prisma.diarista.findUnique({ where: { id }, select: { id: true, token: true } });
  if (!d) redirect("/entrar?perfil=diarista");
  await entrarDiaristaSessao(d.id);
  redirect(`/d/${d.token}`);
}

// TEMPORÁRIO (fase de testes): entra como RH ou TI sem senha e sem precisar de cadastro.
export async function entrarGestaoTeste(formData: FormData) {
  if (!acessoSemSenha()) redirect("/entrar?perfil=gestao");
  const perfil = String(formData.get("perfil") ?? "rh") === "ti" ? "ti" : "rh";
  await setSessao({
    tipo: "gestao",
    perfil,
    nome: perfil === "ti" ? "TI (teste)" : "RH (teste)",
  });
  redirect("/");
}

export async function sair() {
  await limparSessao();
  redirect("/entrar");
}

// TEMPORÁRIO: acesso de configuração sem senha, para a fase inicial.
// REMOVER quando o login por senha/link estiver ativo (é uma porta aberta).
export async function entrarConfiguracao() {
  await setSessao({ tipo: "gestao", perfil: "rh", nome: "Configuração" });
  redirect("/");
}
