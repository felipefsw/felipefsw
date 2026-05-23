import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { agoraHHMM, hojeISO } from "@/lib/dates";

export const dynamic = "force-dynamic";

// Check-out automático das diárias cujo turno já terminou (paga valor cheio).
// Roda pelo Vercel Cron (ver vercel.json). Protegido por CRON_SECRET, se definido.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
  }

  const hoje = hojeISO();
  const agora = agoraHHMM();

  const pendentes = await prisma.escala.findMany({
    where: { checkinEm: { not: null }, checkoutEm: null },
    select: { id: true, data: true, horaFim: true, valor: true },
  });

  let fechadas = 0;
  for (const e of pendentes) {
    const encerrou =
      e.data < hoje || (e.data === hoje && e.horaFim != null && agora >= e.horaFim);
    if (!encerrou) continue;

    let saida = new Date();
    if (e.horaFim) {
      const [a, m, d] = e.data.split("-").map(Number);
      const [h, mm] = e.horaFim.split(":").map(Number);
      saida = new Date(a, m - 1, d, h, mm);
    }

    await prisma.escala.update({
      where: { id: e.id },
      data: { checkoutEm: saida, valorPago: e.valor, checkoutAuto: true },
    });
    fechadas++;
  }

  return NextResponse.json({ ok: true, fechadas });
}
