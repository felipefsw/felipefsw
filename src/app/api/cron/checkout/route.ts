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

  // Marca FALTA: diárias com o turno encerrado, ainda PENDENTE e sem check-in.
  const semConfirmar = await prisma.escala.findMany({
    where: { presenca: "PENDENTE", checkinEm: null },
    select: { id: true, data: true, horaInicio: true, horaFim: true },
  });
  const idsFalta = semConfirmar
    .filter((e) => turnoFinalizado(e.data, e.horaInicio, e.horaFim))
    .map((e) => e.id);
  let faltas = 0;
  if (idsFalta.length > 0) {
    const r = await prisma.escala.updateMany({
      where: { id: { in: idsFalta } },
      data: { presenca: "FALTOU" },
    });
    faltas = r.count;
  }

  return NextResponse.json({ ok: true, fechadas, faltas });
}
