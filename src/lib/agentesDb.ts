import { prisma } from "@/lib/prisma";
import { AGENTES_SEMENTE } from "@/lib/agentes";

// Garante que todos os agentes-semente existam no banco.
// Idempotente: roda em toda visita à área /os, mas só insere os que faltarem.
// O System Prompt no banco tem precedência — uma vez criado, o RH edita pelo
// painel e o código não sobrescreve.
let _semeado = false;
export async function garantirAgentes() {
  if (_semeado) return;
  const existentes = await prisma.agente.findMany({ select: { slug: true } });
  const slugsExistentes = new Set(existentes.map((a) => a.slug));
  const faltando = AGENTES_SEMENTE.filter((a) => !slugsExistentes.has(a.slug));
  if (faltando.length > 0) {
    await prisma.agente.createMany({
      data: faltando.map((a) => ({
        slug: a.slug,
        nome: a.nome,
        descricao: a.descricao,
        systemPrompt: a.systemPrompt,
      })),
    });
  }
  _semeado = true;
}
