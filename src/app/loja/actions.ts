"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { contextoLoja, getSessao, setSessao } from "@/lib/auth";
import { dentroDaJanelaAgendamento, isHHMM, isISODate, turnoFinalizado } from "@/lib/dates";
import { parseBRLToCents } from "@/lib/format";
import { valorProporcional } from "@/lib/geo";
import {
  notificarConvite,
  notificarNovaDiaria,
  notificarPagamentoDaEscala,
  notificarVagaPreenchida,
} from "@/lib/push";
import { podeMaisUmaNaSemana, temBloqueioGlobal } from "@/lib/limites";
import { cancelarConvocacoesPendentes, limparOutrasInscricoesDoDia } from "@/lib/escalas";
import { uploadImagemResultado } from "@/lib/storage";

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
    select: { data: true, horaInicio: true, horaFim: true, avaliacao: { select: { id: true } } },
  });
  return escalas.some((e) => !e.avaliacao && turnoFinalizado(e.data, e.horaInicio, e.horaFim));
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
        where: { id: escolhida, gestores: { some: { id: sessao.gestorId } } },
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

  // Permitido criar mais de uma vaga igual (mesma função/horário) - pode haver
  // urgência ou replanejamento. Não bloqueamos duplicadas.

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
    where: { id: lojaId, gestores: { some: { id: sessao.gestorId } } },
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

// Aprova UM candidato com 1 clique. Cria a escala, marca a inscrição e fecha
// a requisição quando todas as vagas forem preenchidas.
export async function aprovarCandidato(requisicaoId: string, diaristaId: string) {
  const lojaId = await lojaSessaoId();
  if (!requisicaoId || !diaristaId) return;

  const requisicao = await prisma.requisicao.findUnique({
    where: { id: requisicaoId },
    include: { _count: { select: { escalas: true } } },
  });
  if (!requisicao || requisicao.lojaId !== lojaId || requisicao.status !== "ABERTA") return;
  if (requisicao._count.escalas >= requisicao.quantidade) return;

  const [inscrito, jaNoDia, bloqueio, bloqGlobal] = await Promise.all([
    prisma.inscricao.findUnique({
      where: { requisicaoId_diaristaId: { requisicaoId, diaristaId } },
      select: { id: true },
    }),
    prisma.escala.findFirst({ where: { data: requisicao.data, diaristaId }, select: { id: true } }),
    prisma.bloqueio.findFirst({
      where: { lojaId, diaristaId, OR: [{ ate: null }, { ate: { gt: new Date() } }] },
      select: { id: true },
    }),
    temBloqueioGlobal(diaristaId),
  ]);
  if (!inscrito || jaNoDia || bloqueio || bloqGlobal) return;
  if (!(await podeMaisUmaNaSemana(diaristaId, lojaId, requisicao.data))) return;

  await prisma.$transaction([
    prisma.escala.create({
      data: {
        diaristaId,
        lojaId: requisicao.lojaId,
        data: requisicao.data,
        horaInicio: requisicao.horaInicio,
        horaFim: requisicao.horaFim,
        valor: requisicao.valorDiaria,
        requisicaoId: requisicao.id,
      },
    }),
    prisma.inscricao.update({
      where: { requisicaoId_diaristaId: { requisicaoId, diaristaId } },
      data: { status: "ACEITA" },
    }),
  ]);

  // Trava o diarista no dia: tira candidaturas pendentes dele em outras lojas.
  await limparOutrasInscricoesDoDia(diaristaId, requisicao.data, requisicaoId);

  if (requisicao._count.escalas + 1 >= requisicao.quantidade) {
    await prisma.requisicao.update({ where: { id: requisicaoId }, data: { status: "ATENDIDA" } });
    await cancelarConvocacoesPendentes(requisicaoId, diaristaId);
    await notificarVagaPreenchida(requisicaoId);
  }

  revalidatePath("/loja");
  revalidatePath("/requisicoes");
}

// Marca/desmarca uma diária como paga (só loja/gestor têm acesso a esta área).
export async function marcarPagoDiaria(escalaId: string, pago: boolean) {
  // Quem paga pelo lado da loja é o GESTOR (lojista só visualiza).
  const ctx = contextoLoja(await getSessao());
  if (!ctx || !ctx.gestorId || !escalaId) return;
  const escala = await prisma.escala.findUnique({
    where: { id: escalaId },
    select: { lojaId: true },
  });
  if (!escala) return;
  // O gestor pode pagar diárias de qualquer loja que ele gerencia (não só a ativa).
  const autorizado =
    (await prisma.loja.count({
      where: { id: escala.lojaId, gestores: { some: { id: ctx.gestorId } } },
    })) > 0;
  if (!autorizado) return;
  await prisma.escala.update({
    where: { id: escalaId },
    data: { pago, pagoEm: pago ? new Date() : null },
  });
  revalidatePath("/loja");
  revalidatePath("/pagamentos");
  revalidatePath("/");
}

