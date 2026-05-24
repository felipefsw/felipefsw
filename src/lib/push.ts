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
