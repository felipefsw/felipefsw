import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, EmptyState, btnPrimary } from "@/components/ui";
import { formatBRL, formatDate, formatDateWithWeekday } from "@/lib/format";
import { hojeISO, maxAgendamentoISO, turnoFinalizado } from "@/lib/dates";
import { corDoTurno } from "@/lib/horarios";
import Avatar from "@/components/Avatar";
import EstrelasAvaliacao from "@/components/EstrelasAvaliacao";
import SubmitButton from "@/components/SubmitButton";
import CopyButton from "@/components/CopyButton";
import { contextoLoja, getSessao } from "@/lib/auth";
import {
  alternarLimiteSemana,
  aprovarCandidato,
  bloquearDiaristaLoja,
  convocarDiarista,
  criarRequisicaoLoja,
  desbloquearDiaristaLoja,
  marcarPagoDiaria,
  registrarCheckout,
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
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;
  const ctx = contextoLoja(await getSessao());
  if (!ctx) redirect("/entrar");
  const lojaId = ctx.lojaId;

  const agora = new Date();
  const [requisicoes, escalas, bloqueios, loja] = await Promise.all([
    prisma.requisicao.findMany({
      where: { lojaId },
      include: {
        _count: { select: { escalas: true, inscricoes: true } },
        inscricoes: {
          include: {
            diarista: {
              select: {
                id: true,
                nome: true,
                funcao: true,
                fotoUrl: true,
                avaliacoes: { select: { estrelas: true }, orderBy: { criadoEm: "desc" }, take: 5 },
                _count: { select: { escalas: { where: { presenca: "PRESENTE" } } } },
              },
            },
          },
        },
      },
      orderBy: [{ data: "asc" }, { criadoEm: "desc" }],
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
    prisma.loja.findUnique({ where: { id: lojaId }, select: { permiteMais2Semana: true } }),
  ]);

  const bloqueioPorDiarista = new Map<string, { ate: Date | null; origem: string }>();
  for (const b of bloqueios) {
    const cur = bloqueioPorDiarista.get(b.diaristaId);
    // RH (permanente) prevalece sobre bloqueio temporário da loja.
    if (!cur || b.origem === "RH") bloqueioPorDiarista.set(b.diaristaId, { ate: b.ate, origem: b.origem });
  }

  // Diárias já realizadas (presente e turno encerrado) — para avaliar.
  const aAvaliar = escalas.filter(
    (e) => e.presenca === "PRESENTE" && turnoFinalizado(e.data, e.horaFim),
  );
  // A loja precisa avaliar antes de abrir novas vagas / convocar.
  const pendentes = aAvaliar.filter((e) => !e.avaliacao).length;

  // Diárias de hoje (para acompanhar check-in e registrar saída).
  const hoje = hojeISO();
  const hojeEscalas = escalas.filter((e) => e.data === hoje);
  // Texto com todos os Pix de hoje, para copiar e colar no WhatsApp.
  const pixHoje = hojeEscalas
    .filter((e) => e.diarista.chavePix)
    .map((e) => `${e.diarista.nome}: ${e.diarista.chavePix}`)
    .join("\n");

  // Atalho "pedir de novo": usa a requisição mais recente como modelo.
  const ultima = requisicoes.length
    ? [...requisicoes].sort((a, b) => b.criadoEm.getTime() - a.criadoEm.getTime())[0]
    : null;

  // Diaristas distintos que já vieram, com datas e notas dadas por esta loja.
  type Info = {
    nome: string;
    funcao: string | null;
    fotoUrl: string | null;
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
      vezes: v.datas.length,
      datas: v.datas,
      nota: v.qtdNotas ? v.somaNotas / v.qtdNotas : null,
    }))
    .sort((a, b) => b.vezes - a.vezes);

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
          <Link href="/loja/requisicao/nova" className={btnPrimary}>
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

      {hojeEscalas.length > 0 && (
        <section>
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className="font-semibold text-gray-900">Diárias de hoje</h2>
            {pixHoje && (
              <CopyButton
                text={pixHoje}
                label="Copiar todos os Pix"
                className="shrink-0 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700"
              />
            )}
          </div>
          <Card>
            <ul className="divide-y divide-gray-100">
              {hojeEscalas.map((e) => (
                <li key={e.id} className="py-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-gray-900">{e.diarista.nome}</p>
                      <p className="text-xs text-gray-500">
                        {e.horaInicio && e.horaFim ? `${e.horaInicio}–${e.horaFim}` : ""}
                        {e.checkinEm
                          ? ` · check-in ${horaDe(e.checkinEm)}`
                          : " · aguardando check-in"}
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

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {e.diarista.chavePix ? (
                      <span className="flex items-center gap-1 text-xs text-gray-600">
                        <span className="max-w-[11rem] truncate">Pix: {e.diarista.chavePix}</span>
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
                </li>
              ))}
            </ul>
          </Card>
        </section>
      )}

      <section>
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
              const faltam = r.quantidade - r._count.escalas;
              return (
                <div key={r.id} className={`rounded-xl border p-4 shadow-sm ${turno.card}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
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
                        {r._count.escalas} escalado(s) · {r._count.inscricoes} candidato(s)
                      </p>
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
                                      className="block text-[11px] font-medium text-orange-700 underline"
                                    >
                                      saber mais
                                    </Link>
                                    <span className="block truncate text-sm font-medium text-gray-900">
                                      {d.nome}
                                    </span>
                                    <span className="block text-[11px] text-gray-500">
                                      {nota !== null ? `★ ${nota.toFixed(1)} · ` : ""}
                                      {d._count.escalas} diária(s)
                                      {d.funcao ? ` · ${d.funcao}` : ""}
                                    </span>
                                  </span>
                                </span>
                                {faltam > 0 && (
                                  <form action={aprovarCandidato.bind(null, r.id, d.id)}>
                                    <SubmitButton
                                      pendingLabel="..."
                                      className="shrink-0 rounded-lg bg-orange-700 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-800"
                                    >
                                      Aprovar
                                    </SubmitButton>
                                  </form>
                                )}
                              </div>
                            );
                          })}
                        </>
                      )}
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
                    <form
                      action={bloquearDiaristaLoja}
                      className="mt-2 flex items-center gap-2 border-t border-gray-100 pt-2"
                    >
                      <input type="hidden" name="diaristaId" value={d.id} />
                      <select
                        name="dias"
                        defaultValue="7"
                        className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-sm"
                      >
                        <option value="7">7 dias</option>
                        <option value="14">14 dias</option>
                        <option value="21">21 dias</option>
                      </select>
                      <button
                        type="submit"
                        className="rounded-lg border border-red-200 bg-white px-3 py-1 text-sm font-medium text-red-600 hover:bg-red-50"
                      >
                        Bloquear
                      </button>
                    </form>
                  )}

                  {pendentes === 0 ? (
                    <form
                      action={convocarDiarista}
                      className="mt-2 flex items-center gap-2 border-t border-gray-100 pt-2"
                    >
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
                      <button
                        type="submit"
                        className="rounded-lg bg-orange-700 px-3 py-1 text-sm font-medium text-white hover:bg-orange-800"
                      >
                        Convocar
                      </button>
                    </form>
                  ) : null}
                </Card>
              );
            })}
          </div>
        )}
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
