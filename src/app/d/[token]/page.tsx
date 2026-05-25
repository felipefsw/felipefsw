import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatBRL, formatDateWithWeekday } from "@/lib/format";
import { addDias, hojeISO, podeDesistir, turnoFinalizado } from "@/lib/dates";
import { corDoTurno } from "@/lib/horarios";
import { enderecoCompleto } from "@/lib/loja";
import CopyButton from "@/components/CopyButton";
import CheckinButton from "@/components/CheckinButton";
import MarcaBadge from "@/components/MarcaBadge";
import ConfirmSubmit from "@/components/ConfirmSubmit";
import ListaDiarias from "@/components/ListaDiarias";
import { exigirDiarista } from "@/lib/diaristaSessao";
import { montarItensDiarias, notasDasLojas, type ContextoDiarista } from "@/lib/diariasView";
import {
  confirmarPresenca,
  desistirDaDiaria,
  fazerCheckin,
  responderConvocacao,
} from "./actions";

export const dynamic = "force-dynamic";

function horaDe(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default async function DiaristaHomePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ checkin?: string; desistir?: string }>;
}) {
  const { token } = await params;
  const { checkin, desistir } = await searchParams;
  await exigirDiarista(token);

  const hoje = hojeISO();
  const desde = addDias(hoje, -14);

  const [diarista, requisicoesHoje] = await Promise.all([
    prisma.diarista.findUnique({
      where: { token },
      include: {
        escalas: {
          where: { data: { gte: desde } },
          include: { loja: true, avaliacaoLoja: { select: { id: true } } },
          orderBy: { data: "asc" },
        },
        inscricoes: { select: { requisicaoId: true } },
        convidadoEm: { select: { id: true } },
        lojasPreferidas: { select: { id: true } },
        bloqueios: {
          where: { OR: [{ ate: null }, { ate: { gt: new Date() } }] },
          select: { lojaId: true },
        },
        convocacoes: {
          where: { status: "PENDENTE" },
          include: { loja: true },
          orderBy: { data: "asc" },
        },
      },
    }),
    prisma.requisicao.findMany({
      where: { status: "ABERTA", data: hoje },
      include: { loja: true },
      orderBy: { criadoEm: "desc" },
    }),
  ]);

  if (!diarista) return null;

  const proximas = diarista.escalas.filter((e) => e.data >= hoje);
  const recentes = diarista.escalas.filter((e) => e.data < hoje).reverse();

  const pendentesAvaliacao = diarista.escalas.filter(
    (e) =>
      e.presenca === "PRESENTE" &&
      !e.avaliacaoLoja &&
      turnoFinalizado(e.data, e.horaInicio, e.horaFim),
  );
  const bloqueado = pendentesAvaliacao.length > 0;

  // Frequência por loja (diárias já feitas) e favoritas, para o filtro.
  const freqPorLoja = new Map<string, number>();
  for (const e of diarista.escalas) {
    if (e.presenca === "PRESENTE") {
      freqPorLoja.set(e.lojaId, (freqPorLoja.get(e.lojaId) ?? 0) + 1);
    }
  }

  const ctx: ContextoDiarista = {
    funcao: diarista.funcao,
    lojasBloqueadas: new Set(diarista.bloqueios.map((b) => b.lojaId)),
    datasComEscala: new Set(diarista.escalas.map((e) => e.data)),
    convocadoLojaData: new Set(diarista.convocacoes.map((c) => `${c.lojaId}|${c.data}`)),
    inscritoEm: new Set(diarista.inscricoes.map((i) => i.requisicaoId)),
    convidadoEm: new Set(diarista.convidadoEm.map((r) => r.id)),
    freqPorLoja,
    favoritas: new Set(diarista.lojasPreferidas.map((l) => l.id)),
  };

  const notaDaLoja = await notasDasLojas([...new Set(requisicoesHoje.map((r) => r.lojaId))]);
  const itensHoje = montarItensDiarias(requisicoesHoje, ctx, notaDaLoja);

  return (
    <div className="space-y-6">
      {checkin === "ok" && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-800">
          ✓ Check-in realizado!
        </div>
      )}
      {checkin === "longe" && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
          Você parece estar longe da loja (mais de 100 m). Faça o check-in quando chegar no local.
        </div>
      )}
      {checkin === "semloc" && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
          Precisamos da sua localização para o check-in. Permita o acesso e tente de novo.
        </div>
      )}
      {checkin === "lojasemloc" && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
          Esta loja ainda não tem localização cadastrada. Avise o RH para liberar o check-in.
        </div>
      )}
      {desistir === "ok" && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-medium text-amber-800">
          Você desistiu da diária e a vaga foi reaberta.
        </div>
      )}
      {desistir === "tarde" && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
          Já passou do prazo (até 4h antes) para desistir desta diária.
        </div>
      )}

      {/* Convocações no topo: aceitar ou recusar */}
      {diarista.convocacoes.length > 0 && (
        <section>
          <h2 className="mb-2 font-semibold text-gray-900">📣 Você foi convocado!</h2>
          <ul className="space-y-3">
            {diarista.convocacoes.map((c) => (
              <li key={c.id} className="rounded-xl border border-amber-300 bg-amber-50 p-4">
                <p className="font-medium text-gray-900">{c.loja.nome}</p>
                {enderecoCompleto(c.loja) && (
                  <p className="text-sm text-gray-500">{enderecoCompleto(c.loja)}</p>
                )}
                <p className="mt-1 text-sm capitalize text-gray-700">
                  {formatDateWithWeekday(c.data)}
                </p>
                <div className="mt-3 flex gap-2">
                  {bloqueado ? (
                    <span className="flex-1 rounded-lg bg-amber-100 py-2 text-center text-xs font-medium text-amber-800">
                      Avalie sua última diária para poder aceitar
                    </span>
                  ) : (
                    <form action={responderConvocacao} className="flex-1">
                      <input type="hidden" name="token" value={token} />
                      <input type="hidden" name="convocacaoId" value={c.id} />
                      <input type="hidden" name="resposta" value="ACEITA" />
                      <button
                        type="submit"
                        className="w-full rounded-lg bg-green-600 py-2 font-medium text-white hover:bg-green-700"
                      >
                        Aceitar
                      </button>
                    </form>
                  )}
                  <form action={responderConvocacao} className="flex-1">
                    <input type="hidden" name="token" value={token} />
                    <input type="hidden" name="convocacaoId" value={c.id} />
                    <input type="hidden" name="resposta" value="RECUSADA" />
                    <button
                      type="submit"
                      className="w-full rounded-lg border border-gray-300 bg-white py-2 font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Recusar
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Avaliação pendente trava novas vagas */}
      {bloqueado && (
        <section>
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-3">
            <p className="text-sm font-semibold text-amber-800">
              ⭐ Avalie sua última diária para liberar novas vagas
            </p>
            <ul className="mt-2 space-y-2">
              {pendentesAvaliacao.map((e) => (
                <li
                  key={e.id}
                  className="flex items-center justify-between gap-2 rounded-lg bg-white p-2"
                >
                  <span className="min-w-0 text-sm">
                    <span className="block truncate font-medium text-gray-900">{e.loja.nome}</span>
                    <span className="text-xs text-gray-500">{formatDateWithWeekday(e.data)}</span>
                  </span>
                  <Link
                    href={`/d/${token}/avaliar-loja/${e.id}`}
                    className="shrink-0 rounded-lg bg-orange-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-orange-800"
                  >
                    Avaliar
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Próximas diárias confirmadas (você foi aprovado/escalado) */}
      <section>
        <h2 className="mb-2 font-semibold text-gray-900">✅ Suas próximas diárias</h2>
        {proximas.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center text-gray-500">
            Nenhuma diária confirmada por enquanto. Veja as vagas abaixo.
          </div>
        ) : (
          <ul className="space-y-3">
            {proximas.map((e) => (
              <li
                key={e.id}
                className={`rounded-xl border p-4 shadow-sm ${corDoTurno(e.horaInicio).card}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium capitalize text-gray-900">
                      {formatDateWithWeekday(e.data)}
                      {e.data === hoje && (
                        <span className="ml-2 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                          hoje
                        </span>
                      )}
                    </p>
                    <p className="flex items-center gap-1.5 text-sm text-gray-500">
                      <MarcaBadge nome={e.loja.nome} className="h-5 w-5 shrink-0 rounded" />
                      {e.loja.nome}
                    </p>
                    {enderecoCompleto(e.loja) && (
                      <p className="text-xs text-gray-400">{enderecoCompleto(e.loja)}</p>
                    )}
                    <p className="mt-1 text-sm text-gray-600">
                      {e.horaInicio && e.horaFim ? (
                        <span
                          className={`mr-1 rounded px-1.5 py-0.5 font-medium ${corDoTurno(e.horaInicio).chip}`}
                        >
                          {e.horaInicio}–{e.horaFim}
                        </span>
                      ) : null}
                      {formatBRL(e.valor)}
                    </p>
                  </div>
                  {e.presenca === "PRESENTE" ? (
                    <span className="shrink-0 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                      ✓ confirmado
                    </span>
                  ) : null}
                </div>

                {e.checkinEm ? (
                  <div className="mt-2 text-sm text-green-700">
                    ✓ Check-in às {horaDe(e.checkinEm)}
                    {e.checkoutEm && (
                      <span className="text-gray-600">
                        {" "}
                        · saída {horaDe(e.checkoutEm)} · recebe{" "}
                        <strong>{formatBRL(e.valorPago ?? e.valor)}</strong>
                      </span>
                    )}
                  </div>
                ) : e.data === hoje ? (
                  <CheckinButton action={fazerCheckin} token={token} escalaId={e.id} />
                ) : e.presenca !== "PRESENTE" && e.data < hoje ? (
                  <form action={confirmarPresenca} className="mt-3">
                    <input type="hidden" name="id" value={e.id} />
                    <input type="hidden" name="token" value={token} />
                    <button
                      type="submit"
                      className="w-full rounded-lg bg-green-600 py-2 font-medium text-white hover:bg-green-700"
                    >
                      Confirmar presença
                    </button>
                  </form>
                ) : null}

                {!e.checkinEm && podeDesistir(e.data, e.horaInicio) && (
                  <form action={desistirDaDiaria} className="mt-2">
                    <input type="hidden" name="token" value={token} />
                    <input type="hidden" name="escalaId" value={e.id} />
                    <ConfirmSubmit
                      className="text-xs text-red-600 underline"
                      message="Desistir desta diária? A vaga será reaberta para outros. Só dá pra desistir até 4h antes."
                    >
                      Desistir desta diária
                    </ConfirmSubmit>
                  </form>
                )}

                {e.presenca === "PRESENTE" && enderecoCompleto(e.loja) && (
                  <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3">
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(enderecoCompleto(e.loja))}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white"
                    >
                      Google Maps
                    </a>
                    <a
                      href={`https://waze.com/ul?q=${encodeURIComponent(enderecoCompleto(e.loja))}&navigate=yes`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-medium text-white"
                    >
                      Waze
                    </a>
                    <CopyButton
                      text={enderecoCompleto(e.loja)}
                      className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700"
                    />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Diárias disponíveis para hoje */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">📋 Diárias de hoje</h2>
          <Link href={`/d/${token}/vagas`} className="text-sm font-medium text-orange-700">
            Ver todas →
          </Link>
        </div>
        {bloqueado ? (
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
            🔒 Avalie sua(s) última(s) diária(s) acima para liberar novas vagas.
          </div>
        ) : (
          <ListaDiarias token={token} itens={itensHoje} />
        )}
      </section>

      {recentes.length > 0 && (
        <section>
          <h2 className="mb-2 font-semibold text-gray-900">Dias anteriores</h2>
          <ul className="space-y-2">
            {recentes.map((e) => (
              <li
                key={e.id}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="capitalize text-gray-600">
                    {formatDateWithWeekday(e.data)} · {e.loja.nome}
                  </span>
                  {e.presenca === "PRESENTE" ? (
                    <span className="text-green-600">presente</span>
                  ) : e.presenca === "FALTOU" ? (
                    <span className="text-red-500">faltou</span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </div>
                {e.presenca === "PRESENTE" &&
                  (e.avaliacaoLoja ? (
                    <span className="mt-1 inline-block text-xs text-orange-600">★ loja avaliada</span>
                  ) : (
                    <Link
                      href={`/d/${token}/avaliar-loja/${e.id}`}
                      className="mt-2 inline-block rounded-lg bg-orange-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-orange-800"
                    >
                      Avaliar loja
                    </Link>
                  ))}
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="pb-2 text-center text-xs text-gray-400">
        Em caso de dúvida, fale com o RH no botão de chat.
      </p>
    </div>
  );
}
