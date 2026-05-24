"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { gerarTokenSenha } from "@/lib/senha";
import { limitePassou } from "@/lib/rateLimit";

// Autocadastro de lojista/gestor: cria um pedido (gestor não aprovado) com as
// lojas escolhidas. O RH/TI aprova depois — assim ele só acessa as lojas dele.
export async function solicitarAcesso(formData: FormData) {
  const nome = String(formData.get("nome") ?? "").trim();
  const telefone = String(formData.get("telefone") ?? "").trim();
  const lojaIds = [...new Set(formData.getAll("lojaIds").map(String).filter(Boolean))];

  // Anti-bot: honeypot + limite por IP.
  if (String(formData.get("confirmacao") ?? "").trim()) redirect("/entrar");
  const ip = ((await headers()).get("x-forwarded-for") ?? "").split(",")[0].trim() || "anon";
  if (!limitePassou(`acesso:${ip}`, 8, 3_600_000)) redirect("/solicitar-acesso?erro=limite");

  if (!nome || lojaIds.length === 0) redirect("/solicitar-acesso?erro=campos");

  // Confere que as lojas existem e estão ativas.
  const lojas = await prisma.loja.findMany({
    where: { id: { in: lojaIds }, ativo: true },
    select: { id: true },
  });
  if (lojas.length === 0) redirect("/solicitar-acesso?erro=campos");

  await prisma.gestor.create({
    data: {
      nome,
      telefone: telefone || null,
      usuario: `auto-${gerarTokenSenha().slice(0, 16)}`,
      aprovado: false,
      lojas: { connect: lojas.map((l) => ({ id: l.id })) },
    },
  });

  redirect("/solicitar-acesso?ok=1");
}
