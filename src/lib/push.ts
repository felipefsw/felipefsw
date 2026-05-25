import webpush from "web-push";
import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { formatBRL, formatDate } from "./format";
import { enviarTelegram } from "./telegram";

const PUB = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const PRIV = process.env.VAPID_PRIVATE_KEY;
const SUBJECT = process.env.VAPID_SUBJECT || "mailto:exemplo@exemplo.com";

let configurado = false;
function configurar(): boolean {
  if (!PUB || !PRIV) return false;
  if (!configurado) {
    try {
      webpush.setVapidDetails(SUBJECT, PUB, PRIV);
      configurado = true;
    } catch {
      // Chaves VAPID inválidas: desliga o push em vez de quebrar o fluxo.
      return false;
    }
  }
  return true;
}

export type PushPayload = { title: string; body: string; url?: string };

export async function enviarPushParaDiaristas(
  diaristaIds: string[],
  payload: PushPayload,
): Promise<void> {
  if (!configurar() || diaristaIds.length === 0) return;

  const subs = await prisma.pushSubscription.findMany({
    where: { diaristaId: { in: diaristaIds } },
  });
  if (subs.length === 0) return;

  const data = JSON.stringify(payload);
  await Promise.allSettled(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          data,
        );
      } catch (e: unknown) {
        const code = (e as { statusCode?: number })?.statusCode;
        if (code === 404 || code === 410) {
          await prisma.pushSubscription.delete({ where: { id: s.id } }).catch(() => {});
        }
      }
    }),
  );
}

// Envia push para a loja/gestor (todos os aparelhos inscritos naquela loja).
export async function enviarPushParaLoja(lojaId: string, payload: PushPayload): Promise<void> {
  if (!configurar() || !lojaId) return;

  const subs = await prisma.pushLoja.findMany({ where: { lojaId } });
  if (subs.length === 0) return;

  const data = JSON.stringify(payload);
  await Promise.allSettled(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          data,
        );
      } catch (e: unknown) {
        const code = (e as { statusCode?: number })?.statusCode;
        if (code === 404 || code === 410) {
          await prisma.pushLoja.delete({ where: { id: s.id } }).catch(() => {});
        }
      }
    }),
  );
}

// Lembra a loja de pagar a diarista quando o turno encerra (check-out).
export async function notificarPagamentoDaEscala(escalaId: string): Promise<void> {
  const e = await prisma.escala.findUnique({
    where: { id: escalaId },
    select: {
      lojaId: true,
      valor: true,
      valorPago: true,
      diarista: { select: { nome: true, chavePix: true } },
    },
  });
  if (!e) return;
  const valor = e.valorPago ?? e.valor;
  const pix = e.diarista.chavePix ? ` • Pix: ${e.diarista.chavePix}` : "";
  await enviarPushParaLoja(e.lojaId, {
    title: "Hora de pagar a diarista 💸",
    body: `${e.diarista.nome} • ${formatBRL(valor)}${pix}`,
    url: "/loja",
  });
}

// Avisa a loja/gestor de que um diarista ACEITOU o convite (confirmou a diária).
export async function notificarConviteAceito(params: {
  lojaId: string;
  diaristaNome: string;
  data: string;
}): Promise<void> {
  await enviarPushParaLoja(params.lojaId, {
    title: "Diária confirmada ✅",
    body: `${params.diaristaNome} aceitou a diária de ${formatDate(params.data)}.`,
    url: "/loja",
  });
}

// Avisa os candidatos NÃO escolhidos que a vaga foi preenchida por outro.
export async function notificarVagaPreenchida(requisicaoId: string): Promise<void> {
  const req = await prisma.requisicao.findUnique({
    where: { id: requisicaoId },
    include: {
      loja: { select: { nome: true } },
      escalas: { select: { diaristaId: true } },
      inscricoes: { select: { diaristaId: true } },
    },
  });
  if (!req) return;
  const escalados = new Set(req.escalas.map((e) => e.diaristaId));
  const perdedores = [...new Set(req.inscricoes.map((i) => i.diaristaId))].filter(
    (id) => !escalados.has(id),
  );
  if (perdedores.length === 0) return;

  const msg = `${req.loja.nome} • ${formatDate(req.data)}: outro diarista foi selecionado desta vez.`;
  await enviarPushParaDiaristas(perdedores, { title: "Vaga preenchida", body: msg, url: "/" });

  const comTelegram = await prisma.diarista.findMany({
    where: { id: { in: perdedores }, telegramChatId: { not: null } },
    select: { telegramChatId: true },
  });
  await Promise.allSettled(
    comTelegram.map((d) => enviarTelegram(d.telegramChatId as string, `⚠️ Vaga preenchida\n${msg}`)),
  );
}

