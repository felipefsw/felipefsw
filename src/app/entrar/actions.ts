"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { limparSessao, senhaGestao, setSessao } from "@/lib/auth";

const soDigitos = (s: string) => s.replace(/\D/g, "");

export async function loginGestao(formData: FormData) {
  const perfil = String(formData.get("perfil") ?? "") === "ti" ? "ti" : "rh";
  const senha = String(formData.get("senha") ?? "");

  if (senha !== senhaGestao(perfil)) {
    redirect("/entrar?erro=gestao");
  }
  await setSessao({ tipo: "gestao", perfil });
  redirect("/");
}

export async function loginLoja(formData: FormData) {
  const cnpj = soDigitos(String(formData.get("cnpj") ?? ""));
  const senha = String(formData.get("senha") ?? "");
  if (!cnpj) redirect("/entrar?erro=loja");

  const lojas = await prisma.loja.findMany({
    where: { ativo: true, cnpj: { not: null } },
    select: { id: true, cnpj: true, senha: true },
  });
  const loja = lojas.find((l) => soDigitos(l.cnpj ?? "") === cnpj);

  if (!loja || loja.senha !== senha) {
    redirect("/entrar?erro=loja");
  }
  await setSessao({ tipo: "loja", lojaId: loja.id });
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
