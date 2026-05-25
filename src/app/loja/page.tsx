import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, EmptyState, btnPrimary } from "@/components/ui";
import { formatBRL, formatDate, formatDateWithWeekday } from "@/lib/format";
import { addDias, hojeISO, inicioDaSemana, isISODate, maxAgendamentoISO, turnoFinalizado } from "@/lib/dates";
import { corDoTurno } from "@/lib/horarios";
import BarraDia from "@/components/BarraDia";
import { corDaFuncao } from "@/lib/funcoesCor";
import Avatar from "@/components/Avatar";
import EstrelasAvaliacao from "@/components/EstrelasAvaliacao";
import SubmitButton from "@/components/SubmitButton";
import CopyButton from "@/components/CopyButton";
import CopyLink from "@/components/CopyLink";
import CompartilharCadastro from "@/components/CompartilharCadastro";
import TrilhaAprendizado from "@/components/TrilhaAprendizado";
import { TRILHA_GESTOR, TRILHA_LOJA } from "@/lib/trilhas";
import PushToggleLoja from "@/components/PushToggleLoja";
import FotosLojaUpload from "@/components/FotosLojaUpload";
import BotaoBloquear from "@/components/BotaoBloquear";
import { contextoLoja, getSessao } from "@/lib/auth";
import {
  alternarLimiteSemana,
  aprovarCandidato,
  convocarDiarista,
  criarRequisicaoLoja,
  desbloquearDiaristaLoja,
  marcarPagoDiaria,
  recusarCandidato,
  registrarCheckout,
  salvarVantagensLoja,
} from "./actions";

function notaDe(avaliacoes: { estrelas: number }[]): number | null {
  if (avaliacoes.length < 5) return null;
  return avaliacoes.reduce((s, a) => s + a.estrelas, 0) / avaliacoes.length;
}

export const dynamic = "force-dynamic";

