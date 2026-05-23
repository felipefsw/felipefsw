import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, EmptyState, btnPrimary } from "@/components/ui";
import { formatBRL, formatDate, formatDateWithWeekday } from "@/lib/format";
import { hojeISO, maxAgendamentoISO, turnoFinalizado } from "@/lib/dates";
import { ASPECTOS } from "@/lib/aspectos";
import { contextoLoja, getSessao } from "@/lib/auth";
import {
  bloquearDiaristaLoja,
  convocarDiarista,
  desbloquearDiaristaLoja,
  desfazerAvaliacaoDiarista,
} from "./actions";

export const dynamic = "force-dynamic";

function statusLabel(s: string) {
  if (s === "ABERTA") return { txt: "Aberta", cls: "bg-amber-100 text-amber-700" };
  if (s === "ATENDIDA") return { txt: "Atendida", cls: "bg-green-100 text-green-700" };
  return { txt: "Cancelada", cls: "bg-gray-100 text-gray-500" };
}

export default async function LojaHome() {
  const ctx = contextoLoja(await getSessao());
  if (!ctx) redirect("/entrar");
  const lojaId = ctx.lojaId;

  const agora = new Date();
  const [requisicoes, escalas, bloqueios] = await Promise.all([
    prisma.requisicao.findMany({
      where: { lojaId },
      include: { _count: { select: { escalas: true, inscricoes: true } } },
      orderBy: [{ data: "asc" }, { criadoEm: "desc" }],
    }),
    prisma.escala.findMany({
      where: { lojaId },
      include: {
        diarista: { select: { id: true, nome: true, funcao: true } },
        avaliacao: true,
      },
      orderBy: { data: "desc" },
    }),
    prisma.bloqueio.findMany({
      where: { lojaId, OR: [{ ate: null }, { ate: { gt: agora } }] },
    }),
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

  // Diaristas distintos que já vieram, com datas e notas dadas por esta loja.
  type Info = {
    nome: string;
    funcao: string | null;
    datas: string[];
    somaNotas: number;
    qtdNotas: number;
  };
  const vistos = new Map<string, Info>();
  for (const e of escalas) {
    const cur =
      vistos.get(e.diarista.id) ??
      { nome: e.diarista.nome, funcao: e.diarista.funcao, datas: [], somaNotas: 0, qtdNotas: 0 };
    cur.datas.push(e.data);
    if (e.avaliacao) {
      const m =
        ASPECTOS.reduce(
          (s, a) => s + (e.avaliacao as unknown as Record<string, number>)[a.key],
          0,
        ) / ASPECTOS.length;
      cur.somaNotas += m;
      cur.qtdNotas += 1;
    }
    vistos.set(e.diarista.id, cur);
  }
  const diaristas = [...vistos.entries()]
    .map(([id, v]) => ({
      id,
      nome: v.nome,
      funcao: v.funcao,
      vezes: v.datas.length,
      datas: v.datas,
      nota: v.qtdNotas ? v.somaNotas / v.qtdNotas : null,
    }))
    .sort((a, b) => b.vezes - a.vezes);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Minha loja</h1>
        <Link href="/loja/requisicao/nova" className={btnPrimary}>
          + Solicitar diaristas
        </Link>
      </div>

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
              return (
                <Card key={r.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm capitalize text-gray-700">
                        {formatDateWithWeekday(r.data)} · {r.horaInicio}–{r.horaFim}
                      </p>
                      <p className="mt-1 text-sm text-gray-600">
                        <strong>{r.quantidade}</strong> diarista(s)
                        {r.funcao ? <> · {r.funcao}</> : null} · {formatBRL(r.valorDiaria)}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {r._count.escalas} escalado(s) · {r._count.inscricoes} inscrito(s)
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${st.cls}`}>
                      {st.txt}
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {aAvaliar.length > 0 && (
        <section>
          <h2 className="mb-2 font-semibold text-gray-900">Avaliar diaristas</h2>
          <Card>
            <ul className="divide-y divide-gray-100">
              {aAvaliar.map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-gray-900">{e.diarista.nome}</p>
                    <p className="text-sm capitalize text-gray-500">{formatDate(e.data)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <Link
                      href={`/loja/avaliar/${e.id}`}
                      className={
                        e.avaliacao
                          ? "text-sm font-medium text-teal-600 hover:underline"
                          : "rounded-lg bg-amber-500 px-2.5 py-1 text-xs font-semibold text-white hover:bg-amber-600"
                      }
                    >
                      {e.avaliacao ? "★ editar" : "★ Avaliar"}
                    </Link>
                    {e.avaliacao && (
                      <form action={desfazerAvaliacaoDiarista}>
                        <input type="hidden" name="escalaId" value={e.id} />
                        <button type="submit" className="text-xs text-gray-400 underline hover:text-red-600">
                          desfazer
                        </button>
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
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-gray-900">{d.nome}</span>
                      {d.funcao && (
                        <span className="rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700">
                          {d.funcao}
                        </span>
                      )}
                    </span>
                    <span className="shrink-0 text-sm text-gray-500">{d.vezes}× aqui</span>
                  </div>

                  <p className="mt-1 text-xs text-gray-500">
                    {d.nota !== null && (
                      <span className="font-medium text-teal-700">nota {d.nota.toFixed(1)} · </span>
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
                            <button type="submit" className="text-xs text-teal-700 underline">
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
                        <option value="30">1 mês</option>
                      </select>
                      <button
                        type="submit"
                        className="rounded-lg border border-red-200 bg-white px-3 py-1 text-sm font-medium text-red-600 hover:bg-red-50"
                      >
                        Bloquear
                      </button>
                    </form>
                  )}

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
                      className="rounded-lg bg-teal-700 px-3 py-1 text-sm font-medium text-white hover:bg-teal-800"
                    >
                      Convocar
                    </button>
                  </form>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <p className="px-1 text-xs text-gray-400">
        Bloquear demais pode deixar sua loja sem diaristas suficientes nas próximas diárias.
      </p>
    </div>
  );
}
