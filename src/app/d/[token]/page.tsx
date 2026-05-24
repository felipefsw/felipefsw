import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatBRL, formatDateWithWeekday } from "@/lib/format";
import { addDias, hojeISO, podeDesistir } from "@/lib/dates";
import { medalhasDoDiarista } from "@/lib/medalhas";
import { corDoTurno } from "@/lib/horarios";
import { corDaFuncao } from "@/lib/funcoesCor";
import { bairroCidade, ruaDaLoja } from "@/lib/loja";
import { DIARIAS_CASHBACK, DIARIAS_CASHBACK_20 } from "@/lib/bonificacoes";
import CopyButton from "@/components/CopyButton";
import CheckinButton from "@/components/CheckinButton";
import PushToggle from "@/components/PushToggle";
import MarcaBadge from "@/components/MarcaBadge";
import Avatar from "@/components/Avatar";
import FotoUpload from "@/components/FotoUpload";
import SubmitButton from "@/components/SubmitButton";
import ConfirmSubmit from "@/components/ConfirmSubmit";
import MapaDiariasPerto from "@/components/MapaDiariasPerto";
import CarrosselFotos from "@/components/CarrosselFotos";
import {
  confirmarPresenca,
  desistirDaDiaria,
  enviarMensagemDiarista,
  fazerCheckin,
  inscreverNaDiaria,
  responderConvocacao,
} from "./actions";

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
  searchParams: Promise<{ checkin?: string; desistir?: string }>;
}) {
  const { token } = await params;
  const { checkin, desistir } = await searchParams;
  const hoje = hojeISO();
  const desde = addDias(hoje, -14);
  // Diarista só se candidata a diárias de até 2 dias à frente.
  const limiteCandidatura = addDias(hoje, 2);

  // Busca a diarista e as diárias disponíveis em paralelo (mais rápido).
  const [diarista, disponiveisRaw] = await Promise.all([
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
        bonificacoes: { where: { pago: true }, orderBy: { criadoEm: "desc" } },
        mensagens: { orderBy: { criadoEm: "asc" }, take: 30 },
        _count: { select: { avaliacoes: true } },
      },
    }),
    prisma.requisicao.findMany({
      where: { status: "ABERTA", data: { gte: hoje, lte: limiteCandidatura } },
      include: { loja: true },
      orderBy: { data: "asc" },
    }),
  ]);

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
  const disponiveis = disponiveisRaw.filter((r) => !lojasBloqueadas.has(r.lojaId));
  const peso = (r: { id: string; lojaId: string }) =>
    (convidadoEm.has(r.id) ? 2 : 0) + (ehPreferida(r.lojaId) ? 1 : 0);
  disponiveis.sort((a, b) => peso(b) - peso(a));

  // Lojas (únicas, com coordenadas) com diária disponível, para o mapa.
  const lojasMapa: { id: string; nome: string; lat: number; lng: number }[] = [];
  const vistosMapa = new Set<string>();
  for (const r of disponiveis) {
    if (r.loja.latitude != null && r.loja.longitude != null && !vistosMapa.has(r.lojaId)) {
      vistosMapa.add(r.lojaId);
      lojasMapa.push({
        id: r.lojaId,
        nome: r.loja.nome,
        lat: r.loja.latitude,
        lng: r.loja.longitude,
      });
    }
  }

  const medalhas = await medalhasDoDiarista(diarista.id);

  return (
    <div className="mx-auto max-w-md">
      <header className="bg-neutral-900 px-5 py-6 text-white">
        <div className="flex items-start justify-between">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/rwp-logo.svg" alt="RWP" className="mb-3 h-7 w-auto" />
          <a href="/entrar" className="text-xs font-medium text-orange-100 underline">
            Sair
          </a>
        </div>
        <div className="mt-1 flex items-center gap-3">
          <Avatar nome={diarista.nome} fotoUrl={diarista.fotoUrl} className="h-12 w-12" />
          <div>
            <p className="text-sm text-orange-100">Olá,</p>
            <h1 className="text-2xl font-bold leading-tight">{diarista.nome}</h1>
          </div>
        </div>
        <p className="mt-1 text-sm text-orange-100">Sua agenda de trabalho</p>
      </header>

      <nav className="sticky top-0 z-20 flex gap-2 overflow-x-auto border-b border-gray-200 bg-white px-4 py-2 text-sm">
        <a href="#vagas" className="whitespace-nowrap rounded-full bg-orange-50 px-3 py-1 font-medium text-orange-800">
          📋 Vagas
        </a>
        <a href="#proximas" className="whitespace-nowrap rounded-full bg-gray-100 px-3 py-1 font-medium text-gray-700">
          📅 Próximas
        </a>
        <Link
          href={`/d/${token}/guia`}
          className="whitespace-nowrap rounded-full bg-gray-100 px-3 py-1 font-medium text-gray-700"
        >
          📖 Guia
        </Link>
        <a href="#falar-rh" className="whitespace-nowrap rounded-full bg-gray-100 px-3 py-1 font-medium text-gray-700">
          💬 RH
        </a>
      </nav>

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
        <FotoUpload token={token} nome={diarista.nome} fotoUrl={diarista.fotoUrl} />

        {medalhas.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {medalhas.map((m) => (
              <span
                key={m.nome}
                className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-sm font-medium text-amber-800"
              >
                {m.emoji} {m.nome}
              </span>
            ))}
          </div>
        )}

        <PushToggle token={token} />

        {process.env.NEXT_PUBLIC_TELEGRAM_BOT && (
          <a
            href={`https://t.me/${process.env.NEXT_PUBLIC_TELEGRAM_BOT}?start=${token}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-center text-sm font-medium text-sky-800"
          >
            ✈️ Ativar avisos no Telegram
          </a>
        )}

        <Link
          href={`/d/${token}/perto`}
          className="flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-3 text-center text-base font-bold text-white shadow-sm hover:bg-orange-700"
        >
          📍 Lojas perto de mim
        </Link>

        <div className="flex gap-3">
          <Link
            href={`/d/${token}/preferencias`}
            className="flex-1 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-center text-sm font-medium text-orange-800"
          >
            ⭐ Lojas preferidas
          </Link>
          <Link
            href={`/ranking?token=${token}`}
            className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-center text-sm font-medium text-gray-700"
          >
            🏆 Ranking
          </Link>
        </div>

        {!diarista.bonificacoes.some((b) => b.tipo === "CASHBACK_5") &&
          diarista._count.avaliacoes < DIARIAS_CASHBACK && (
            <div className="rounded-xl border border-orange-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-gray-900">🎁 Bônus de R$ 100 chegando!</p>
              <p className="mt-0.5 text-xs text-gray-500">
                Faltam {DIARIAS_CASHBACK - diarista._count.avaliacoes} diária(s) bem avaliada(s)
                (média ≥ 4,5 de 5 ★) para ganhar.
              </p>
              <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-orange-500"
                  style={{ width: `${(diarista._count.avaliacoes / DIARIAS_CASHBACK) * 100}%` }}
                />
              </div>
              <p className="mt-1 text-right text-xs font-medium text-orange-700">
                {diarista._count.avaliacoes}/{DIARIAS_CASHBACK}
              </p>
            </div>
          )}

        {diarista._count.avaliacoes >= DIARIAS_CASHBACK &&
          !diarista.bonificacoes.some((b) => b.tipo === "CASHBACK_20") &&
          diarista._count.avaliacoes < DIARIAS_CASHBACK_20 && (
            <div className="rounded-xl border border-orange-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-gray-900">
                🎁 Mais R$ 100 por 20 diárias!
              </p>
              <p className="mt-0.5 text-xs text-gray-500">
                Faltam {DIARIAS_CASHBACK_20 - diarista._count.avaliacoes} diária(s) bem avaliada(s)
                (média ≥ 4,2 de 5 ★) para ganhar outro bônus.
              </p>
              <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-orange-500"
                  style={{ width: `${(diarista._count.avaliacoes / DIARIAS_CASHBACK_20) * 100}%` }}
                />
              </div>
              <p className="mt-1 text-right text-xs font-medium text-orange-700">
                {diarista._count.avaliacoes}/{DIARIAS_CASHBACK_20}
              </p>
            </div>
          )}

        {diarista.bonificacoes.length > 0 && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-4">
            <p className="font-semibold text-green-800">🎁 Suas bonificações</p>
            <ul className="mt-1 space-y-0.5 text-sm text-green-800">
              {diarista.bonificacoes.map((b) => (
                <li key={b.id}>
                  {b.tipo === "CASHBACK_5"
                    ? "Cashback de 5 diárias"
                    : b.tipo === "CASHBACK_20"
                      ? "Cashback de 20 diárias"
                      : b.tipo === "MILESTONE_30"
                        ? "Bônus de 30 diárias"
                        : b.tipo === "MILESTONE_50"
                          ? "Bônus de 50 diárias"
                          : "Top do mês"}
                  : <strong>{formatBRL(b.valor)}</strong>
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

        <section id="vagas" className="scroll-mt-14">
          <h2 className="mb-1 font-semibold text-gray-900">Agende sua diária</h2>
          <MapaDiariasPerto lojas={lojasMapa} />
          <p className="mb-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500">
            <span>Função: 🟧 Pizzaiolo</span>
            <span>🟨 Aux. pizzaiolo</span>
            <span>🟦 Atendente</span>
            <span>🟩 Motoqueiro</span>
          </p>
          <p className="mb-2 text-xs text-gray-400">Horário: 🟦 manhã/tarde · 🟩 tarde · 🟪 noite</p>
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
                const turno = corDoTurno(r.horaInicio);
                const fcor = corDaFuncao(r.funcao);
                return (
                  <li
                    key={r.id}
                    className={`rounded-xl border p-4 shadow-sm ${fcor.bg} ${
                      convidado ? "border-amber-400" : pref ? "border-orange-400" : fcor.border
                    }`}
                  >
                    {convidado && (
                      <p className="mb-1 text-xs font-semibold text-amber-700">
                        ⭐ Você foi convidado para esta diária
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <MarcaBadge nome={r.loja.nome} className="h-7 w-7 shrink-0 rounded" />
                      <p className="font-medium text-gray-900">{r.loja.nome}</p>
                      {bairroCidade(r.loja) && (
                        <span className="text-xs text-gray-500">· {bairroCidade(r.loja)}</span>
                      )}
                      {pref && (
                        <span className="rounded-full bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-700">
                          você já fez diária aqui
                        </span>
                      )}
                    </div>
                    {(
                      <>
                        <p className="text-sm text-gray-500">{ruaDaLoja(r.loja)}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          <CopyButton
                            text={enderecoCompleto(r.loja) || ruaDaLoja(r.loja)}
                            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700"
                          />
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(enderecoCompleto(r.loja) || ruaDaLoja(r.loja))}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white"
                          >
                            📍 Siga até a loja
                          </a>
                        </div>
                      </>
                    )}
                    {r.loja.fotos.length > 0 && (
                      <div className="mt-2">
                        <CarrosselFotos fotos={r.loja.fotos} />
                      </div>
                    )}
                    {r.loja.vantagens && (
                      <p className="mt-1.5 rounded-lg bg-orange-50 px-3 py-2 text-xs text-orange-900">
                        ⭐ {r.loja.vantagens}
                      </p>
                    )}
                    <p className="mt-1 text-sm capitalize text-gray-600">
                      {formatDateWithWeekday(r.data)} ·{" "}
                      <span className={`rounded px-1.5 py-0.5 font-medium ${turno.chip}`}>
                        {r.horaInicio}–{r.horaFim}
                      </span>
                    </p>
                    <p className="text-sm text-gray-600">
                      {formatBRL(r.valorDiaria)}
                      {r.funcao ? ` · ${r.funcao}` : ""}
                    </p>

                    {inscrito ? (
                      <span className="mt-2 inline-block text-sm font-medium text-orange-600">
                        ✓ inscrição enviada
                      </span>
                    ) : (
                      <form action={inscreverNaDiaria} className="mt-3">
                        <input type="hidden" name="token" value={token} />
                        <input type="hidden" name="requisicaoId" value={r.id} />
                        <SubmitButton
                          pendingLabel="Enviando…"
                          className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 py-3 text-base font-bold text-white shadow-sm hover:bg-orange-700"
                        >
                          <span className="text-lg">✓</span> Quero trabalhar aqui!
                        </SubmitButton>
                      </form>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section id="proximas" className="scroll-mt-14">
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
                      <span className="mt-1 inline-block text-xs text-orange-600">
                        ★ loja avaliada
                      </span>
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

        <section id="falar-rh" className="scroll-mt-4">
          <h2 className="mb-1 font-semibold text-gray-900">Falar com o RH</h2>
          <p className="mb-2 text-xs text-gray-400">
            Avise atraso, imprevisto ou tire dúvidas. Isso não muda sua nota nem sua presença.
          </p>
          <div className="space-y-2">
            {diarista.mensagens.length === 0 ? (
              <p className="text-sm text-gray-400">Nenhuma mensagem ainda.</p>
            ) : (
              diarista.mensagens.map((m) => (
                <div
                  key={m.id}
                  className={
                    m.autor === "DIARISTA"
                      ? "ml-6 rounded-xl bg-orange-50 p-2 text-sm text-gray-800"
                      : "mr-6 rounded-xl bg-gray-100 p-2 text-sm text-gray-800"
                  }
                >
                  <span className="block text-[10px] font-medium text-gray-400">
                    {m.autor === "DIARISTA" ? "Você" : "RH"}
                  </span>
                  {m.texto}
                </div>
              ))
            )}
          </div>
          <form action={enviarMensagemDiarista} className="mt-3 space-y-2">
            <input type="hidden" name="token" value={token} />
            <textarea
              name="texto"
              required
              rows={2}
              placeholder="Escreva sua mensagem…"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 outline-none focus:border-orange-600 focus:ring-2 focus:ring-orange-100"
            />
            <button
              type="submit"
              className="w-full rounded-lg bg-orange-600 py-2 font-medium text-white hover:bg-orange-700"
            >
              Enviar
            </button>
          </form>
        </section>

        <p className="pb-6 text-center text-xs text-gray-400">
          Em caso de dúvida, fale com o responsável.
        </p>
      </main>

      <a
        href="#falar-rh"
        aria-label="Falar com o RH"
        className="fixed bottom-4 right-4 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-orange-600 text-2xl text-white shadow-lg ring-4 ring-orange-600/20 hover:bg-orange-700"
      >
        💬
      </a>
    </div>
  );
}
