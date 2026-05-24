import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fimDoTurno, turnoFinalizado } from "@/lib/dates";
import { notificarPagamentoDaEscala } from "@/lib/push";

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

  const pendentes = await prisma.escala.findMany({
    where: { checkinEm: { not: null }, checkoutEm: null },
    select: { id: true, data: true, horaInicio: true, horaFim: true, valor: true },
  });

  let fechadas = 0;
  for (const e of pendentes) {
    if (!turnoFinalizado(e.data, e.horaInicio, e.horaFim)) continue;

    const saida = e.horaFim ? fimDoTurno(e.data, e.horaInicio, e.horaFim) : new Date();

    await prisma.escala.update({
      where: { id: e.id },
      data: { checkoutEm: saida, valorPago: e.valor, checkoutAuto: true },
    });
    await notificarPagamentoDaEscala(e.id);
    fechadas++;
  }

  return NextResponse.json({ ok: true, fechadas });
}
