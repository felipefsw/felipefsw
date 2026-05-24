"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  dentroDaJanelaAgendamento,
  hojeISO,
  inicioDaSemana,
  isHHMM,
  isISODate,
} from "@/lib/dates";
import { parseBRLToCents } from "@/lib/format";
import { notificarNovaDiaria, notificarVagaPreenchida } from "@/lib/push";
import { limparOutrasInscricoesDoDia } from "@/lib/escalas";

export type ResultadoMagico = {
  total: number;
  itens: {
    loja: string;
    funcao: string | null;
    data: string;
    horaInicio: string;
    horaFim: string;
    nomes: string[];
  }[];
};

// "Click mágico": convoca automaticamente os diaristas que mais trabalham em
// cada loja para preencher as vagas abertas, sem repetir ninguém em duas lojas.
// Desempate: preferência do diarista (geolocalização fica para o futuro).
export async function clickMagico(): Promise<ResultadoMagico> {
  const hoje = hojeISO();

  const [requisicoes, diaristas] = await Promise.all([
    prisma.requisicao.findMany({
      where: { status: "ABERTA", data: { gte: hoje } },
      include: { loja: { select: { nome: true } }, _count: { select: { escalas: true } } },
      orderBy: { data: "asc" },
    }),
    prisma.diarista.findMany({
      where: { ativo: true },
      select: {
        id: true,
        nome: true,
        funcao: true,
        escalas: { select: { lojaId: true, data: true } },
        lojasPreferidas: { select: { id: true } },
        bloqueios: {
          where: { OR: [{ ate: null }, { ate: { gt: new Date() } }] },
          select: { lojaId: true },
        },
        convocacoes: { where: { status: "PENDENTE" }, select: { data: true } },
      },
    }),
  ]);

  const info = diaristas.map((d) => {
    const freq = new Map<string, number>();
    const datas = new Set<string>();
    for (const e of d.escalas) {
      freq.set(e.lojaId, (freq.get(e.lojaId) ?? 0) + 1);
      datas.add(e.data);
    }
    return {
      id: d.id,
      nome: d.nome,
      funcao: d.funcao,
      freq,
      datas,
      bloq: new Set(d.bloqueios.map((b) => b.lojaId)),
      pref: new Set(d.lojasPreferidas.map((l) => l.id)),
      conv: new Set(d.convocacoes.map((c) => c.data)),
    };
  });

  const usados = new Set<string>();
  const novas: { lojaId: string; diaristaId: string; data: string }[] = [];
  const itens: ResultadoMagico["itens"] = [];

  for (const r of requisicoes) {
    const faltam = r.quantidade - r._count.escalas;
    if (faltam <= 0) continue;

    const candidatos = info
      .filter(
        (d) =>
          !usados.has(d.id) &&
          (!r.funcao || d.funcao === r.funcao) &&
          !d.bloq.has(r.lojaId) &&
          !d.datas.has(r.data) &&
          !d.conv.has(r.data),
      )
      .sort((a, b) => {
        const fa = a.freq.get(r.lojaId) ?? 0;
        const fb = b.freq.get(r.lojaId) ?? 0;
        if (fb !== fa) return fb - fa;
        return (b.pref.has(r.lojaId) ? 1 : 0) - (a.pref.has(r.lojaId) ? 1 : 0);
      });

    const escolhidos = candidatos.slice(0, faltam);
    if (escolhidos.length === 0) continue;
    for (const d of escolhidos) {
      usados.add(d.id);
      novas.push({ lojaId: r.lojaId, diaristaId: d.id, data: r.data });
    }
    itens.push({
      loja: r.loja.nome,
      funcao: r.funcao,
      data: r.data,
      horaInicio: r.horaInicio,
      horaFim: r.horaFim,
      nomes: escolhidos.map((d) => d.nome),
    });
  }

  if (novas.length > 0) {
    await prisma.convocacao.createMany({ data: novas });
  }

  revalidatePath("/requisicoes");
  revalidatePath("/loja");
  return { total: novas.length, itens };
}

