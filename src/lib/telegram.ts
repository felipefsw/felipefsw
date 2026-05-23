const TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export function telegramAtivo(): boolean {
  return Boolean(TOKEN);
}

export async function enviarTelegram(chatId: string, texto: string): Promise<void> {
  if (!TOKEN || !chatId) return;
  try {
    await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: texto, parse_mode: "HTML" }),
    });
  } catch {
    // silencioso: notificação é best-effort
  }
}
