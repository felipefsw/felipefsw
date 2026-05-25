"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { cpfValido, soCpfDigitos } from "@/lib/cpf";
import { BLOQUEIO_PARA_SEMPRE } from "@/lib/limites";

// CPF (dígitos) já usado por outro diarista? Evita cadastro duplicado.
async function cpfDuplicado(cpf: string, excetoId?: string): Promise<boolean> {
  const alvo = soCpfDigitos(cpf);
  if (!alvo) return false;
  const existentes = await prisma.diarista.findMany({
    where: { cpf: { not: null }, ...(excetoId ? { id: { not: excetoId } } : {}) },
    select: { cpf: true },
  });
  return existentes.some((d) => soCpfDigitos(d.cpf) === alvo);
}

// Lê as lojas preferidas do formulário, remove vazias e duplicadas (máx. 5).
function lojasPreferidasIds(formData: FormData): { id: string }[] {
  const ids = [1, 2, 3, 4, 5]
    .map((i) => String(formData.get(`lojaPreferida${i}`) ?? ""))
    .filter(Boolean);
  return [...new Set(ids)].slice(0, 5).map((id) => ({ id }));
}

export async function createDiarista(formData: FormData) {
  const nome = String(formData.get("nome") ?? "").trim();
  if (!nome) return;
  if (!cpfValido(String(formData.get("cpf") ?? ""))) redirect("/diaristas/nova?erro=cpf");
  if (await cpfDuplicado(String(formData.get("cpf") ?? ""))) redirect("/diaristas/nova?erro=cpfdup");

  await prisma.diarista.create({
    data: {
      nome,
      cpf: String(formData.get("cpf") ?? "").trim() || null,
      fotoUrl: String(formData.get("fotoUrl") ?? "").trim() || null,
      funcao: String(formData.get("funcao") ?? "").trim() || null,
      telefone: String(formData.get("telefone") ?? "").trim() || null,
      chavePix: String(formData.get("chavePix") ?? "").trim() || null,
      lojasPreferidas: { connect: lojasPreferidasIds(formData) },
    },
  });
  revalidatePath("/diaristas");
  redirect("/diaristas");
}

export async function updateDiarista(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const nome = String(formData.get("nome") ?? "").trim();
  if (!id || !nome) return;
  if (!cpfValido(String(formData.get("cpf") ?? ""))) redirect(`/diaristas/${id}?erro=cpf`);
  if (await cpfDuplicado(String(formData.get("cpf") ?? ""), id)) {
    redirect(`/diaristas/${id}?erro=cpfdup`);
  }

  await prisma.diarista.update({
    where: { id },
    data: {
      nome,
      cpf: String(formData.get("cpf") ?? "").trim() || null,
      fotoUrl: String(formData.get("fotoUrl") ?? "").trim() || null,
      funcao: String(formData.get("funcao") ?? "").trim() || null,
      telefone: String(formData.get("telefone") ?? "").trim() || null,
      chavePix: String(formData.get("chavePix") ?? "").trim() || null,
      lojasPreferidas: { set: lojasPreferidasIds(formData) },
    },
  });
  revalidatePath("/diaristas");
  redirect("/diaristas");
}

export async function toggleDiaristaAtivo(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const d = await prisma.diarista.findUnique({ where: { id } });
  if (!d) return;
  await prisma.diarista.update({ where: { id }, data: { ativo: !d.ativo } });
  revalidatePath("/diaristas");
}

export async function bloquearPermanente(formData: FormData) {
  const diaristaId = String(formData.get("diaristaId") ?? "");
  const lojaId = String(formData.get("lojaId") ?? "");
  if (!diaristaId || !lojaId) return;
  await prisma.bloqueio.create({
    data: { diaristaId, lojaId, origem: "RH", ate: null },
  });
  revalidatePath(`/diaristas/${diaristaId}`);
}

// Bloqueia a diarista em VÁRIAS lojas de uma vez (permanente, origem RH).
export async function bloquearEmLojas(formData: FormData) {
  const diaristaId = String(formData.get("diaristaId") ?? "");
  const lojaIds = [...new Set(formData.getAll("lojaIds").map(String).filter(Boolean))];
  if (!diaristaId || lojaIds.length === 0) return;

  const existentes = await prisma.bloqueio.findMany({
    where: { diaristaId, origem: "RH", lojaId: { in: lojaIds } },
    select: { lojaId: true },
  });
  const jaBloqueadas = new Set(existentes.map((b) => b.lojaId));
  const novas = lojaIds.filter((id) => !jaBloqueadas.has(id));
  if (novas.length > 0) {
    await prisma.bloqueio.createMany({
      data: novas.map((lojaId) => ({ diaristaId, lojaId, origem: "RH", ate: null })),
    });
  }
  revalidatePath(`/diaristas/${diaristaId}`);
}

export async function removerBloqueio(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const diaristaId = String(formData.get("diaristaId") ?? "");
  if (!id) return;
  await prisma.bloqueio.delete({ where: { id } });
  if (diaristaId) revalidatePath(`/diaristas/${diaristaId}`);
}

// Bloqueio GLOBAL (RH): a diarista não recebe nenhuma diária por 7/14/30 dias ou "sempre".
export async function bloquearGlobal(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const dias = String(formData.get("dias") ?? "");
  if (!id) return;

  let ate: Date;
  if (dias === "sempre") {
    ate = BLOQUEIO_PARA_SEMPRE;
  } else {
    const n = Number.parseInt(dias, 10);
    if (![7, 14, 30].includes(n)) return;
    ate = new Date(Date.now() + n * 24 * 60 * 60 * 1000);
  }

  await prisma.diarista.update({ where: { id }, data: { bloqueadoAte: ate } });
  revalidatePath("/diaristas");
  revalidatePath(`/diaristas/${id}`);
}

// Aprova um autocadastro (libera a diarista para pegar diárias).
export async function aprovarDiaristaCadastro(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.diarista.update({ where: { id }, data: { aprovado: true } });
  revalidatePath("/diaristas");
  revalidatePath("/");
}

// Redefine a senha da diarista: limpa a senha atual. No próximo acesso (quando o
// login por senha estiver ativo) ela cria uma nova. Em modo sem senha, não afeta o acesso.
export async function redefinirSenhaDiarista(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.diarista.update({ where: { id }, data: { senha: null } });
  revalidatePath(`/diaristas/${id}`);
}

export async function desbloquearGlobal(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.diarista.update({ where: { id }, data: { bloqueadoAte: null } });
  revalidatePath("/diaristas");
  revalidatePath(`/diaristas/${id}`);
}

export async function deleteDiarista(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.diarista.delete({ where: { id } });
  revalidatePath("/diaristas");
  redirect("/diaristas");
}
