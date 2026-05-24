"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { contextoLoja, getSessao, setSessao } from "@/lib/auth";
import { dentroDaJanelaAgendamento, isHHMM, isISODate, turnoFinalizado } from "@/lib/dates";
import { parseBRLToCents } from "@/lib/format";
import { valorProporcional } from "@/lib/geo";
import { notificarNovaDiaria } from "@/lib/push";

// Loja ativa da sessão (loja avulsa ou gestor). Redireciona se não houver.
async function lojaSessaoId(): Promise<string> {
  const ctx = contextoLoja(await getSessao());
  if (!ctx) redirect("/entrar");
  return ctx.lojaId;
}

// A loja precisa avaliar as diárias já encerradas antes de abrir vaga/convocar.
async function temPendenteAvaliacao(lojaId: string): Promise<boolean> {
  const escalas = await prisma.escala.findMany({
    where: { lojaId, presenca: "PRESENTE" },
    select: { data: true, horaFim: true, avaliacao: { select: { id: true } } },
  });
  return escalas.some((e) => !e.avaliacao && turnoFinalizado(e.data, e.horaFim));
}

export async function criarRequisicaoLoja(formData: FormData) {
  const sessao = await getSessao();
  const ctx = contextoLoja(sessao);
  if (!ctx) redirect("/entrar");

  // Gestor pode escolher para qual das SUAS lojas é a requisição.
  let lojaId = ctx.lojaId;
  if (sessao?.tipo === "gestor") {
    const escolhida = String(formData.get("lojaId") ?? "");
    if (escolhida) {
      const ok = await prisma.loja.findFirst({
        where: { id: escolhida, gestorId: sessao.gestorId },
        select: { id: true },
      });
      if (!ok) redirect("/entrar");
      lojaId = escolhida;
    }
  }

  const data = String(formData.get("data") ?? "");
  const horaInicio = String(formData.get("horaInicio") ?? "");
  const horaFim = String(formData.get("horaFim") ?? "");
  const funcao = String(formData.get("funcao") ?? "").trim() || null;
  const quantidade = Math.max(1, Number.parseInt(String(formData.get("quantidade") ?? "1"), 10) || 1);
  const valorDiaria = parseBRLToCents(String(formData.get("valorDiaria") ?? ""));
  const observacoes = String(formData.get("observacoes") ?? "").trim() || null;

  if (
    !isISODate(data) ||
    !dentroDaJanelaAgendamento(data) ||
    !isHHMM(horaInicio) ||
    !isHHMM(horaFim) ||
    valorDiaria <= 0
  ) {
    return;
  }

  if (await temPendenteAvaliacao(lojaId)) redirect("/loja?erro=avalie");

  const convidadoIds = [
    ...new Set(
      [1, 2, 3].map((i) => String(formData.get(`convidado${i}`) ?? "")).filter(Boolean),
    ),
  ];

  await prisma.requisicao.create({
    data: {
      lojaId,
      data,
      horaInicio,
      horaFim,
      funcao,
      quantidade,
      valorDiaria,
      observacoes,
      convidados: { connect: convidadoIds.map((id) => ({ id })) },
    },
  });

  await notificarNovaDiaria(lojaId, data, convidadoIds);

  revalidatePath("/loja");
  revalidatePath("/requisicoes");
  redirect("/loja");
}

export async function trocarLoja(formData: FormData) {
  const sessao = await getSessao();
  if (!sessao || sessao.tipo !== "gestor") redirect("/entrar");
  const lojaId = String(formData.get("lojaId") ?? "");
  const ok = await prisma.loja.findFirst({
    where: { id: lojaId, gestorId: sessao.gestorId },
    select: { id: true },
  });
  if (!ok) redirect("/entrar");
  await setSessao({ tipo: "gestor", gestorId: sessao.gestorId, lojaId });
  redirect("/loja");
}

// Avaliação por estrelas (1 a 5), com 1 toque — sem abrir página.
export async function avaliarComEstrelas(escalaId: string, estrelas: number) {
  const lojaId = await lojaSessaoId();
  const n = Math.round(estrelas);
  if (!escalaId || n < 1 || n > 5) return;

  const escala = await prisma.escala.findUnique({
    where: { id: escalaId },
    select: { lojaId: true, diaristaId: true },
  });
  if (!escala || escala.lojaId !== lojaId) return;

  await prisma.avaliacao.upsert({
    where: { escalaId },
    update: { estrelas: n },
    create: { escalaId, diaristaId: escala.diaristaId, estrelas: n },
  });

  revalidatePath("/loja");
  revalidatePath(`/diaristas/${escala.diaristaId}`);
}