// URL base pública do app, para montar links em mensagens fora do navegador (Telegram).
// Em produção a Vercel define VERCEL_PROJECT_PRODUCTION_URL/VERCEL_URL; também dá para
// fixar um domínio próprio em NEXT_PUBLIC_BASE_URL.
function linkPublico(path: string): string | null {
  const explicit = process.env.NEXT_PUBLIC_BASE_URL;
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  const base = explicit
    ? explicit.replace(/\/+$/, "")
    : vercel
      ? `https://${vercel.replace(/\/+$/, "")}`
      : null;
  if (!base) return null;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

// Avisa a diarista de que foi escalada para uma diária, com link para confirmar a presença.
export async function notificarEscalado(escalaId: string): Promise<void> {
  const e = await prisma.escala.findUnique({
    where: { id: escalaId },
    select: {
      data: true,
      horaInicio: true,
      horaFim: true,
      valor: true,
      tokenConfirmacao: true,
      diaristaId: true,
      diarista: { select: { telegramChatId: true } },
      loja: { select: { nome: true } },
    },
  });
  if (!e) return;

  const hora = e.horaInicio && e.horaFim ? ` • ${e.horaInicio}–${e.horaFim}` : "";
  const resumo = `${e.loja.nome} • ${formatDate(e.data)}${hora} • ${formatBRL(e.valor)}`;
  const caminho = e.tokenConfirmacao ? `/confirmar/${e.tokenConfirmacao}` : "/";

  await enviarPushParaDiaristas([e.diaristaId], {
    title: "Você foi escalada! 🎉",
    body: `${resumo} — toque para confirmar a presença.`,
    url: caminho,
  });

  if (e.diarista.telegramChatId) {
    const link = linkPublico(caminho);
    const rodape = link
      ? `\n\n👉 Confirme sua presença: ${link}`
      : "\n\nAbra o app para confirmar sua presença.";
    await enviarTelegram(
      e.diarista.telegramChatId,
      `✅ <b>Você foi escalada!</b>\n${resumo}${rodape}`,
    );
  }
}

// Avisa a diarista de que recebeu um CONVITE de diária (precisa aceitar/recusar no app).
export async function notificarConvite(convocacaoId: string): Promise<void> {
  const c = await prisma.convocacao.findUnique({
    where: { id: convocacaoId },
    select: {
      data: true,
      horaInicio: true,
      horaFim: true,
      valor: true,
      diaristaId: true,
      diarista: { select: { token: true, telegramChatId: true, valorDiaria: true } },
      loja: { select: { nome: true } },
    },
  });
  if (!c) return;

  const hora = c.horaInicio && c.horaFim ? ` • ${c.horaInicio}–${c.horaFim}` : "";
  const valor = c.valor ?? c.diarista.valorDiaria;
  const resumo = `${c.loja.nome} • ${formatDate(c.data)}${hora} • ${formatBRL(valor)}`;
  const caminho = `/d/${c.diarista.token}`;

  await enviarPushParaDiaristas([c.diaristaId], {
    title: "Convite de diária 🤝",
    body: `${resumo} — toque para aceitar ou recusar.`,
    url: caminho,
  });

  if (c.diarista.telegramChatId) {
    const link = linkPublico(caminho);
    const rodape = link
      ? `\n\n👉 Aceitar ou recusar: ${link}`
      : "\n\nAbra o app para aceitar ou recusar.";
    await enviarTelegram(
      c.diarista.telegramChatId,
      `🤝 <b>Convite de diária</b>\n${resumo}${rodape}`,
    );
  }
}

// Notifica diaristas sobre uma nova diária: quem tem a loja como preferida ou foi convidado.
export async function notificarNovaDiaria(
  lojaId: string,
  data: string,
  convidadoIds: string[],
): Promise<void> {
  const or: Prisma.DiaristaWhereInput[] = [{ lojasPreferidas: { some: { id: lojaId } } }];
  if (convidadoIds.length) or.push({ id: { in: convidadoIds } });

  const [loja, alvos] = await Promise.all([
    prisma.loja.findUnique({ where: { id: lojaId }, select: { nome: true } }),
    prisma.diarista.findMany({
      where: { ativo: true, OR: or },
      select: { id: true, telegramChatId: true },
    }),
  ]);

  const nomeLoja = loja?.nome ?? "Loja";
  const quando = formatDate(data);

  await enviarPushParaDiaristas(
    alvos.map((a) => a.id),
    { title: "Nova diária disponível", body: `${nomeLoja} • ${quando}`, url: "/" },
  );

  await Promise.allSettled(
    alvos
      .filter((a) => a.telegramChatId)
      .map((a) =>
        enviarTelegram(
          a.telegramChatId as string,
          `🍕 <b>Nova diária disponível</b>\n${nomeLoja} • ${quando}\nAbra o app para pegar.`,
        ),
      ),
  );
}
