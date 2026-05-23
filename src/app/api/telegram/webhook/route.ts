import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enviarTelegram } from "@/lib/telegram";

export const dynamic = "force-dynamic";

// Webhook do bot do Telegram. Ao receber "/start <token>", vincula o chat à diarista.
export async function POST(request: Request) {
  if (!process.env.TELEGRAM_BOT_TOKEN) return NextResponse.json({ ok: true });

  let update: { message?: { text?: string; chat?: { id?: number | string } } };
  try {
    update = await request.json();
  } catch {
    return NextResponse.json({ ok: true });
  }

  const msg = update.message;
  const texto = msg?.text ?? "";
  const chatId = msg?.chat?.id != null ? String(msg.chat.id) : "";

  if (chatId && texto.startsWith("/start")) {
    const payload = texto.split(" ")[1]?.trim();
    if (payload) {
      const diarista = await prisma.diarista.findUnique({
        where: { token: payload },
        select: { id: true, nome: true },
      });
      if (diarista) {
        await prisma.diarista.update({
          where: { id: diarista.id },
          data: { telegramChatId: chatId },
        });
        await enviarTelegram(
          chatId,
          `✅ Pronto, ${diarista.nome}! Você vai receber avisos de diárias por aqui.`,
        );
      } else {
        await enviarTelegram(chatId, "Não encontrei seu cadastro. Abra o app e tente de novo.");
      }
    } else {
      await enviarTelegram(
        chatId,
        "Abra o app de diaristas e toque em 'Ativar Telegram' para vincular sua conta.",
      );
    }
  }

  return NextResponse.json({ ok: true });
}
