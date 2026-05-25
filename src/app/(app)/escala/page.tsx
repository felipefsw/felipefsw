import { Fragment } from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, EmptyState, btnPrimary } from "@/components/ui";
import ConfirmSubmit from "@/components/ConfirmSubmit";
import CopyLink from "@/components/CopyLink";
import DiaristaInfo from "@/components/DiaristaInfo";
import BarraDia from "@/components/BarraDia";
import { formatBRL, formatDateShort, formatDateWithWeekday } from "@/lib/format";
import { addDias, hojeISO, inicioDaSemana, isISODate, semana, turnoComecou } from "@/lib/dates";
import { grupoDaLoja } from "@/lib/marcas";
import EstrelasAvaliacao from "@/components/EstrelasAvaliacao";
import SubmitButton from "@/components/SubmitButton";
import { avaliarEstrelasRH, deleteEscala, gerarLinkConfirmacao, marcarPresenca } from "./actions";

export const dynamic = "force-dynamic";

function notaDe(avaliacoes: { estrelas: number }[]): number | null {
  if (avaliacoes.length < 5) return null;
  return avaliacoes.reduce((s, a) => s + a.estrelas, 0) / avaliacoes.length;
}

export default async function EscalaPage({
  searchParams,
}: {
  searchParams: Promise<{ inicio?: string; dia?: string; erro?: string }>;
}) {
  const sp = await searchParams;
  const hoje = hojeISO();

  // Vista por dia (?dia=) ou pela semana inteira (padrão / ?inicio=).
  const diaSel = sp.dia && isISODate(sp.dia) ? sp.dia : null;
  const inicio =
    sp.inicio && isISODate(sp.inicio) ? inicioDaSemana(sp.inicio) : inicioDaSemana(hoje);
  const dias = diaSel ? [diaSel] : semana(inicio);
  const fim = dias[dias.length - 1];

  const [escalas, convitesPendentes] = await Promise.all([
    prisma.escala.findMany({
      where: { data: { gte: dias[0], lte: fim } },
      include: {
        diarista: {
          select: {
            id: true,
            nome: true,
            fotoUrl: true,
            funcao: true,
            avaliacoes: { select: { estrelas: true }, orderBy: { criadoEm: "desc" }, take: 5 },
            _count: { select: { escalas: { where: { presenca: "PRESENTE" } } } },
          },
        },
        loja: true,
        avaliacao: { select: { id: true, estrelas: true } },
      },
      orderBy: [{ data: "asc" }, { criadoEm: "asc" }],
    }),
    prisma.convocacao.count({
      where: { status: "PENDENTE", data: { gte: dias[0], lte: fim } },
    }),
  ]);

  const porDia = new Map<string, typeof escalas>();
  for (const dia of dias) porDia.set(dia, []);
  for (const e of escalas) porDia.get(e.data)?.push(e);

  // 4 indicadores do período. "Realizada"/"Falta" só valem depois do turno começar;
  // antes disso, mesmo marcada, conta como confirmada (ainda vai acontecer).
  const realizadas = escalas.filter(
    (e) => turnoComecou(e.data, e.horaInicio) && e.presenca === "PRESENTE",
  ).length;
  const faltas = escalas.filter(
    (e) => turnoComecou(e.data, e.horaInicio) && e.presenca === "FALTOU",
  ).length;
  const confirmadas = escalas.filter((e) => {
    const c = turnoComecou(e.data, e.horaInicio);
    return !(c && (e.presenca === "PRESENTE" || e.presenca === "FALTOU"));
  }).length;
  const programadas = convitesPendentes; // convites enviados, aguardando aceite

  const indicadores = [
    { n: confirmadas, label: "Confirmadas", cls: "border-green-200 bg-green-50 text-green-800" },
    { n: realizadas, label: "Realizadas", cls: "border-blue-200 bg-blue-50 text-blue-800" },
    { n: programadas, label: "Programadas", cls: "border-amber-200 bg-amber-50 text-amber-800" },
    { n: faltas, label: "Faltas", cls: "border-red-200 bg-red-50 text-red-800" },
  ];

  return (
    <div>
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Escala</h1>
          <p className="text-sm capitalize text-gray-500">
            {diaSel
              ? formatDateWithWeekday(diaSel)
              : `${formatDateShort(dias[0])} – ${formatDateShort(fim)}`}
          </p>
        </div>
        <Link href="/escala/novo" className={btnPrimary}>
          + Agendar
        </Link>
      </div>

      <div className="mb-4">
        <BarraDia basePath="/escala" diaSel={diaSel} />
      </div>

      <div className="mb-4 grid grid-cols-4 gap-2">
        {indicadores.map((i) => (
          <div key={i.label} className={`rounded-xl border p-2 text-center ${i.cls}`}>
            <p className="text-xl font-bold leading-none">{i.n}</p>
            <p className="mt-1 text-[11px] font-medium leading-tight">{i.label}</p>
          </div>
        ))}
      </div>

      {sp.erro === "conflito" && (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
          Esse diarista já tem uma diária nesse dia. Não dá pra agendar em duas lojas no mesmo dia.
        </div>
      )}
      {sp.erro === "limite" && (
        <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-medium text-amber-800">
          Limite de 2 diárias por semana nessa loja atingido. Libere o limite na loja se quiser.
        </div>
      )}
      {sp.erro === "bloqueado" && (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
          Essa diarista está bloqueada pelo RH e não pode ser escalada.
        </div>
      )}

      {diaSel ? (
        <div className="mb-4 flex items-center justify-between gap-2">
          <Link
            href={`/escala?dia=${addDias(diaSel, -1)}`}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            ← Dia
          </Link>
          <Link href={`/escala?dia=${hoje}`} className="text-sm font-medium text-orange-700 hover:underline">
            Hoje
          </Link>
          <Link
            href={`/escala?dia=${addDias(diaSel, 1)}`}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Dia →
          </Link>
        </div>
      ) : (
        <div className="mb-4 flex items-center justify-between gap-2">
          <Link
            href={`/escala?inicio=${addDias(inicio, -7)}`}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            ← Semana
          </Link>
          <Link href="/escala" className="text-sm font-medium text-orange-700 hover:underline">
            Esta semana
          </Link>
          <Link
            href={`/escala?inicio=${addDias(inicio, 7)}`}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Semana →
          </Link>
        </div>
      )}

      <div className="space-y-3">
        {dias.map((dia) => {
          const lista = porDia.get(dia) ?? [];
          const ordenada = [...lista].sort((a, b) => {
            const ga = grupoDaLoja(a.loja.nome);
            const gb = grupoDaLoja(b.loja.nome);
            return ga.ordem - gb.ordem || a.loja.nome.localeCompare(b.loja.nome);
          });
          const ehHoje = dia === hoje;
          return (
            <Card key={dia} className={ehHoje ? "ring-2 ring-orange-200" : ""}>
              <div className="mb-2 flex items-center justify-between">
                <span className="font-semibold capitalize text-gray-900">
                  {formatDateWithWeekday(dia)}
                  {ehHoje && (
                    <span className="ml-2 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                      hoje
                    </span>
                  )}
                </span>
                <Link
                  href={`/escala/novo?data=${dia}`}
                  className="text-sm font-medium text-orange-700 hover:underline"
                >
                  + agendar
                </Link>
              </div>

              {lista.length === 0 ? (
                <p className="text-sm text-gray-400">Sem agendamentos.</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {ordenada.map((e, idx) => {
                    const marcaLabel = grupoDaLoja(e.loja.nome).label;
                    const prevLabel =
                      idx > 0 ? grupoDaLoja(ordenada[idx - 1].loja.nome).label : null;
                    const comecou = turnoComecou(e.data, e.horaInicio);
                    const realizada = comecou && e.presenca === "PRESENTE";
                    const falta = comecou && e.presenca === "FALTOU";
                    return (
                      <Fragment key={e.id}>
                        {marcaLabel !== prevLabel && (
                          <li className="pt-2 text-[11px] font-bold uppercase tracking-wide text-gray-400">
                            {marcaLabel}
                          </li>
                        )}
                        <li className="py-2">
                          <div className="flex items-start justify-between gap-3">
                            <DiaristaInfo
                              nome={e.diarista.nome}
                              fotoUrl={e.diarista.fotoUrl}
                              funcao={e.diarista.funcao}
                              nota={notaDe(e.diarista.avaliacoes)}
                              diarias={e.diarista._count.escalas}
                              avatarClassName="h-9 w-9"
                              extra={
                                <span className="block text-xs text-gray-600">
                                  {e.loja.nome}
                                  {" · "}
                                  {e.horaInicio && e.horaFim ? `${e.horaInicio}–${e.horaFim} · ` : ""}
                                  {formatBRL(e.valor)}
                                </span>
                              }
                            />

                            <div className="flex shrink-0 flex-col items-end gap-1.5">
                              {realizada || falta ? (
                                <div className="flex items-center gap-1.5">
                                  {realizada ? (
                                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                                      Realizada
                                    </span>
                                  ) : (
                                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                                      Faltou
                                    </span>
                                  )}
                                  {e.pago && (
                                    <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                                      pago
                                    </span>
                                  )}
                                  <form action={marcarPresenca}>
                                    <input type="hidden" name="id" value={e.id} />
                                    <input type="hidden" name="presenca" value="PENDENTE" />
                                    <button
                                      type="submit"
                                      className="text-xs text-gray-400 underline hover:text-gray-600"
                                    >
                                      desfazer
                                    </button>
                                  </form>
                                </div>
                              ) : comecou ? (
                                <div className="flex gap-1.5">
                                  <form action={marcarPresenca}>
                                    <input type="hidden" name="id" value={e.id} />
                                    <input type="hidden" name="presenca" value="PRESENTE" />
                                    <SubmitButton className="rounded-lg bg-green-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-green-700">
                                      Presente
                                    </SubmitButton>
                                  </form>
                                  <form action={marcarPresenca}>
                                    <input type="hidden" name="id" value={e.id} />
                                    <input type="hidden" name="presenca" value="FALTOU" />
                                    <SubmitButton className="rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50">
                                      Faltou
                                    </SubmitButton>
                                  </form>
                                </div>
                              ) : (
                                <span
                                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                    e.confirmadaEm
                                      ? "bg-green-100 text-green-700"
                                      : "bg-amber-100 text-amber-700"
                                  }`}
                                >
                                  {e.confirmadaEm ? "✓ confirmou" : "aguardando o dia"}
                                </span>
                              )}

                              {realizada && (
                                <EstrelasAvaliacao
                                  escalaId={e.id}
                                  valorInicial={e.avaliacao?.estrelas ?? 0}
                                  acao={avaliarEstrelasRH}
                                />
                              )}

                              {e.data >= hoje && !realizada && !falta && (
                                <form action={deleteEscala}>
                                  <input type="hidden" name="id" value={e.id} />
                                  <ConfirmSubmit
                                    className="text-xs text-gray-400 hover:text-red-600"
                                    message="Excluir este agendamento?"
                                  >
                                    excluir
                                  </ConfirmSubmit>
                                </form>
                              )}
                            </div>
                          </div>

                          {!realizada && !falta && !comecou && (
                            <div className="mt-2">
                              {e.tokenConfirmacao ? (
                                <>
                                  <p className="mb-1 text-xs text-gray-400">
                                    Link de confirmação (envie para a diarista):
                                  </p>
                                  <CopyLink path={`/confirmar/${e.tokenConfirmacao}`} />
                                </>
                              ) : (
                                <form action={gerarLinkConfirmacao}>
                                  <input type="hidden" name="id" value={e.id} />
                                  <button
                                    type="submit"
                                    className="text-xs font-medium text-orange-700 underline"
                                  >
                                    🔗 gerar link de confirmação
                                  </button>
                                </form>
                              )}
                            </div>
                          )}
                        </li>
                      </Fragment>
                    );
                  })}
                </ul>
              )}
            </Card>
          );
        })}
      </div>

      {escalas.length === 0 && (
        <div className="mt-4">
          <EmptyState>
            Nenhum agendamento no período. Toque em <strong>+ Agendar</strong>.
          </EmptyState>
        </div>
      )}
    </div>
  );
}