// Recusa um candidato (remove a inscrição dele desta vaga).
export async function recusarCandidato(requisicaoId: string, diaristaId: string) {
  const lojaId = await lojaSessaoId();
  if (!requisicaoId || !diaristaId) return;
  const requisicao = await prisma.requisicao.findUnique({
    where: { id: requisicaoId },
    select: { lojaId: true },
  });
  if (!requisicao || requisicao.lojaId !== lojaId) return;
  await prisma.inscricao.deleteMany({ where: { requisicaoId, diaristaId } });
  revalidatePath("/loja");
  revalidatePath("/requisicoes");
}

// A loja/gestor cancela um pedido em aberto (some da lista; desconvoca pendentes
// e remove candidaturas pendentes). Quem já confirmou mantém a diária.
export async function cancelarRequisicaoLoja(formData: FormData) {
  const requisicaoId = String(formData.get("requisicaoId") ?? "");
  if (!requisicaoId) return;
  const permitidas = await lojasDaSessao();
  if (permitidas.length === 0) return;

  const req = await prisma.requisicao.findUnique({
    where: { id: requisicaoId },
    select: { lojaId: true, status: true },
  });
  if (!req || !permitidas.includes(req.lojaId) || req.status !== "ABERTA") {
    revalidatePath("/loja");
    return;
  }

  await prisma.requisicao.update({ where: { id: requisicaoId }, data: { status: "CANCELADA" } });
  await cancelarConvocacoesPendentes(requisicaoId);
  await prisma.inscricao.deleteMany({ where: { requisicaoId, status: "PENDENTE" } });
  revalidatePath("/loja");
  revalidatePath("/requisicoes");
  revalidatePath("/");
}

// Liga/desliga a permissão de mais de 2 diárias por semana (a loja assume o risco).
export async function alternarLimiteSemana() {
  const lojaId = await lojaSessaoId();
  const loja = await prisma.loja.findUnique({
    where: { id: lojaId },
    select: { permiteMais2Semana: true },
  });
  if (!loja) return;
  await prisma.loja.update({
    where: { id: lojaId },
    data: { permiteMais2Semana: !loja.permiteMais2Semana },
  });
  revalidatePath("/loja");
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
  await notificarPagamentoDaEscala(escalaId);
  revalidatePath("/loja");
  revalidatePath("/");
  revalidatePath("/pagamentos");
}