function horaDe(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function statusLabel(s: string) {
  if (s === "ABERTA") return { txt: "Aberta", cls: "bg-amber-100 text-amber-700" };
  if (s === "ATENDIDA") return { txt: "Atendida", cls: "bg-green-100 text-green-700" };
  return { txt: "Cancelada", cls: "bg-gray-100 text-gray-500" };
}

export default async function LojaHome({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; dia?: string }>;
}) {
  const { erro, dia } = await searchParams;
  const ctx = contextoLoja(await getSessao());
  if (!ctx) redirect("/entrar");
  const lojaId = ctx.lojaId;

  const agora = new Date();
  const hoje = hojeISO();
  // Vista por dia (?dia=) ou pela semana inteira (padrão).
  const diaSel = dia && isISODate(dia) ? dia : null;
  const rangeIni = diaSel ?? inicioDaSemana(hoje);
  const rangeFim = diaSel ?? addDias(inicioDaSemana(hoje), 6);
  const [requisicoes, escalas, bloqueios, loja, convocacoes, escalasPeriodo] = await Promise.all([
    prisma.requisicao.findMany({
      where: { lojaId },
      include: {
        _count: { select: { escalas: true, inscricoes: true } },
        loja: { select: { nome: true } },
        escalas: { include: { diarista: { select: { id: true, nome: true, fotoUrl: true } } } },
        inscricoes: {
          include: {
            diarista: {
              select: {
                id: true,
                nome: true,
                funcao: true,
                fotoUrl: true,
                avaliacoes: { select: { estrelas: true }, orderBy: { criadoEm: "desc" }, take: 5 },
                escalas: { where: { presenca: "PRESENTE" }, select: { loja: { select: { nome: true } } } },
                _count: { select: { escalas: { where: { presenca: "PRESENTE" } } } },
              },
            },
          },
        },
      },
      orderBy: { criadoEm: "desc" },
    }),
    prisma.escala.findMany({
      where: { lojaId },
      include: {
        diarista: { select: { id: true, nome: true, funcao: true, fotoUrl: true, chavePix: true } },
        avaliacao: true,
      },
      orderBy: { data: "desc" },
    }),
    prisma.bloqueio.findMany({
      where: { lojaId, OR: [{ ate: null }, { ate: { gt: agora } }] },
    }),
    prisma.loja.findUnique({
      where: { id: lojaId },
      select: { permiteMais2Semana: true, fotos: true, vantagens: true },
    }),
    prisma.convocacao.findMany({
      where: { lojaId, data: { gte: addDias(hoje, -7) } },
      include: { diarista: { select: { id: true, nome: true, funcao: true, fotoUrl: true } } },
      orderBy: [{ data: "asc" }, { criadoEm: "desc" }],
    }),
    // Resumo do dia: gestor vê todas as suas lojas; loja vê só a sua.
    prisma.escala.findMany({
      where: {
        data: { gte: rangeIni, lte: rangeFim },
        loja: ctx.gestorId ? { gestores: { some: { id: ctx.gestorId } } } : { id: lojaId },
      },
      include: {
        diarista: { select: { id: true, nome: true, funcao: true, chavePix: true } },
        loja: { select: { nome: true } },
      },
      orderBy: [{ data: "asc" }, { loja: { nome: "asc" } }, { horaInicio: "asc" }],
    }),
  ]);

  // Convocações pendentes (para mostrar "✓ convocado").
  const convocacoesPendentes = convocacoes.filter((c) => c.status === "PENDENTE");
  const convocadoData = new Set(convocacoesPendentes.map((c) => `${c.diaristaId}|${c.data}`));
  const convocadoDiarista = new Set(convocacoesPendentes.map((c) => c.diaristaId));
  // Quem já tem diária (confirmada) num dia, para mostrar "confirmado".
  const escalaDiaristaData = new Set(escalas.map((e) => `${e.diaristaId}|${e.data}`));

  // Convocações enviadas por requisição (vinculadas ou do mesmo dia da vaga).
  const convocadosDaReq = (reqId: string, dataReq: string) =>
    convocacoes.filter(
      (c) => c.requisicaoId === reqId || (c.requisicaoId == null && c.data === dataReq),
    );
  const statusConvocacao = (s: string) =>
    s === "ACEITA"
      ? { txt: "aceitou ✓", cls: "bg-green-100 text-green-700" }
      : s === "RECUSADA"
        ? { txt: "recusou", cls: "bg-gray-200 text-gray-600" }
        : { txt: "aguardando", cls: "bg-amber-100 text-amber-700" };

  // Gestor: visão das vagas abertas em TODAS as suas lojas.
  const gestorLojas = ctx.gestorId
    ? await prisma.loja.findMany({
        where: { gestores: { some: { id: ctx.gestorId } }, ativo: true },
        select: {
          id: true,
          nome: true,
          requisicoes: {
            where: { status: "ABERTA" },
            select: {
              id: true,
              data: true,
              horaInicio: true,
              horaFim: true,
              funcao: true,
              valorDiaria: true,
            },
            orderBy: { data: "asc" },
          },
        },
        orderBy: { nome: "asc" },
      })
    : [];

  const bloqueioPorDiarista = new Map<string, { ate: Date | null; origem: string }>();
  for (const b of bloqueios) {
    const cur = bloqueioPorDiarista.get(b.diaristaId);
    // RH (permanente) prevalece sobre bloqueio temporário da loja.
    if (!cur || b.origem === "RH") bloqueioPorDiarista.set(b.diaristaId, { ate: b.ate, origem: b.origem });
  }

  // Diárias já realizadas (presente e turno encerrado) — para avaliar.
  const aAvaliar = escalas.filter(
    (e) => e.presenca === "PRESENTE" && turnoFinalizado(e.data, e.horaInicio, e.horaFim),
  );
  // A loja precisa avaliar antes de abrir novas vagas / convocar.
  const pendentes = aAvaliar.filter((e) => !e.avaliacao).length;

  // Resumo do período: agrupa as diárias por dia (gestor vê várias lojas).
  const escalasPorDia = new Map<string, typeof escalasPeriodo>();
  for (const e of escalasPeriodo) {
    const arr = escalasPorDia.get(e.data) ?? [];
    arr.push(e);
    escalasPorDia.set(e.data, arr);
  }
  const diasComEscala = [...escalasPorDia.keys()].sort();

  // Texto com todos os Pix do período, para copiar e colar no WhatsApp.
  const pixHoje = escalasPeriodo
    .filter((e) => e.diarista.chavePix)
    .map((e) => `${e.diarista.nome}: ${e.diarista.chavePix}`)
    .join("\n");

  // Lista pronta para colar no grupo, agrupada por dia (e por loja, p/ gestor).
  const linhasDia: string[] = [];
  for (const d of diasComEscala) {
    const lista = escalasPorDia.get(d)!;
    const variasLojasNoDia = new Set(lista.map((e) => e.loja.nome)).size > 1;
    linhasDia.push(`📋 *${formatDate(d)}*`);
    let lojaAtual = "";
    for (const e of lista) {
      if (variasLojasNoDia && e.loja.nome !== lojaAtual) {
        lojaAtual = e.loja.nome;
        linhasDia.push(`*${lojaAtual}*`);
      }
      const partes = [e.diarista.nome];
      if (e.diarista.funcao) partes.push(e.diarista.funcao);
      if (e.horaInicio && e.horaFim) partes.push(`${e.horaInicio}–${e.horaFim}`);
      partes.push(formatBRL(e.valor));
      linhasDia.push(`• ${partes.join(" · ")}`);
    }
    linhasDia.push("");
  }
  const textoDia = escalasPeriodo.length > 0 ? linhasDia.join("\n").trim() : "";

  // Atalho "pedir de novo": usa a requisição mais recente como modelo.
  const ultima = requisicoes.length
    ? [...requisicoes].sort((a, b) => b.criadoEm.getTime() - a.criadoEm.getTime())[0]
    : null;

  // Diaristas distintos que já vieram, com datas e notas dadas por esta loja.
  type Info = {
    nome: string;
    funcao: string | null;
    fotoUrl: string | null;
    chavePix: string | null;
    datas: string[];
    somaNotas: number;
    qtdNotas: number;
  };
  const vistos = new Map<string, Info>();
  for (const e of escalas) {
    const cur =
      vistos.get(e.diarista.id) ??
      {
        nome: e.diarista.nome,
        funcao: e.diarista.funcao,
        fotoUrl: e.diarista.fotoUrl,
        chavePix: e.diarista.chavePix,
        datas: [],
        somaNotas: 0,
        qtdNotas: 0,
      };
    cur.datas.push(e.data);
    if (e.avaliacao) {
      cur.somaNotas += e.avaliacao.estrelas;
      cur.qtdNotas += 1;
    }
    vistos.set(e.diarista.id, cur);
  }
  const diaristas = [...vistos.entries()]
    .map(([id, v]) => ({
      id,
      nome: v.nome,
      funcao: v.funcao,
      fotoUrl: v.fotoUrl,
      chavePix: v.chavePix,
      vezes: v.datas.length,
      datas: v.datas,
      nota: v.qtdNotas ? v.somaNotas / v.qtdNotas : null,
    }))
    .sort((a, b) => b.vezes - a.vezes);

  // Top 3 que mais vieram nesta loja (para convocar direto na vaga).
  const topConvocar = diaristas.slice(0, 3);

  // Só as diárias que faltam avaliar (para o atalho "Avalie para liberar").
  const pendentesList = aAvaliar.filter((e) => !e.avaliacao);

  // Ranking dos diaristas desta loja (melhor nota primeiro; sem nota vai pro fim).
  const topDiaristas = [...diaristas].sort((a, b) => {
    if (a.nota === null && b.nota === null) return b.vezes - a.vezes;
    if (a.nota === null) return 1;
    if (b.nota === null) return -1;
    if (b.nota !== a.nota) return b.nota - a.nota;
    return b.vezes - a.vezes;
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Minha loja</h1>
        {pendentes === 0 ? (
          <Link href="/loja/requisicao/nova" data-tour="loja-solicitar" className={btnPrimary}>
            + Solicitar diaristas
          </Link>
        ) : (
          <a
            href="#avaliar-diaristas"
            className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600"
          >
            Avalie para liberar
          </a>
        )}
      </div>

      {(pendentes > 0 || erro === "avalie") && (
        <a
          href="#avaliar-diaristas"
          className="block rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm font-medium text-amber-800 hover:bg-amber-100"
        >
          Você tem {pendentes} diária(s) para avaliar. Toque aqui para avaliar agora e liberar novas
          vagas/convocações. →
        </a>
      )}

      <PushToggleLoja />

      <TrilhaAprendizado
        id={ctx.gestorId ? "gestor-v1" : "loja-v1"}
        titulo={ctx.gestorId ? "Guia do Gestor" : "Guia da Loja"}
        passos={ctx.gestorId ? TRILHA_GESTOR : TRILHA_LOJA}
      />

      <div data-tour="loja-convidar">
        <CompartilharCadastro />
      </div>

      {ctx.gestorId && gestorLojas.length > 0 && (
        <section data-tour="gestor-lojas">
          <h2 className="mb-2 font-semibold text-gray-900">Vagas abertas nas suas lojas</h2>
          <div className="space-y-2">
            {gestorLojas.map((gl) => (
              <div key={gl.id} className="rounded-xl border border-gray-200 bg-white p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-gray-900">{gl.nome}</span>
                  <span className="text-xs text-gray-500">{gl.requisicoes.length} vaga(s) aberta(s)</span>
                </div>
                {gl.requisicoes.length > 0 && (
                  <ul className="mt-1 space-y-0.5">
                    {gl.requisicoes.slice(0, 6).map((r) => (
                      <li key={r.id} className="text-xs capitalize text-gray-600">
                        {formatDateWithWeekday(r.data)} ·{" "}
                        <span className={`rounded px-1 ${corDoTurno(r.horaInicio).chip}`}>
                          {r.horaInicio}–{r.horaFim}
                        </span>{" "}
                        · {r.funcao ?? "qualquer"} · {formatBRL(r.valorDiaria)}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {pendentes === 0 && ultima && (
        <form action={criarRequisicaoLoja}>
          <input type="hidden" name="data" value={hoje} />
          <input type="hidden" name="horaInicio" value={ultima.horaInicio} />
          <input type="hidden" name="horaFim" value={ultima.horaFim} />
          <input type="hidden" name="funcao" value={ultima.funcao ?? ""} />
          <input type="hidden" name="quantidade" value={String(ultima.quantidade)} />
          <input type="hidden" name="valorDiaria" value={String(ultima.valorDiaria / 100)} />
          <button
            type="submit"
            className="w-full rounded-xl border border-orange-200 bg-orange-50 p-3 text-left text-sm font-medium text-orange-900 hover:bg-orange-100"
          >
            🔁 Pedir de novo (hoje):{" "}
            <strong>
              {ultima.quantidade} {ultima.funcao ?? "diarista(s)"}
            </strong>{" "}
            · {ultima.horaInicio}–{ultima.horaFim} · {formatBRL(ultima.valorDiaria)}
          </button>
        </form>
      )}

      <section data-tour="loja-resumo">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="font-semibold text-gray-900">
            Resumo {diaSel ? "do dia" : "da semana"}
          </h2>
          {escalasPeriodo.length > 0 && (
            <div className="flex shrink-0 gap-1.5">
              <CopyButton
                text={textoDia}
                label="📋 Copiar lista"
                className="rounded-lg border border-orange-300 bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-800 hover:bg-orange-100"
              />
              {pixHoje && ctx.gestorId && (
                <CopyButton
                  text={pixHoje}
                  label="Copiar Pix"
                  className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700"
                />
              )}
            </div>
          )}
        </div>
        <div className="mb-3">
          <BarraDia basePath="/loja" diaSel={diaSel} />
        </div>
        {escalasPeriodo.length === 0 ? (
          <EmptyState>Nenhuma diária {diaSel ? "nesse dia" : "nesta semana"}.</EmptyState>
        ) : (
          <div className="space-y-4">
            {diasComEscala.map((dataDia) => {
              const listaDia = escalasPorDia.get(dataDia)!;
              const porLojaDia = new Map<string, typeof listaDia>();
              for (const e of listaDia) {
                const arr = porLojaDia.get(e.loja.nome) ?? [];
                arr.push(e);
                porLojaDia.set(e.loja.nome, arr);
              }
              const variasLojasNoDia = porLojaDia.size > 1;
              return (
                <div key={dataDia}>
                  <h3 className="mb-1 text-sm font-bold uppercase tracking-wide text-gray-500">
                    <span className="capitalize">{formatDateWithWeekday(dataDia)}</span>
                    {dataDia === hoje && (
                      <span className="ml-2 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-medium text-orange-700">
                        hoje
                      </span>
                    )}
                  </h3>
                  <div className="space-y-3">
                    {[...porLojaDia.entries()].map(([nomeLoja, lista]) => (
                      <div key={nomeLoja}>
                        {variasLojasNoDia && (
                          <h4 className="mb-1 text-sm font-semibold text-gray-600">{nomeLoja}</h4>
                        )}
                        <Card>
                          <ul className="divide-y divide-gray-100">
                            {lista.map((e) => (
                      <li key={e.id} className="py-2">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-medium text-gray-900">{e.diarista.nome}</p>
                            <p className="text-xs text-gray-600">
                              {e.diarista.funcao ? `${e.diarista.funcao} · ` : ""}
                              {e.horaInicio && e.horaFim ? `${e.horaInicio}–${e.horaFim} · ` : ""}
                              <span className="font-semibold text-gray-800">{formatBRL(e.valor)}</span>
                            </p>
                            <p className="text-[11px] text-gray-400">
                              {e.checkinEm
                                ? `check-in ${horaDe(e.checkinEm)}`
                                : "aguardando check-in"}
                            </p>
                          </div>
                          <div className="shrink-0">
                            {e.checkoutEm ? (
                              <span className="text-xs text-gray-500">
                                saída {horaDe(e.checkoutEm)} · {formatBRL(e.valorPago ?? e.valor)}
                              </span>
                            ) : e.checkinEm ? (
                              <form action={registrarCheckout}>
                                <input type="hidden" name="escalaId" value={e.id} />
                                <button
                                  type="submit"
                                  className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                  Registrar saída
                                </button>
                              </form>
                            ) : (
                              <span className="text-xs text-gray-400">—</span>
                            )}
                          </div>
                        </div>

                        {ctx.gestorId && (
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            {e.diarista.chavePix ? (
                              <span className="flex items-center gap-1 text-xs text-gray-600">
                                <span className="max-w-[11rem] truncate">
                                  Pix: {e.diarista.chavePix}
                                </span>
                                <CopyButton
                                  text={e.diarista.chavePix}
                                  label="copiar"
                                  className="rounded border border-gray-300 bg-white px-1.5 py-0.5 text-[11px] font-medium text-gray-700"
                                />
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">sem Pix cadastrado</span>
                            )}
                            {e.pago ? (
                              <form action={marcarPagoDiaria.bind(null, e.id, false)}>
                                <SubmitButton
                                  pendingLabel="…"
                                  className="rounded-lg bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700"
                                >
                                  ✓ Pago (desfazer)
                                </SubmitButton>
                              </form>
                            ) : (
                              <form action={marcarPagoDiaria.bind(null, e.id, true)}>
                                <SubmitButton
                                  pendingLabel="…"
                                  className="rounded-lg bg-orange-700 px-2.5 py-1 text-xs font-medium text-white hover:bg-orange-800"
                                >
                                  Marcar pago
                                </SubmitButton>
                              </form>
                            )}
                          </div>
                        )}
                      </li>
                            ))}
                          </ul>
                        </Card>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section data-tour="loja-requisicoes">
        <h2 className="mb-2 font-semibold text-gray-900">Minhas requisições</h2>
        {requisicoes.length === 0 ? (
          <EmptyState>
            Nenhuma requisição ainda. Toque em <strong>Solicitar diaristas</strong>.
          </EmptyState>
        ) : (
          <div className="space-y-3">
            {requisicoes.map((r) => {
              const st = statusLabel(r.status);
              const turno = corDoTurno(r.horaInicio);
              // Confirmados desta vaga: escalas vinculadas a ela ou do mesmo dia (vínculos antigos).
              const confirmados = escalas.filter(
                (e) => e.requisicaoId === r.id || (e.requisicaoId == null && e.data === r.data),
              );
              const faltam = r.quantidade - confirmados.length;
              return (
                <div
                  key={r.id}
                  className={`rounded-xl border p-4 shadow-sm ${corDaFuncao(r.funcao).card}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{r.loja.nome}</p>
                      <p className="text-sm capitalize text-gray-700">
                        {formatDateWithWeekday(r.data)} ·{" "}
                        <span className={`rounded px-1.5 py-0.5 font-medium ${turno.chip}`}>
                          {r.horaInicio}–{r.horaFim}
                        </span>
                      </p>
                      <p className="mt-1 text-sm text-gray-600">
                        <strong>{r.quantidade}</strong> diarista(s)
                        {r.funcao ? <> · {r.funcao}</> : null} · {formatBRL(r.valorDiaria)}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {confirmados.length} confirmado(s) · {r._count.inscricoes} candidato(s)
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {Array.from({ length: r.quantidade }).map((_, i) => (
                          <span
                            key={i}
                            className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ${
                              i < confirmados.length
                                ? "bg-green-600 text-white"
                                : "border border-dashed border-gray-400 text-gray-400"
                            }`}
                          >
                            {i < confirmados.length ? "✓" : i + 1}
                          </span>
                        ))}
                      </div>
                      {confirmados.length > 0 && (
                        <div className="mt-1.5">
                          <p className="text-[11px] font-medium text-gray-500">Confirmados:</p>
                          <ul className="mt-0.5 space-y-0.5">
                            {confirmados.map((es) => {
                              const stt =
                                es.presenca === "PRESENTE"
                                  ? { t: "presente", c: "bg-green-100 text-green-700" }
                                  : es.presenca === "FALTOU"
                                    ? { t: "faltou", c: "bg-red-100 text-red-700" }
                                    : { t: "confirmado", c: "bg-green-100 text-green-700" };
                              return (
                                <li key={es.id} className="flex items-center gap-1.5">
                                  <Avatar
                                    nome={es.diarista.nome}
                                    fotoUrl={es.diarista.fotoUrl}
                                    className="h-5 w-5"
                                  />
                                  <span className="text-xs text-gray-700">{es.diarista.nome}</span>
                                  <span
                                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${stt.c}`}
                                  >
                                    {stt.t}
                                  </span>
                                  <Link
                                    href={`/loja/candidato/${es.diarista.id}`}
                                    className="text-[10px] font-medium text-orange-700 underline"
                                  >
                                    saber mais
                                  </Link>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}
                      {convocadosDaReq(r.id, r.data).filter((c) => c.status !== "ACEITA").length >
                        0 && (
                        <div className="mt-1.5">
                          <p className="text-[11px] font-medium text-gray-500">Convocados:</p>
                          <ul className="mt-0.5 space-y-0.5">
                            {convocadosDaReq(r.id, r.data)
                              .filter((c) => c.status !== "ACEITA")
                              .map((c) => {
                                const sc = statusConvocacao(c.status);
                                return (
                                  <li key={c.id} className="flex items-center gap-1.5">
                                    <Avatar
                                      nome={c.diarista.nome}
                                      fotoUrl={c.diarista.fotoUrl}
                                      className="h-5 w-5"
                                    />
                                    <span className="text-xs text-gray-700">{c.diarista.nome}</span>
                                    <span
                                      className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${sc.cls}`}
                                    >
                                      {sc.txt}
                                    </span>
                                  </li>
                                );
                              })}
                          </ul>
                        </div>
                      )}
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${st.cls}`}>
                      {st.txt}
                    </span>
                  </div>

                  {r.status === "ABERTA" && (
                    <div className="mt-3 space-y-2 border-t border-black/5 pt-3">
                      {r.inscricoes.length === 0 ? (
                        <p className="text-xs text-gray-500">
                          Ninguém se candidatou ainda. Você será avisado quando alguém pegar.
                        </p>
                      ) : (
                        <>
                          <p className="text-xs font-medium text-gray-600">
                            {faltam > 0
                              ? "Clique no candidato que quer aprovar:"
                              : "Vagas preenchidas."}
                          </p>
                          {r.inscricoes.map((insc) => {
                            const d = insc.diarista;
                            const nota = notaDe(d.avaliacoes);
                            const diarias = d._count.escalas;
                            const cont = new Map<string, number>();
                            for (const e of d.escalas)
                              cont.set(e.loja.nome, (cont.get(e.loja.nome) ?? 0) + 1);
                            const topLoja = [...cont.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
                            const destaque = nota !== null && nota > 4.5 && diarias > 10;
                            const resumo = `${diarias} diária(s)${topLoja ? ` · mais em ${topLoja}` : ""}${nota !== null ? ` · nota ${nota.toFixed(1)}` : ""}`;
                            return (
                              <div
                                key={insc.id}
                                className="flex items-center justify-between gap-2 rounded-lg bg-white/70 p-2"
                              >
                                <span className="flex min-w-0 items-center gap-2">
                                  <Avatar
                                    nome={d.nome}
                                    fotoUrl={d.fotoUrl}
                                    className="h-9 w-9"
                                  />
                                  <span className="min-w-0">
                                    <Link
                                      href={`/loja/candidato/${d.id}`}
                                      title={resumo}
                                      className="block text-[11px] font-medium text-orange-700 underline"
                                    >
                                      saber mais
                                    </Link>
                                    <span className="block truncate text-sm font-medium text-gray-900">
                                      {d.nome}
                                      {destaque && <span title="Destaque: nota alta e experiente"> ⭐</span>}
                                    </span>
                                    <span className="block text-[11px] text-gray-500">
                                      {nota !== null ? `★ ${nota.toFixed(1)} · ` : ""}
                                      {diarias} diária(s)
                                      {topLoja ? ` · ${topLoja}` : ""}
                                    </span>
                                  </span>
                                </span>
                                <div className="flex shrink-0 items-center gap-1.5">
                                  {faltam > 0 && (
                                    <form action={aprovarCandidato.bind(null, r.id, d.id)}>
                                      <SubmitButton
                                        pendingLabel="…"
                                        className="rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700"
                                      >
                                        ✓ Sim
                                      </SubmitButton>
                                    </form>
                                  )}
                                  <form action={recusarCandidato.bind(null, r.id, d.id)}>
                                    <SubmitButton
                                      pendingLabel="…"
                                      className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                                    >
                                      ✕ Não
                                    </SubmitButton>
                                  </form>
                                </div>
                              </div>
                            );
                          })}
                        </>
                      )}

                      {faltam > 0 && topConvocar.length > 0 && (
                        <div className="border-t border-black/5 pt-2">
                          <p className="text-[11px] font-medium text-gray-600">
                            Ou convoque quem mais trabalha aqui:
                          </p>
                          {topConvocar.map((d, i) => (
                            <div key={d.id} className="mt-1 flex items-center justify-between gap-2">
                              <span className="min-w-0">
                                <span className="block truncate text-sm text-gray-800">
                                  {d.nome}{" "}
                                  <span className="text-[10px] text-gray-400">top {i + 1}</span>
                                </span>
                                {d.chavePix && (
                                  <span className="flex items-center gap-1 text-[11px] text-gray-500">
                                    <span className="max-w-[9rem] truncate">Pix: {d.chavePix}</span>
                                    <CopyButton
                                      text={d.chavePix}
                                      label="copiar"
                                      className="rounded border border-gray-300 bg-white px-1 py-0.5 text-[10px] font-medium text-gray-700"
                                    />
                                  </span>
                                )}
                              </span>
                              {escalaDiaristaData.has(`${d.id}|${r.data}`) ? (
                                <span className="shrink-0 rounded-lg bg-green-100 px-2.5 py-1.5 text-xs font-semibold text-green-700">
                                  ✓ confirmado
                                </span>
                              ) : convocadoData.has(`${d.id}|${r.data}`) ? (
                                <span className="shrink-0 rounded-lg bg-amber-100 px-2.5 py-1.5 text-xs font-semibold text-amber-700">
                                  ⏳ aguardando
                                </span>
                              ) : (
                                <form action={convocarDiarista}>
                                  <input type="hidden" name="diaristaId" value={d.id} />
                                  <input type="hidden" name="data" value={r.data} />
                                  <input type="hidden" name="requisicaoId" value={r.id} />
                                  <SubmitButton
                                    pendingLabel="…"
                                    className="shrink-0 rounded-lg border border-orange-300 bg-orange-50 px-2.5 py-1.5 text-xs font-semibold text-orange-800 hover:bg-orange-100"
                                  >
                                    Convocar {d.nome.split(" ")[0]}
                                  </SubmitButton>
                                </form>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="border-t border-black/5 pt-2">
                        <p className="mb-1 text-[11px] font-medium text-gray-600">
                          Candidato sem cadastro? Envie este link (ele já entra nesta vaga):
                        </p>
                        <CopyLink path={`/sou-diarista?vaga=${r.id}`} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {topDiaristas.length > 0 && (
        <section>
          <h2 className="mb-2 font-semibold text-gray-900">Top diaristas da sua loja</h2>
          <Card>
            <ul className="divide-y divide-gray-100">
              {topDiaristas.slice(0, 10).map((d, i) => (
                <li key={d.id} className="flex items-center justify-between gap-3 py-2">
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="w-6 text-center text-sm font-bold text-gray-400">
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}º`}
                    </span>
                    <Avatar nome={d.nome} fotoUrl={d.fotoUrl} className="h-9 w-9" />
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-gray-900">{d.nome}</span>
                      <span className="block text-xs text-gray-500">
                        {d.vezes} diária(s){d.funcao ? ` · ${d.funcao}` : ""}
                      </span>
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-semibold text-orange-700">
                    {d.nota !== null ? `★ ${d.nota.toFixed(1)}` : "—"}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      )}

      {pendentesList.length > 0 && (
        <section id="avaliar-diaristas" className="scroll-mt-4">
          <h2 className="mb-2 font-semibold text-gray-900">Avaliar diaristas</h2>
          <p className="mb-2 text-xs text-gray-500">
            Toque nas estrelas para avaliar — registra na hora, sem abrir outra página.
          </p>
          <Card>
            <ul className="divide-y divide-gray-100">
              {pendentesList.map((e) => (
                <li
                  key={e.id}
                  className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-gray-900">{e.diarista.nome}</p>
                    <p className="text-sm capitalize text-gray-500">{formatDate(e.data)}</p>
                  </div>
                  <EstrelasAvaliacao escalaId={e.id} valorInicial={e.avaliacao?.estrelas ?? 0} />
                </li>
              ))}
            </ul>
          </Card>
        </section>
      )}

      <section>
        <h2 className="mb-2 font-semibold text-gray-900">Diaristas que já vieram</h2>
        {diaristas.length === 0 ? (
          <EmptyState>Ninguém escalado para esta loja ainda.</EmptyState>
        ) : (
          <div className="space-y-2">
            {diaristas.map((d) => {
              const bloq = bloqueioPorDiarista.get(d.id);
              return (
                <Card key={d.id}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex min-w-0 items-center gap-2">
                      <Avatar nome={d.nome} fotoUrl={d.fotoUrl} className="h-8 w-8" />
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-gray-900">{d.nome}</span>
                        {d.funcao && (
                          <span className="rounded-full bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-700">
                            {d.funcao}
                          </span>
                        )}
                      </span>
                    </span>
                    <span className="shrink-0 text-sm text-gray-500">{d.vezes}× aqui</span>
                  </div>

                  <p className="mt-1 text-xs text-gray-500">
                    {d.nota !== null && (
                      <span className="font-medium text-orange-700">
                        ★ {d.nota.toFixed(1)} de 5 ·{" "}
                      </span>
                    )}
                    {d.datas.slice(0, 5).map(formatDate).join(", ")}
                    {d.datas.length > 5 ? "…" : ""}
                  </p>

                  {bloq ? (
                    <div className="mt-2 flex items-center justify-between gap-2 border-t border-gray-100 pt-2">
                      {bloq.origem === "RH" ? (
                        <span className="text-xs font-medium text-red-600">
                          Bloqueado pelo RH (permanente)
                        </span>
                      ) : (
                        <>
                          <span className="text-xs font-medium text-red-600">
                            Bloqueado até {bloq.ate ? formatDate(bloq.ate.toISOString().slice(0, 10)) : ""}
                          </span>
                          <form action={desbloquearDiaristaLoja}>
                            <input type="hidden" name="diaristaId" value={d.id} />
                            <button type="submit" className="text-xs text-orange-700 underline">
                              desbloquear
                            </button>
                          </form>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="mt-2 flex justify-end border-t border-gray-100 pt-2">
                      <BotaoBloquear diaristaId={d.id} />
                    </div>
                  )}

                  {pendentes === 0 ? (
                    <div className="mt-2 border-t border-gray-100 pt-2">
                      {convocadoDiarista.has(d.id) && (
                        <p className="mb-1 text-xs font-semibold text-green-700">
                          ✓ convocado (aguardando resposta)
                        </p>
                      )}
                      <form action={convocarDiarista} className="flex items-center gap-2">
                        <input type="hidden" name="diaristaId" value={d.id} />
                        <input
                          type="date"
                          name="data"
                          required
                          min={hojeISO()}
                          max={maxAgendamentoISO()}
                          defaultValue={hojeISO()}
                          className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-sm"
                        />
                        <SubmitButton
                          pendingLabel="Convocando…"
                          className="rounded-lg bg-orange-700 px-3 py-1 text-sm font-medium text-white hover:bg-orange-800"
                        >
                          Convocar
                        </SubmitButton>
                      </form>
                    </div>
                  ) : null}
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <h2 className="font-semibold text-gray-900">Fotos e vantagens da loja</h2>
          <p className="mt-1 text-xs text-gray-500">
            Mostre seu ambiente e por que vale a pena fazer diária aqui. Os diaristas veem as fotos
            num carrossel ao escolher a vaga.
          </p>
          <div className="mt-3">
            <FotosLojaUpload fotos={loja?.fotos ?? []} />
          </div>
          <form action={salvarVantagensLoja} className="mt-3">
            <label className="text-sm font-medium text-gray-700" htmlFor="vantagens">
              Vantagens de fazer diária aqui
            </label>
            <textarea
              id="vantagens"
              name="vantagens"
              rows={3}
              defaultValue={loja?.vantagens ?? ""}
              placeholder="Ex.: ambiente tranquilo, equipe parceira, pagamento no mesmo dia…"
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-orange-600 focus:ring-2 focus:ring-orange-100"
            />
            <button
              type="submit"
              className="mt-2 rounded-lg bg-orange-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-orange-800"
            >
              Salvar vantagens
            </button>
          </form>
        </div>
      </section>

      <section>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <h2 className="font-semibold text-gray-900">Limite de diárias por semana</h2>
          <p className="mt-1 text-xs text-gray-500">
            Por padrão, cada diarista pode fazer no máximo <strong>2 diárias por semana</strong> na
            sua loja, para evitar vínculo trabalhista.
          </p>
          <form action={alternarLimiteSemana} className="mt-3 flex items-center justify-between gap-3">
            <span
              className={`text-sm font-medium ${loja?.permiteMais2Semana ? "text-red-600" : "text-gray-700"}`}
            >
              {loja?.permiteMais2Semana
                ? "Liberado: mais de 2/semana permitido (você assume o risco)"
                : "Limite ativo: máximo 2 por semana"}
            </span>
            <button
              type="submit"
              className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium ${
                loja?.permiteMais2Semana
                  ? "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  : "bg-orange-700 text-white hover:bg-orange-800"
              }`}
            >
              {loja?.permiteMais2Semana ? "Reativar limite" : "Liberar +2/semana"}
            </button>
          </form>
        </div>
      </section>

      <p className="px-1 text-xs text-gray-400">
        Bloquear demais pode deixar sua loja sem diaristas suficientes nas próximas diárias.
      </p>
    </div>
  );
}
