"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { RAIO_CHECKIN_METROS, distanciaMetros } from "@/lib/geo";
import { addDias, hojeISO, podeDesistir, turnoFinalizado } from "@/lib/dates";
import { notificarNovaDiaria, notificarVagaPreenchida } from "@/lib/push";
import { uploadImagemResultado } from "@/lib/storage";
import { podeMaisUmaNaSemana, temBloqueioGlobal } from "@/lib/limites";
import { limparOutrasInscricoesDoDia } from "@/lib/escalas";
import { gerarHashSenha, senhaForte } from "@/lib/senha";
import { entrarDiaristaSessao } from "@/lib/auth";

// Primeiro acesso do diarista: define a senha e inicia a sessão.
export async function definirSenhaDiarista(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const senha = String(formData.get("senha") ?? "");
  const confirmar = String(formData.get("confirmarSenha") ?? "");
  if (!token) redirect("/entrar");
  if (!senhaForte(senha) || senha !== confirmar) redirect(`/d/${token}?erro=senha`);

  const d = await prisma.diarista.findUnique({
    where: { token },
    select: { id: true, senha: true },
  });
  if (!d) redirect("/entrar");
  if (d.senha) redirect(`/d/${token}`); // já tem senha definida
  await prisma.diarista.update({ where: { id: d.id }, data: { senha: gerarHashSenha(senha) } });
  await entrarDiaristaSessao(d.id);
  redirect(`/d/${token}`);
}