// Adiciona uma foto do ambiente da loja (máx. 5).
export async function adicionarFotoLoja(
  formData: FormData,
): Promise<{ ok: boolean; erro?: string }> {
  const lojaId = await lojaSessaoId();
  const foto = formData.get("foto");
  if (!(foto instanceof File) || foto.size === 0) return { ok: false, erro: "Arquivo inválido." };

  const loja = await prisma.loja.findUnique({ where: { id: lojaId }, select: { fotos: true } });
  if (!loja) return { ok: false, erro: "Loja não encontrada." };
  if (loja.fotos.length >= 5) return { ok: false, erro: "Máximo de 5 fotos." };

  const ext = (foto.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const r = await uploadImagemResultado(foto, `lojas/${lojaId}-${Date.now()}.${ext}`);
  if ("erro" in r) return { ok: false, erro: r.erro };

  await prisma.loja.update({ where: { id: lojaId }, data: { fotos: { push: r.url } } });
  revalidatePath("/loja");
  return { ok: true };
}

export async function removerFotoLoja(url: string) {
  const lojaId = await lojaSessaoId();
  if (!url) return;
  const loja = await prisma.loja.findUnique({ where: { id: lojaId }, select: { fotos: true } });
  if (!loja) return;
  await prisma.loja.update({
    where: { id: lojaId },
    data: { fotos: loja.fotos.filter((f) => f !== url) },
  });
  revalidatePath("/loja");
}

export async function salvarVantagensLoja(formData: FormData) {
  const lojaId = await lojaSessaoId();
  const vantagens = String(formData.get("vantagens") ?? "").trim() || null;
  await prisma.loja.update({ where: { id: lojaId }, data: { vantagens } });
  revalidatePath("/loja");
}

// Salva a inscrição de push da loja/gestor (para lembrete de pagamento).
export async function salvarPushLoja(
  endpoint: string,
  p256dh: string,
  auth: string,
) {
  const lojaId = await lojaSessaoId();
  if (!endpoint || !p256dh || !auth) return;
  await prisma.pushLoja.upsert({
    where: { endpoint },
    update: { p256dh, auth, lojaId },
    create: { endpoint, p256dh, auth, lojaId },
  });
}

export async function convocarDiarista(formData: FormData) {
  const lojaId = await lojaSessaoId();
  const diaristaId = String(formData.get("diaristaId") ?? "");
  const data = String(formData.get("data") ?? "");
  const requisicaoId = String(formData.get("requisicaoId") ?? "") || null;
  if (!diaristaId || !isISODate(data) || !dentroDaJanelaAgendamento(data)) return;
  if (await temPendenteAvaliacao(lojaId)) redirect("/loja?erro=avalie");

  // Garante que o diarista existe, não está já convocado, sem diária nesse dia e sem bloqueio global.
  const [diarista, jaConvocado, jaNoDia, bloqGlobal, requisicao] = await Promise.all([
    prisma.diarista.findUnique({ where: { id: diaristaId }, select: { id: true } }),
    prisma.convocacao.findFirst({
      where: { lojaId, diaristaId, data, status: "PENDENTE" },
      select: { id: true },
    }),
    prisma.escala.findFirst({ where: { diaristaId, data }, select: { id: true } }),
    temBloqueioGlobal(diaristaId),
    requisicaoId
      ? prisma.requisicao.findFirst({
          where: { id: requisicaoId, lojaId },
          select: { id: true, horaInicio: true, horaFim: true, valorDiaria: true },
        })
      : Promise.resolve(null),
  ]);
  if (!diarista || jaConvocado || jaNoDia || bloqGlobal) {
    revalidatePath("/loja");
    return;
  }

  // Quando a convocação vem de uma requisição, leva o horário/valor dela (e a vincula).
  const convocacao = await prisma.convocacao.create({
    data: {
      lojaId,
      diaristaId,
      data,
      requisicaoId: requisicao?.id ?? null,
      horaInicio: requisicao?.horaInicio ?? null,
      horaFim: requisicao?.horaFim ?? null,
      valor: requisicao?.valorDiaria ?? null,
    },
  });
  await notificarConvite(convocacao.id);
  revalidatePath("/loja");
}

// Lojas que a sessão pode gerenciar (loja avulsa = a sua; gestor = todas as dele).
async function lojasDaSessao(): Promise<string[]> {
  const ctx = contextoLoja(await getSessao());
  if (!ctx) return [];
  if (ctx.gestorId) {
    const lojas = await prisma.loja.findMany({
      where: { gestores: { some: { id: ctx.gestorId } } },
      select: { id: true },
    });
    return lojas.map((l) => l.id);
  }
  return ctx.lojaId ? [ctx.lojaId] : [];
}

export async function bloquearDiaristaLoja(formData: FormData) {
  const diaristaId = String(formData.get("diaristaId") ?? "");
  const dias = Number.parseInt(String(formData.get("dias") ?? ""), 10);
  if (!diaristaId || ![7, 14, 21].includes(dias)) return;

  const permitidas = await lojasDaSessao();
  if (permitidas.length === 0) return;
  // Lojas alvo: as marcadas (gestor) limitadas às dele; senão, a loja ativa.
  const marcadas = formData.getAll("lojaIds").map(String).filter(Boolean);
  const alvo = (marcadas.length > 0 ? marcadas.filter((id) => permitidas.includes(id)) : permitidas.slice(0, 1));
  if (alvo.length === 0) return;

  const ate = new Date(Date.now() + dias * 24 * 60 * 60 * 1000);
  // Não duplica bloqueios LOJA ativos para as mesmas lojas.
  const existentes = await prisma.bloqueio.findMany({
    where: {
      diaristaId,
      origem: "LOJA",
      lojaId: { in: alvo },
      OR: [{ ate: null }, { ate: { gt: new Date() } }],
    },
    select: { lojaId: true },
  });
  const jaBloq = new Set(existentes.map((b) => b.lojaId));
  const novas = alvo.filter((id) => !jaBloq.has(id));
  if (novas.length > 0) {
    await prisma.bloqueio.createMany({
      data: novas.map((lojaId) => ({ lojaId, diaristaId, origem: "LOJA", ate })),
    });
  }
  revalidatePath("/loja");
}

export async function desbloquearDiaristaLoja(formData: FormData) {
  const diaristaId = String(formData.get("diaristaId") ?? "");
  if (!diaristaId) return;
  const permitidas = await lojasDaSessao();
  if (permitidas.length === 0) return;

  // A loja/gestor só remove os próprios bloqueios (temporários), nunca os do RH.
  await prisma.bloqueio.deleteMany({
    where: { diaristaId, origem: "LOJA", lojaId: { in: permitidas } },
  });
  revalidatePath("/loja");
}