export async function createRequisicao(formData: FormData) {
  const lojaId = String(formData.get("lojaId") ?? "");
  const data = String(formData.get("data") ?? "");
  const horaInicio = String(formData.get("horaInicio") ?? "");
  const horaFim = String(formData.get("horaFim") ?? "");
  const funcao = String(formData.get("funcao") ?? "").trim() || null;
  const quantidade = Math.max(1, Number.parseInt(String(formData.get("quantidade") ?? "1"), 10) || 1);
  const valorDiaria = parseBRLToCents(String(formData.get("valorDiaria") ?? ""));
  const observacoes = String(formData.get("observacoes") ?? "").trim() || null;

  // valor da diária é obrigatório (> 0); data dentro da janela (hoje..+7)
  if (
    !lojaId ||
    !isISODate(data) ||
    !dentroDaJanelaAgendamento(data) ||
    !isHHMM(horaInicio) ||
    !isHHMM(horaFim) ||
    valorDiaria <= 0
  ) {
    return;
  }

  // Permitido criar vagas iguais (mesma função/horário) - urgência ou replanejamento.

  const convidados = [1, 2, 3]
    .map((i) => String(formData.get(`convidado${i}`) ?? ""))
    .filter(Boolean);
  const convidadosUnicos = [...new Set(convidados)].map((id) => ({ id }));

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
      convidados: { connect: convidadosUnicos },
    },
  });

  await notificarNovaDiaria(lojaId, data, [...new Set(convidados)]);

  revalidatePath("/requisicoes");
  revalidatePath("/");
  redirect("/requisicoes");
}

export async function fecharRequisicao(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const data = String(formData.get("data") ?? "");
  const diaristaIds = formData.getAll("diaristaIds").map(String).filter(Boolean);

  if (!id || !isISODate(data) || !dentroDaJanelaAgendamento(data) || diaristaIds.length === 0) return;

  const requisicao = await prisma.requisicao.findUnique({ where: { id } });
  if (!requisicao) return;

  // Evita conflito: remove quem já está escalado nesse dia (em qualquer loja)
  // ou quem está bloqueado nesta loja.
  const [jaEscalados, bloqueados] = await Promise.all([
    prisma.escala.findMany({
      where: { data, diaristaId: { in: diaristaIds } },
      select: { diaristaId: true },
    }),
    prisma.bloqueio.findMany({
      where: {
        lojaId: requisicao.lojaId,
        diaristaId: { in: diaristaIds },
        OR: [{ ate: null }, { ate: { gt: new Date() } }],
      },
      select: { diaristaId: true },
    }),
  ]);
  const ocupados = new Set(jaEscalados.map((e) => e.diaristaId));
  const bloqSet = new Set(bloqueados.map((b) => b.diaristaId));
  const livres = diaristaIds.filter((d) => !ocupados.has(d) && !bloqSet.has(d));
  if (livres.length === 0) return;

  await prisma.$transaction([
    prisma.escala.createMany({
      data: livres.map((diaristaId) => ({
        diaristaId,
        lojaId: requisicao.lojaId,
        data,
        horaInicio: requisicao.horaInicio,
        horaFim: requisicao.horaFim,
        valor: requisicao.valorDiaria,
        requisicaoId: requisicao.id,
      })),
    }),
    prisma.requisicao.update({ where: { id }, data: { status: "ATENDIDA" } }),
    prisma.inscricao.updateMany({
      where: { requisicaoId: id, diaristaId: { in: livres } },
      data: { status: "ACEITA" },
    }),
  ]);

  for (const d of livres) await limparOutrasInscricoesDoDia(d, data, id);
  await notificarVagaPreenchida(id);

  revalidatePath("/requisicoes");
  revalidatePath("/escala");
  revalidatePath("/");
  redirect(`/escala?inicio=${inicioDaSemana(data)}`);
}

export async function cancelarRequisicao(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.requisicao.update({ where: { id }, data: { status: "CANCELADA" } });
  revalidatePath("/requisicoes");
  revalidatePath("/");
}

export async function reabrirRequisicao(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.requisicao.update({ where: { id }, data: { status: "ABERTA" } });
  revalidatePath("/requisicoes");
  revalidatePath("/");
}

export async function deleteRequisicao(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.requisicao.delete({ where: { id } });
  revalidatePath("/requisicoes");
  revalidatePath("/");
}
