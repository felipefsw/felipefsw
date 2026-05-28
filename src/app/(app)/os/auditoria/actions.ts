"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessao } from "@/lib/auth";
import { executarAgente } from "@/lib/anthropic";
import { AGENTE_AUDITOR_SLUG } from "@/lib/agentes";
import { garantirAgentes } from "@/lib/agentesDb";

// Cria uma execução do Auditor Financeiro a partir do texto bruto colado.
// Salva o input imediatamente (PROCESSANDO), chama o Claude, e atualiza
// para CONCLUIDA com a resposta — ou ERRO se a chamada falhar.
export async function executarAuditoriaSaipos(formData: FormData) {
  const sessao = await getSessao();
  if (!sessao || sessao.tipo !== "gestao") {
    throw new Error("Sem permissão");
  }

  await garantirAgentes();

  const entrada = String(formData.get("entrada") || "").trim();
  const lojaId = String(formData.get("lojaId") || "") || null;
  const tituloLivre = String(formData.get("titulo") || "").trim() || null;

  if (entrada.length < 20) {
    throw new Error("Cole o relatório do Saipos (mínimo 20 caracteres).");
  }

  const agente = await prisma.agente.findUnique({
    where: { slug: AGENTE_AUDITOR_SLUG },
  });
  if (!agente) throw new Error("Agente Auditor Financeiro não encontrado.");

  const exec = await prisma.execAgente.create({
    data: {
      agenteId: agente.id,
      lojaId,
      titulo: tituloLivre,
      entrada,
      status: "PROCESSANDO",
    },
  });

  try {
    const r = await executarAgente({
      systemPrompt: agente.systemPrompt,
      entrada,
      modelo: agente.modelo,
    });
    await prisma.execAgente.update({
      where: { id: exec.id },
      data: {
        status: "CONCLUIDA",
        saida: r.texto,
        modelo: r.modelo,
        inputTokens: r.inputTokens,
        outputTokens: r.outputTokens,
        cacheCreate: r.cacheCreate,
        cacheRead: r.cacheRead,
        duracaoMs: r.duracaoMs,
        concluidoEm: new Date(),
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await prisma.execAgente.update({
      where: { id: exec.id },
      data: { status: "ERRO", erro: msg, concluidoEm: new Date() },
    });
  }

  redirect(`/os/auditoria/${exec.id}`);
}
