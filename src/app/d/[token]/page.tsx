import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatBRL, formatDateWithWeekday } from "@/lib/format";
import { addDias, hojeISO } from "@/lib/dates";
import CopyButton from "@/components/CopyButton";
import CheckinButton from "@/components/CheckinButton";
import PushToggle from "@/components/PushToggle";
import { confirmarPresenca, fazerCheckin, inscreverNaDiaria, responderConvocacao } from "./actions";

export const dynamic = "force-dynamic";

function horaDe(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function enderecoCompleto(l: {
  endereco: string | null;
  bairro: string | null;
  cidade: string | null;
}): string {
  return [l.endereco, l.bairro, l.cidade].filter(Boolean).join(", ");
}

export default async function DiaristaLinkPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ checkin?: string }>;
}) {
  const { token } = await params;
  const { checkin } = await searchParams;
  const hoje = hojeISO();
  const desde = addDias(hoje, -14);

  const diarista = await prisma.diarista.findUnique({
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
      bonificacoes: { where: { pago: true }, orderBy: { criadoEm: "desc" } },
    },
  });

  if (!diarista) {
    return (
      <div className="mx-auto max-w-md p-6 text-center">
        <h1 className="mt-10 text-xl font-bold text-gray-900">Link inválido</h1>
        <p className="mt-2 text-gray-500">
          Este link não foi encontrado. Peça um novo link ao responsável.
        </p>
      </div>
    );
  }

  const proximas = diarista.escalas.filter((e) => e.data >= hoje);
  const recentes = diarista.escalas.filter((e) => e.data < hoje).reverse();

  const inscritoEm = new Set(diarista.inscricoes.map((i) => i.requisicaoId));
  const convidadoEm = new Set(diarista.convidadoEm.map((r) => r.id));
  const preferidas = new Set(diarista.lojasPreferidas.map((l) => l.id));
  const jaTrabalhou = new Set(diarista.escalas.map((e) => e.lojaId));
  const ehPreferida = (lojaId: string) => preferidas.has(lojaId) || jaTrabalhou.has(lojaId);

  const lojasBloqueadas = new Set(diarista.bloqueios.map((b) => b.lojaId));
  const disponiveisRaw = await prisma.requisicao.findMany({
    where: { status: "ABERTA", data: { gte: hoje } },
    include: { loja: true },
    orderBy: { data: "asc" },
  });
  const disponiveis = disponiveisRaw.filter((r) => !lojasBloqueadas.has(r.lojaId));
  const peso = (r: { id: string; lojaId: string }) =>
    (convidadoEm.has(r.id) ? 2 : 0) + (ehPreferida(r.lojaId) ? 1 : 0);
  disponiveis.sort((a, b) => peso(b) - peso(a));

  return (
    <div className="mx-auto max-w-md">
      <header className="bg-teal-700 px-5 py-6 text-white">
        <div className="flex items-start justify-between">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/rwp-logo.svg" alt="RWP" className="mb-3 h-7 w-auto" />
          <a href="/entrar" className="text-xs font-medium text-teal-100 underline">
            Sair
          </a>
        </div>
        <p className="text-sm text-teal-100">Olá,</p>
        <h1 className="text-2xl font-bold">{diarista.nome}</h1>
        <p className="mt-1 text-sm text-teal-100">Sua agenda de trabalho</p>
      </header>

      <main className="space-y-6 p-5">
        {checkin === "ok" && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-800">
            ✓ Check-in realizado!
          </div>
        )}
        {checkin === "longe" && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
            Você parece estar longe da loja. Faça o check-in quando chegar no local.
          </div>
        )}

        <PushToggle token={token} />

        <div className="flex gap-3">
          <Link
            href={`/d/${token}/preferencias`}
            className="flex-1 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-center text-sm font-medium text-teal-800"
          >
            ⭐ Lojas preferidas
          </Link>
          <Link
            href="/ranking"
            className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-center text-sm font-medium text-gray-700"
          >
            🏆 Ranking
          </Link>
        </div>

        {diarista.bonificacoes.length > 0 && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-4">
            <p className="font-semibold text-green-800">🎁 Suas bonificações</p>
            <ul className="mt-1 space-y-0.5 text-sm text-green-800">
              {diarista.bonificacoes.map((b) => (
                <li key={b.id}>
                  {b.tipo === "CASHBACK_5" ? "Cashback de 5 diárias" : "Top do mês"}:{" "}
                  <strong>{formatBRL(b.valor)}</strong>
                </li>
              ))}
            </ul>
          </div>
        )}

        {diarista.convocacoes.length > 0 && (
          <section>
            <h2 className="mb-2 font-semibold text-gray-900">Convocações</h2>
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
                  <p className="mt-1 text-sm text-gray-600">
                    Esta loja convocou você para esta diária.
                  </p>
                  <div className="mt-3 flex gap-2">
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

        <section>
          <h2 className="mb-2 font-semibold text-gray-900">Agende sua diária</h2>
          {disponiveis.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center text-gray-500">
              Nenhuma diária disponível no momento.
            </div>
          ) : (
            <ul className="space-y-3">
              {disponiveis.map((r) => {
                const inscrito = inscritoEm.has(r.id);
                const pref = ehPreferida(r.lojaId);
                const convidado = convidadoEm.has(r.id);
                return (
                  <li
                    key={r.id}
                    className={`rounded-xl border bg-white p-4 shadow-sm ${
                      convidado ? "border-amber-400" : pref ? "border-teal-300" : "border-gray-200"
                    }`}
                  >
                    {convidado && (
                      <p className="mb-1 text-xs font-semibold text-amber-700">
                        ⭐ Você foi convidado para esta diária
                      </p>
                    )}
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{r.loja.nome}</p>
                      {pref && (
                        <span className="rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700">
                          você já fez diária aqui
                        </span>
                      )}
                    </div>
                    {enderecoCompleto(r.loja) && (
                      <p className="text-sm text-gray-500">{enderecoCompleto(r.loja)}</p>
                    )}
                    <p className="mt-1 text-sm capitalize text-gray-600">
                      {formatDateWithWeekday(r.data)} · {r.horaInicio}–{r.horaFim}
                    </p>
                    <p className="text-sm text-gray-600">
                      {formatBRL(r.valorDiaria)}
                      {r.funcao ? ` · ${r.funcao}` : ""}
                    </p>

                    {inscrito ? (
                      <span className="mt-2 inline-block text-sm font-medium text-teal-600">
                        ✓ inscrição enviada
                      </span>
                    ) : (
                      <form action={inscreverNaDiaria} className="mt-3">
                        <input type="hidden" name="token" value={token} />
                        <input type="hidden" name="requisicaoId" value={r.id} />
                        <button
                          type="submit"
                          className="w-full rounded-lg bg-teal-700 py-2 font-medium text-white hover:bg-teal-800"
                        >
                          Pegar esta diária
                        </button>
                      </form>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-gray-900">Próximos dias</h2>
          {proximas.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center text-gray-500">
              Nenhum dia agendado por enquanto.
            </div>
          ) : (
            <ul className="space-y-3">
              {proximas.map((e) => (
                <li
                  key={e.id}
                  className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium capitalize text-gray-900">
                        {formatDateWithWeekday(e.data)}
                        {e.data === hoje && (
                          <span className="ml-2 rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-700">
                            hoje
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-gray-500">{e.loja.nome}</p>
                      {enderecoCompleto(e.loja) && (
                        <p className="text-xs text-gray-400">{enderecoCompleto(e.loja)}</p>
                      )}
                      <p className="mt-1 text-sm text-gray-600">
                        {e.horaInicio && e.horaFim ? `${e.horaInicio}–${e.horaFim} · ` : ""}
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
                      <span className="mt-1 inline-block text-xs text-teal-600">
                        ★ loja avaliada
                      </span>
                    ) : (
                      <Link
                        href={`/d/${token}/avaliar-loja/${e.id}`}
                        className="mt-2 inline-block rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-800"
                      >
                        Avaliar loja
                      </Link>
                    ))}
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="pb-6 text-center text-xs text-gray-400">
          Em caso de dúvida, fale com o responsável.
        </p>
      </main>
    </div>
  );
}