export async function decidirRequisicao(formData: FormData) {
  const lojaId = await lojaSessaoId();
  const id = String(formData.get("id") ?? "");
  const diaristaIds = formData.getAll("diaristaIds").map(String).filter(Boolean);
  if (!id || diaristaIds.length === 0) return;

  const requisicao = await prisma.requisicao.findUnique({ where: { id } });
  if (!requisicao || requisicao.lojaId !== lojaId || requisicao.status !== "ABERTA") return;

  // só aceita quem se inscreveu, sem conflito de agenda e sem bloqueio nesta loja
  const [inscritos, jaEscalados, bloqueados] = await Promise.all([
    prisma.inscricao.findMany({
      where: { requisicaoId: id, diaristaId: { in: diaristaIds } },
      select: { diaristaId: true },
    }),
    prisma.escala.findMany({
      where: { data: requisicao.data, diaristaId: { in: diaristaIds } },
      select: { diaristaId: true },
    }),
    prisma.bloqueio.findMany({
      where: {
        lojaId,
        diaristaId: { in: diaristaIds },
        OR: [{ ate: null }, { ate: { gt: new Date() } }],
      },
      select: { diaristaId: true },
    }),
  ]);
  const inscritosSet = new Set(inscritos.map((i) => i.diaristaId));
  const ocupados = new Set(jaEscalados.map((e) => e.diaristaId));
  const bloq = new Set(bloqueados.map((b) => b.diaristaId));
  const escolhidos = diaristaIds.filter(
    (d) => inscritosSet.has(d) && !ocupados.has(d) && !bloq.has(d),
  );
  if (escolhidos.length === 0) return;

  await prisma.$transaction([
    prisma.escala.createMany({
      data: escolhidos.map((diaristaId) => ({
        diaristaId,
        lojaId: requisicao.lojaId,
        data: requisicao.data,
        horaInicio: requisicao.horaInicio,
        horaFim: requisicao.horaFim,
        valor: requisicao.valorDiaria,
        requisicaoId: requisicao.id,
      })),
    }),
    prisma.requisicao.update({ where: { id }, data: { status: "ATENDIDA" } }),
    prisma.inscricao.updateMany({
      where: { requisicaoId: id, diaristaId: { in: escolhidos } },
      data: { status: "ACEITA" },
    }),
  ]);

  revalidatePath("/loja");
  revalidatePath("/requisicoes");
  redirect("/loja");
}

export async function registrarCheckout(formData: FormData) {
  const lojaId = await lojaSessaoId();
  const escalaId = String(formData.get("escalaId") ?? "");
  if (!escalaId) return;

  const escala = await prisma.escala.findUnique({
    where: { id: escalaId },
    select: { lojaId: true, valor: true, horaInicio: true, horaFim: true, checkoutEm: true },
  });
  if (!escala || escala.lojaId !== lojaId || escala.checkoutEm) return;

  const agora = new Date();
  const valorPago = valorProporcional(escala.valor, escala.horaInicio, escala.horaFim, agora);
  await prisma.escala.update({
    where: { id: escalaId },
    data: { checkoutEm: agora, valorPago },
  });
  revalidatePath("/loja");
  revalidatePath("/");
  revalidatePath("/pagamentos");
}

export async function convocarDiarista(formData: FormData) {
  const lojaId = await lojaSessaoId();
  const diaristaId = String(formData.get("diaristaId") ?? "");
  const data = String(formData.get("data") ?? "");
  if (!diaristaId || !isISODate(data) || !dentroDaJanelaAgendamento(data)) return;
  if (await temPendenteAvaliacao(lojaId)) redirect("/loja?erro=avalie");

  await prisma.convocacao.create({
    data: { lojaId, diaristaId, data },
  });
  revalidatePath("/loja");
}

export async function bloquearDiaristaLoja(formData: FormData) {
  const lojaId = await lojaSessaoId();
  const diaristaId = String(formData.get("diaristaId") ?? "");
  const dias = Number.parseInt(String(formData.get("dias") ?? ""), 10);
  if (!diaristaId || ![7, 14, 21].includes(dias)) return;

  const ate = new Date(Date.now() + dias * 24 * 60 * 60 * 1000);
  await prisma.bloqueio.create({
    data: { lojaId, diaristaId, origem: "LOJA", ate },
  });
  revalidatePath("/loja");
}

export async function desbloquearDiaristaLoja(formData: FormData) {
  const lojaId = await lojaSessaoId();
  const diaristaId = String(formData.get("diaristaId") ?? "");
  if (!diaristaId) return;

  // A loja só remove os próprios bloqueios (temporários), nunca os do RH.
  await prisma.bloqueio.deleteMany({
    where: { lojaId, diaristaId, origem: "LOJA" },
  });
  revalidatePath("/loja");
}
