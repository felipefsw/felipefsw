"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { gerarHashSenha, senhaForte } from "@/lib/senha";
import { PAPEIS, exigeEditar, type Papel } from "@/lib/painel/papeis";
import { contextoPainel } from "@/lib/painel/sessao";

const DESTINO = "/painel/admin/usuarios";

/** Só o admin da rede mexe em usuários (seção 3 do book). */
async function exigeAdmin() {
  const ctx = await contextoPainel();
  exigeEditar(ctx.acesso, ctx.storeId, "usuarios");
  return ctx;
}

function papelValido(v: string): v is Papel {
  return (PAPEIS as string[]).includes(v);
}

export async function criarUsuario(formData: FormData) {
  const ctx = await exigeAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const senha = String(formData.get("senha") ?? "");

  if (!name || !email) redirect(`${DESTINO}?erro=dados`);
  if (!senhaForte(senha)) redirect(`${DESTINO}?erro=senha`);

  const jaExiste = await prisma.profile.findUnique({ where: { email }, select: { id: true } });
  if (jaExiste) redirect(`${DESTINO}?erro=email`);

  await prisma.profile.create({
    data: { name, email, phone, senha: gerarHashSenha(senha), createdBy: ctx.userId },
  });

  revalidatePath(DESTINO);
  redirect(`${DESTINO}?ok=criado`);
}

/** Dá (ou troca) o papel de uma pessoa em uma loja. */
export async function darAcesso(formData: FormData) {
  const ctx = await exigeAdmin();

  const userId = String(formData.get("userId") ?? "");
  const storeId = String(formData.get("storeId") ?? "");
  const role = String(formData.get("role") ?? "");
  if (!userId || !storeId || !papelValido(role)) redirect(`${DESTINO}?erro=dados`);

  await prisma.membership.upsert({
    where: { userId_storeId: { userId, storeId } },
    update: { role },
    create: { userId, storeId, role, createdBy: ctx.userId },
  });

  revalidatePath(DESTINO);
  redirect(`${DESTINO}?ok=acesso`);
}

export async function tirarAcesso(formData: FormData) {
  await exigeAdmin();

  const userId = String(formData.get("userId") ?? "");
  const storeId = String(formData.get("storeId") ?? "");
  await prisma.membership.deleteMany({ where: { userId, storeId } });

  revalidatePath(DESTINO);
  redirect(`${DESTINO}?ok=acesso`);
}

export async function alternarAtivo(formData: FormData) {
  const ctx = await exigeAdmin();

  const userId = String(formData.get("userId") ?? "");
  // Ninguém se desativa sozinho: senão a rede fica sem administrador.
  if (userId === ctx.userId) redirect(`${DESTINO}?erro=voce_mesmo`);

  const perfil = await prisma.profile.findUnique({ where: { id: userId }, select: { active: true } });
  if (!perfil) redirect(`${DESTINO}?erro=dados`);

  await prisma.profile.update({ where: { id: userId }, data: { active: !perfil.active } });

  revalidatePath(DESTINO);
  redirect(`${DESTINO}?ok=ativo`);
}

export async function trocarSenha(formData: FormData) {
  await exigeAdmin();

  const userId = String(formData.get("userId") ?? "");
  const senha = String(formData.get("senha") ?? "");
  if (!senhaForte(senha)) redirect(`${DESTINO}?erro=senha`);

  await prisma.profile.update({ where: { id: userId }, data: { senha: gerarHashSenha(senha) } });

  revalidatePath(DESTINO);
  redirect(`${DESTINO}?ok=senha`);
}