// O diarista precisa avaliar as diárias já encerradas antes de pegar/aceitar novas.
async function temAvaliacaoPendente(diaristaId: string): Promise<boolean> {
  const escalas = await prisma.escala.findMany({
    where: { diaristaId, presenca: "PRESENTE", avaliacaoLoja: null },
    select: { data: true, horaInicio: true, horaFim: true },
  });
  return escalas.some((e) => turnoFinalizado(e.data, e.horaInicio, e.horaFim));
}

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

  // Check-in só com a localização do diarista (precisa permitir o GPS).
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    redirect(`/d/${token}?checkin=semloc`);
  }
  // A loja precisa ter localização cadastrada para validar a distância.
  if (escala.loja.latitude == null || escala.loja.longitude == null) {
    redirect(`/d/${token}?checkin=lojasemloc`);
  }
  // Só permite se estiver a no máximo 100 m da loja.
  const dist = distanciaMetros(lat, lng, escala.loja.latitude, escala.loja.longitude);
  if (dist > RAIO_CHECKIN_METROS) {
    redirect(`/d/${token}?checkin=longe`);
  }

  await prisma.escala.update({
    where: { id: escalaId },
    data: {
      checkinEm: new Date(),
      checkinLat: lat,
      checkinLng: lng,
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

export async function desistirDaDiaria(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const escalaId = String(formData.get("escalaId") ?? "");
  if (!token || !escalaId) return;

  const escala = await prisma.escala.findUnique({
    where: { id: escalaId },
    include: {
      diarista: { select: { token: true } },
      requisicao: { select: { funcao: true } },
    },
  });
  if (!escala || escala.diarista.token !== token) return;

  if (!podeDesistir(escala.data, escala.horaInicio)) {
    redirect(`/d/${token}?desistir=tarde`);
  }

  const { lojaId, data, horaInicio, horaFim, valor } = escala;
  await prisma.$transaction([
    prisma.escala.delete({ where: { id: escalaId } }),
    prisma.requisicao.create({
      data: {
        lojaId,
        data,
        horaInicio: horaInicio ?? "18:00",
        horaFim: horaFim ?? "23:00",
        funcao: escala.requisicao?.funcao ?? null,
        quantidade: 1,
        valorDiaria: valor,
        observacoes: "Vaga reaberta por desistência",
      },
    }),
  ]);

  await notificarNovaDiaria(lojaId, data, []);

  revalidatePath(`/d/${token}`);
  revalidatePath("/escala");
  revalidatePath("/loja");
  redirect(`/d/${token}?desistir=ok`);
}

export async function uploadFotoDiarista(
  formData: FormData,
): Promise<{ ok: boolean; erro?: string }> {
  const token = String(formData.get("token") ?? "");
  const foto = formData.get("foto");
  if (!token || !(foto instanceof File) || foto.size === 0) {
    return { ok: false, erro: "Arquivo de foto inválido." };
  }

  const diarista = await prisma.diarista.findUnique({ where: { token }, select: { id: true } });
  if (!diarista) return { ok: false, erro: "Diarista não encontrada." };

  const ext = (foto.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const r = await uploadImagemResultado(foto, `diaristas/${diarista.id}-${Date.now()}.${ext}`);
  if ("erro" in r) return { ok: false, erro: r.erro };

  await prisma.diarista.update({ where: { id: diarista.id }, data: { fotoUrl: r.url } });
  revalidatePath(`/d/${token}`);
  return { ok: true };
}

export async function enviarMensagemDiarista(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const texto = String(formData.get("texto") ?? "").trim();
  if (!token || !texto) return;
  const diarista = await prisma.diarista.findUnique({ where: { token }, select: { id: true } });
  if (!diarista) return;
  await prisma.mensagem.create({
    data: { diaristaId: diarista.id, autor: "DIARISTA", texto },
  });
  revalidatePath(`/d/${token}`);
  revalidatePath("/mensagens");
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

  // Confirmar só registra que a diarista vem — a presença (realização) é marcada
  // pelo check-in no dia ou pelo RH depois que o turno começa.
  await prisma.escala.update({ where: { id }, data: { confirmadaEm: new Date() } });

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
    // Só aceita convocação se já tiver avaliado as diárias encerradas.
    if (await temAvaliacaoPendente(convocacao.diaristaId)) return;
    // Diarista bloqueada globalmente pelo RH não pode aceitar.
    if (await temBloqueioGlobal(convocacao.diaristaId)) return;
    // Respeita o limite de 2 diárias por semana na mesma loja (salvo liberação).
    if (!(await podeMaisUmaNaSemana(convocacao.diaristaId, convocacao.lojaId, convocacao.data))) {
      return;
    }
    // Não pode aceitar se já tem uma diária nesse mesmo dia.
    const escalaNoDia = await prisma.escala.findFirst({
      where: { diaristaId: convocacao.diaristaId, data: convocacao.data },
      select: { id: true },
    });
    if (escalaNoDia) return;

    // Aceitar JÁ é a confirmação: cria a escala com os dados do convite.
    await prisma.$transaction([
      prisma.convocacao.update({ where: { id: convocacaoId }, data: { status: "ACEITA" } }),
      prisma.escala.create({
        data: {
          diaristaId: convocacao.diaristaId,
          lojaId: convocacao.lojaId,
          data: convocacao.data,
          horaInicio: convocacao.horaInicio,
          horaFim: convocacao.horaFim,
          valor: convocacao.valor ?? convocacao.diarista.valorDiaria,
          requisicaoId: convocacao.requisicaoId,
          confirmadaEm: new Date(),
        },
      }),
    ]);
    await limparOutrasInscricoesDoDia(
      convocacao.diaristaId,
      convocacao.data,
      convocacao.requisicaoId ?? undefined,
    );

    // Convite vindo de uma requisição: marca a candidatura como aceita e fecha a
    // requisição quando todas as vagas forem preenchidas.
    if (convocacao.requisicaoId) {
      await prisma.inscricao.updateMany({
        where: { requisicaoId: convocacao.requisicaoId, diaristaId: convocacao.diaristaId },
        data: { status: "ACEITA" },
      });
      const req = await prisma.requisicao.findUnique({
        where: { id: convocacao.requisicaoId },
        select: { quantidade: true, status: true, _count: { select: { escalas: true } } },
      });
      if (req && req.status === "ABERTA" && req._count.escalas >= req.quantidade) {
        await prisma.requisicao.update({
          where: { id: convocacao.requisicaoId },
          data: { status: "ATENDIDA" },
        });
        await notificarVagaPreenchida(convocacao.requisicaoId);
      }
    }
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

  // Precisa avaliar as diárias encerradas antes de pegar novas vagas.
  if (await temAvaliacaoPendente(diarista.id)) return;
  // Diarista bloqueada globalmente pelo RH não pode pegar vagas.
  if (await temBloqueioGlobal(diarista.id)) return;

  // só permite inscrição em requisição aberta e de até 2 dias à frente
  const requisicao = await prisma.requisicao.findUnique({ where: { id: requisicaoId } });
  if (!requisicao || requisicao.status !== "ABERTA") return;
  if (requisicao.data > addDias(hojeISO(), 2)) return;

  // não permite inscrição se a diarista estiver bloqueada nessa loja
  const bloqueio = await prisma.bloqueio.findFirst({
    where: {
      lojaId: requisicao.lojaId,
      diaristaId: diarista.id,
      OR: [{ ate: null }, { ate: { gt: new Date() } }],
    },
  });
  if (bloqueio) return;

  // No máximo 2 diárias por semana na mesma loja (salvo liberação da loja/RH).
  if (!(await podeMaisUmaNaSemana(diarista.id, requisicao.lojaId, requisicao.data))) return;

  // Não pode pegar 2 vagas no mesmo dia, nem 2 na mesma loja/dia, nem se já foi
  // convocado para essa loja/dia (responde pelo convite, não pela lista).
  const [escalaNoDia, convocadoLojaDia, jaInscritoLojaDia] = await Promise.all([
    prisma.escala.findFirst({
      where: { diaristaId: diarista.id, data: requisicao.data },
      select: { id: true },
    }),
    prisma.convocacao.findFirst({
      where: {
        diaristaId: diarista.id,
        lojaId: requisicao.lojaId,
        data: requisicao.data,
        status: "PENDENTE",
      },
      select: { id: true },
    }),
    prisma.inscricao.findFirst({
      where: {
        diaristaId: diarista.id,
        requisicaoId: { not: requisicaoId },
        requisicao: { lojaId: requisicao.lojaId, data: requisicao.data, status: "ABERTA" },
      },
      select: { id: true },
    }),
  ]);
  if (escalaNoDia || convocadoLojaDia || jaInscritoLojaDia) return;

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
