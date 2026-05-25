import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatBRL, formatDateWithWeekday } from "@/lib/format";
import { addDias, hojeISO, podeDesistir, turnoFinalizado } from "@/lib/dates";
import { medalhasDoDiarista } from "@/lib/medalhas";
import { corDoTurno } from "@/lib/horarios";
import { bairroCidade, ruaDaLoja } from "@/lib/loja";
import { grupoDaLoja } from "@/lib/marcas";
import { DIARIAS_CASHBACK, DIARIAS_CASHBACK_20 } from "@/lib/bonificacoes";
import CopyButton from "@/components/CopyButton";
import CheckinButton from "@/components/CheckinButton";
import PushToggle from "@/components/PushToggle";
import MarcaBadge from "@/components/MarcaBadge";
import Avatar from "@/components/Avatar";
import FotoUpload from "@/components/FotoUpload";
import ConfirmSubmit from "@/components/ConfirmSubmit";
import { redirect } from "next/navigation";
import ListaDiarias, { type DiariaItem } from "@/components/ListaDiarias";
import ChatRH from "@/components/ChatRH";
import TrilhaAprendizado from "@/components/TrilhaAprendizado";
import { TRILHA_DIARISTA } from "@/lib/trilhas";
import { getSessao } from "@/lib/auth";
import {
  confirmarPresenca,
  definirSenhaDiarista,
  desistirDaDiaria,
  fazerCheckin,
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
  searchParams: Promise<{ checkin?: string; desistir?: string; erro?: string }>;
}) {
  const { token } = await params;
  const { checkin, desistir, erro } = await searchParams;
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
      orderBy: { criadoEm: "desc" },
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

  // Primeiro acesso: ainda não tem senha → cria a senha (não exige sessão).
  if (!diarista.senha) {
    return (
      <div className="mx-auto max-w-md">
        <header className="bg-neutral-900 px-5 py-6 text-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/rwp-logo.svg" alt="RWP" className="mb-3 h-7 w-auto" />
          <h1 className="text-xl font-bold">Primeiro acesso</h1>
          <p className="mt-1 text-sm text-orange-100">
            Olá, {diarista.nome.split(" ")[0]}! Crie uma senha para acessar sua agenda.
          </p>
        </header>
        <main className="p-5">
          {erro === "senha" && (
            <p className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
              As senhas não conferem ou têm menos de 6 caracteres.
            </p>
          )}
          <form action={definirSenhaDiarista} className="space-y-3">
            <input type="hidden" name="token" value={token} />
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="senha">
                Crie uma senha
              </label>
              <input
                id="senha"
                name="senha"
                type="password"
                required
                minLength={6}
                placeholder="mínimo 6 caracteres"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 outline-none focus:border-orange-600 focus:ring-2 focus:ring-orange-100"
              />
            </div>
            <div>
              <label
                className="mb-1 block text-sm font-medium text-gray-700"
                htmlFor="confirmarSenha"
              >
                Repita a senha
              </label>
              <input
                id="confirmarSenha"
                name="confirmarSenha"
                type="password"
                required
                minLength={6}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 outline-none focus:border-orange-600 focus:ring-2 focus:ring-orange-100"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-orange-700 py-2.5 font-medium text-white hover:bg-orange-800"
            >
              Criar senha e entrar
            </button>
          </form>
        </main>
      </div>
    );
  }

  // Já tem senha: exige sessão deste diarista (login por CPF + senha).
  const sessao = await getSessao();
  if (!(sessao?.tipo === "diarista" && sessao.diaristaId === diarista.id)) {
    redirect("/entrar?perfil=diarista");
  }

  const proximas = diarista.escalas.filter((e) => e.data >= hoje);
  const recentes = diarista.escalas.filter((e) => e.data < hoje).reverse();

  // Diárias encerradas que ainda faltam o diarista avaliar (trava novas vagas).
  const pendentesAvaliacao = diarista.escalas.filter(
    (e) =>
      e.presenca === "PRESENTE" &&
      !e.avaliacaoLoja &&
      turnoFinalizado(e.data, e.horaInicio, e.horaFim),
  );
  const bloqueado = pendentesAvaliacao.length > 0;

  const inscritoEm = new Set(diarista.inscricoes.map((i) => i.requisicaoId));
  const convidadoEm = new Set(diarista.convidadoEm.map((r) => r.id));

  const lojasBloqueadas = new Set(diarista.bloqueios.map((b) => b.lojaId));
  // Dias em que a diarista já tem diária e lojas/dias em que já foi convocada.
  const datasComEscala = new Set(diarista.escalas.map((e) => e.data));
  const convocadoLojaData = new Set(
    diarista.convocacoes.map((c) => `${c.lojaId}|${c.data}`),
  );
  // Vagas (mais novas primeiro): tira loja bloqueada, dias que já trabalha e
  // vagas da loja/dia em que já foi convocada (responde pelo convite).
  // Só mostra vagas da função da diarista (ou vagas sem função definida).
  const disponiveis = disponiveisRaw.filter(
    (r) =>
      !lojasBloqueadas.has(r.lojaId) &&
      !datasComEscala.has(r.data) &&
      !convocadoLojaData.has(`${r.lojaId}|${r.data}`) &&
      (!r.funcao || !diarista.funcao || r.funcao === diarista.funcao),
  );

  // Nota das lojas (avaliação dos diaristas), para o filtro "nota".
  const lojaIdsDisp = [...new Set(disponiveis.map((r) => r.lojaId))];
  const avalLojas = lojaIdsDisp.length
    ? await prisma.avaliacaoLoja.findMany({
        where: { lojaId: { in: lojaIdsDisp } },
        select: {
          lojaId: true,
          ambiente: true,
          tratamento: true,
          pagamentoEmDia: true,
          organizacao: true,
          seguranca: true,
        },
      })
    : [];
  const notaAcc = new Map<string, { soma: number; qtd: number }>();
  for (const a of avalLojas) {
    const m = (a.ambiente + a.tratamento + a.pagamentoEmDia + a.organizacao + a.seguranca) / 5 / 2;
    const cur = notaAcc.get(a.lojaId) ?? { soma: 0, qtd: 0 };
    cur.soma += m;
    cur.qtd += 1;
    notaAcc.set(a.lojaId, cur);
  }
  const notaDaLoja = (id: string): number | null => {
    const c = notaAcc.get(id);
    return c ? c.soma / c.qtd : null;
  };

  const itensDiarias: DiariaItem[] = disponiveis.map((r) => {
    const g = grupoDaLoja(r.loja.nome);
    return {
      id: r.id,
      lojaId: r.lojaId,
      lojaNome: r.loja.nome,
      marcaLabel: g.label,
      marcaOrdem: g.ordem,
      rua: ruaDaLoja(r.loja),
      enderecoCompleto: enderecoCompleto(r.loja) || ruaDaLoja(r.loja),
      bairroCidade: bairroCidade(r.loja),
      lat: r.loja.latitude,
      lng: r.loja.longitude,
      data: r.data,
      horaInicio: r.horaInicio,
      horaFim: r.horaFim,
      valor: r.valorDiaria,
      funcao: r.funcao,
      inscrito: inscritoEm.has(r.id),
      convidado: convidadoEm.has(r.id),
      nota: notaDaLoja(r.lojaId),
    };
  });

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
          <div className="min-w-0 flex-1">
            <p className="text-sm text-orange-100">Olá,</p>
            <h1 className="truncate text-2xl font-bold leading-tight">{diarista.nome}</h1>
          </div>
          <FotoUpload token={token} />
        </div>
        <p className="mt-1 text-sm text-orange-100">Sua agenda de trabalho</p>
      </header>

      <nav className="sticky top-0 z-20 flex gap-2 overflow-x-auto border-b border-gray-200 bg-white px-4 py-2 text-sm">
        <a href="#vagas" data-tour="diarista-vagas" className="whitespace-nowrap rounded-full bg-orange-50 px-3 py-1 font-medium text-orange-800">
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
      </nav>

      <main className="space-y-6 p-5">
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

        {/* Convocações no topo: escolha a loja e confirme */}
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
                    {c.horaInicio && c.horaFim ? ` · ${c.horaInicio}–${c.horaFim}` : ""}
                  </p>
                  {c.valor != null && (
                    <p className="text-sm text-gray-700">
                      Valor: <strong>{formatBRL(c.valor)}</strong>
                    </p>
                  )}
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
          📍 Encontrar diárias perto de mim
        </Link>

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

        <section id="vagas" className="scroll-mt-14">
          <h2 className="mb-2 font-semibold text-gray-900">Agende sua diária</h2>
          {bloqueado ? (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
              🔒 Avalie sua(s) última(s) diária(s) acima para liberar novas vagas.
            </div>
          ) : (
            <ListaDiarias token={token} itens={itensDiarias} />
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

        <p className="pb-6 text-center text-xs text-gray-400">
          Em caso de dúvida, fale com o RH no botão de chat.
        </p>
      </main>

      <ChatRH token={token} mensagens={diarista.mensagens} />

      <TrilhaAprendizado
        id="diarista-v1"
        titulo="Como funciona"
        passos={TRILHA_DIARISTA}
        posicao="esquerda"
      />
    </div>
  );
}
