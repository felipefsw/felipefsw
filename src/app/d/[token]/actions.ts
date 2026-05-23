"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { RAIO_CHECKIN_METROS, distanciaMetros } from "@/lib/geo";

export async function fazerCheckin(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const escalaId = String(formData.get("escalaId") ?? "");
  const lat = Number.parseFloat(String(formData.get("lat") ?? ""));
  const lng = Number.parseFloat(String(formData.get("lng") ?? ""));
  if (!token || !escalaId) return;

  const escala = await prisma.escala.findUnique({
    where: { id: escalaId },
    include: { diarista: { select: { token: true } }, loja: { select: { latitude: true, longitude: true } } },
  });
  if (!escala || escala.diarista.token !== token) return;

  // Se a loja tem localização, valida a distância.
  if (
    escala.loja.latitude != null &&
    escala.loja.longitude != null &&
    Number.isFinite(lat) &&
    Number.isFinite(lng)
  ) {
    const dist = distanciaMetros(lat, lng, escala.loja.latitude, escala.loja.longitude);
    if (dist > RAIO_CHECKIN_METROS) {
      redirect(`/d/${token}?checkin=longe`);
    }
  }

  await prisma.escala.update({
    where: { id: escalaId },
    data: {
      checkinEm: new Date(),
      checkinLat: Number.isFinite(lat) ? lat : null,
      checkinLng: Number.isFinite(lng) ? lng : null,
      presenca: "PRESENTE",
    },
  });

  revalidatePath(`/d/${token}`);
  revalidatePath("/escala");
  revalidatePath("/loja");
  redirect(`/d/${token}?checkin=ok`);
}

export async function salvarPushSubscription(
  token: string,
  endpoint: string,
  p256dh: string,
  auth: string,
) {
  if (!token || !endpoint || !p256dh || !auth) return;
  const diarista = await prisma.diarista.findUnique({ where: { token }, select: { id: true } });
  if (!diarista) return;
  await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: { p256dh, auth, diaristaId: diarista.id },
    create: { endpoint, p256dh, auth, diaristaId: diarista.id },
  });
}

export async function confirmarPresenca(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const token = String(formData.get("token") ?? "");
  if (!id || !token) return;

  // Garante que a escala pertence à diarista dona do token (autorização pelo link).
  const escala = await prisma.escala.findUnique({
    where: { id },
    include: { diarista: true },
  });
  if (!escala || escala.diarista.token !== token) return;

  await prisma.escala.update({ where: { id }, data: { presenca: "PRESENTE" } });

  revalidatePath(`/d/${token}`);
  revalidatePath("/escala");
  revalidatePath("/");
}

export async function responderConvocacao(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const convocacaoId = String(formData.get("convocacaoId") ?? "");
  const resposta = String(formData.get("resposta") ?? "");
  if (!token || !convocacaoId || !["ACEITA", "RECUSADA"].includes(resposta)) return;

  const convocacao = await prisma.convocacao.findUnique({
    where: { id: convocacaoId },
    include: { diarista: { select: { token: true, valorDiaria: true } } },
  });
  if (!convocacao || convocacao.diarista.token !== token || convocacao.status !== "PENDENTE") return;

  if (resposta === "ACEITA") {
    await prisma.$transaction([
      prisma.convocacao.update({ where: { id: convocacaoId }, data: { status: "ACEITA" } }),
      prisma.escala.create({
        data: {
          diaristaId: convocacao.diaristaId,
          lojaId: convocacao.lojaId,
          data: convocacao.data,
          valor: convocacao.diarista.valorDiaria,
        },
      }),
    ]);
  } else {
    await prisma.convocacao.update({ where: { id: convocacaoId }, data: { status: "RECUSADA" } });
  }

  revalidatePath(`/d/${token}`);
  revalidatePath("/escala");
  revalidatePath("/loja");
}

export async function salvarPreferencias(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  if (!token) return;
  const diarista = await prisma.diarista.findUnique({
    where: { token },
    select: { id: true },
  });
  if (!diarista) return;

  const ids = [...new Set(formData.getAll("lojaIds").map(String).filter(Boolean))]
    .slice(0, 5)
    .map((id) => ({ id }));

  await prisma.diarista.update({
    where: { id: diarista.id },
    data: { lojasPreferidas: { set: ids } },
  });

  revalidatePath(`/d/${token}`);
  redirect(`/d/${token}`);
}

export async function inscreverNaDiaria(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const requisicaoId = String(formData.get("requisicaoId") ?? "");
  if (!token || !requisicaoId) return;

  const diarista = await prisma.diarista.findUnique({ where: { token } });
  if (!diarista) return;

  // só permite inscrição em requisição ainda aberta
  const requisicao = await prisma.requisicao.findUnique({ where: { id: requisicaoId } });
  if (!requisicao || requisicao.status !== "ABERTA") return;

  // não permite inscrição se a diarista estiver bloqueada nessa loja
  const bloqueio = await prisma.bloqueio.findFirst({
    where: {
      lojaId: requisicao.lojaId,
      diaristaId: diarista.id,
      OR: [{ ate: null }, { ate: { gt: new Date() } }],
    },
  });
  if (bloqueio) return;

  await prisma.inscricao.upsert({
    where: { requisicaoId_diaristaId: { requisicaoId, diaristaId: diarista.id } },
    update: {},
    create: { requisicaoId, diaristaId: diarista.id },
  });

  revalidatePath(`/d/${token}`);
  revalidatePath("/requisicoes");
}

function notaLoja(formData: FormData, campo: string): number {
  const n = Number.parseInt(String(formData.get(campo) ?? ""), 10);
  if (Number.isNaN(n)) return 0;
  return Math.min(10, Math.max(0, n));
}

export async function salvarAvaliacaoLoja(formData: FormData) {
  const escalaId = String(formData.get("escalaId") ?? "");
  const token = String(formData.get("token") ?? "");
  if (!escalaId || !token) return;

  // Autorização pelo link: a escala precisa ser da diarista dona do token.
  const escala = await prisma.escala.findUnique({
    where: { id: escalaId },
    include: { diarista: true },
  });
  if (!escala || escala.diarista.token !== token) return;

  const notas = {
    ambiente: notaLoja(formData, "ambiente"),
    tratamento: notaLoja(formData, "tratamento"),
    pagamentoEmDia: notaLoja(formData, "pagamentoEmDia"),
    organizacao: notaLoja(formData, "organizacao"),
    seguranca: notaLoja(formData, "seguranca"),
  };
  const comentario = String(formData.get("comentario") ?? "").trim() || null;

  await prisma.avaliacaoLoja.upsert({
    where: { escalaId },
    update: { ...notas, comentario },
    create: {
      escalaId,
      lojaId: escala.lojaId,
      diaristaId: escala.diaristaId,
      ...notas,
      comentario,
    },
  });

  revalidatePath(`/d/${token}`);
  revalidatePath(`/lojas/${escala.lojaId}`);
  redirect(`/d/${token}`);
}
