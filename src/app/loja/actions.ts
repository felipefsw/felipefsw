"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { contextoLoja, getSessao, setSessao } from "@/lib/auth";
import { dentroDaJanelaAgendamento, isHHMM, isISODate, turnoFinalizado } from "@/lib/dates";
import { parseBRLToCents } from "@/lib/format";
import { valorProporcional } from "@/lib/geo";
import { notificarNovaDiaria, notificarPagamentoDaEscala } from "@/lib/push";
import { podeMaisUmaNaSemana } from "@/lib/limites";
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

  const [inscrito, jaNoDia, bloqueio] = await Promise.all([
    prisma.inscricao.findUnique({
      where: { requisicaoId_diaristaId: { requisicaoId, diaristaId } },
      select: { id: true },
    }),
    prisma.escala.findFirst({ where: { data: requisicao.data, diaristaId }, select: { id: true } }),
    prisma.bloqueio.findFirst({
      where: { lojaId, diaristaId, OR: [{ ate: null }, { ate: { gt: new Date() } }] },
      select: { id: true },
    }),
  ]);
  if (!inscrito || jaNoDia || bloqueio) return;
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

  if (requisicao._count.escalas + 1 >= requisicao.quantidade) {
    await prisma.requisicao.update({ where: { id: requisicaoId }, data: { status: "ATENDIDA" } });
  }

  revalidatePath("/loja");
  revalidatePath("/requisicoes");
}

// Marca/desmarca uma diária como paga (só loja/gestor têm acesso a esta área).
export async function marcarPagoDiaria(escalaId: string, pago: boolean) {
  const lojaId = await lojaSessaoId();
  if (!escalaId) return;
  const escala = await prisma.escala.findUnique({
    where: { id: escalaId },
    select: { lojaId: true },
  });
  if (!escala || escala.lojaId !== lojaId) return;
  await prisma.escala.update({
    where: { id: escalaId },
    data: { pago, pagoEm: pago ? new Date() : null },
  });
  revalidatePath("/loja");
  revalidatePath("/pagamentos");
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
  if (!diaristaId || !isISODate(data) || !dentroDaJanelaAgendamento(data)) return;
  if (await temPendenteAvaliacao(lojaId)) redirect("/loja?erro=avalie");

  // Garante que o diarista existe e evita convocação duplicada (idempotente).
  const [diarista, jaConvocado] = await Promise.all([
    prisma.diarista.findUnique({ where: { id: diaristaId }, select: { id: true } }),
    prisma.convocacao.findFirst({
      where: { lojaId, diaristaId, data, status: "PENDENTE" },
      select: { id: true },
    }),
  ]);
  if (!diarista || jaConvocado) {
    revalidatePath("/loja");
    return;
  }

  await prisma.convocacao.create({ data: { lojaId, diaristaId, data } });
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
