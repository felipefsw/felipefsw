import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, EmptyState } from "@/components/ui";
import { formatBRL, formatDateShort } from "@/lib/format";
import { addDias, hojeISO, inicioDaSemana, isISODate } from "@/lib/dates";
import { grupoDaLoja } from "@/lib/marcas";
import BarraDia from "@/components/BarraDia";

export const dynamic = "force-dynamic";

type ComLoja = { loja: { nome: string } };

function agruparPorMarca<T extends ComLoja>(itens: T[]) {
  const m = new Map<string, { label: string; ordem: number; itens: T[] }>();
  for (const it of itens) {
    const g = grupoDaLoja(it.loja.nome);
    const cur = m.get(g.key) ?? { label: g.label, ordem: g.ordem, itens: [] as T[] };
    cur.itens.push(it);
    m.set(g.key, cur);
  }
  return [...m.values()].sort((a, b) => a.ordem - b.ordem);
}

export default async function InicioPage({
  searchParams,
}: {
  searchParams: Promise<{ dia?: string }>;
}) {
  const { dia } = await searchParams;
  const hoje = hojeISO();
  // Período do resumo por loja: um dia (?dia=) ou a semana toda (padrão).
  const diaSel = dia && isISODate(dia) ? dia : null;
  const rIni = diaSel ?? inicioDaSemana(hoje);
  const rFim = diaSel ?? addDias(inicioDaSemana(hoje), 6);

  const [
    escalasHoje,
    pendentes,
    diaristasAtivas,
    lojasAtivas,
    requisicoesAbertas,
    mensagensNaoLidas,
    solicitacoesPendentes,
    lojasResumo,
    confGB,
    convitesGB,
    aPagarGB,
    pagoGB,
  ] = await Promise.all([
    prisma.escala.findMany({
      where: { data: hoje },
      include: { diarista: { select: { nome: true } }, loja: { select: { nome: true } } },
      orderBy: { criadoEm: "asc" },
    }),
    prisma.escala.findMany({
      where: { data: { lte: hoje }, presenca: "PENDENTE" },
      include: { diarista: { select: { nome: true } }, loja: { select: { nome: true } } },
      orderBy: { data: "asc" },
    }),
    prisma.diarista.count({ where: { ativo: true } }),
    prisma.loja.count({ where: { ativo: true } }),
    prisma.requisicao.findMany({
      where: { status: "ABERTA" },
      include: { loja: { select: { nome: true } } },
      orderBy: { data: "asc" },
    }),
    prisma.mensagem.count({ where: { autor: "DIARISTA", lida: false } }),
    prisma.inscricao.count({ where: { status: "PENDENTE" } }),
    prisma.loja.findMany({ where: { ativo: true }, select: { id: true, nome: true } }),
    // Confirmadas no período: escalas aceitas/agendadas que ainda vão acontecer.
    prisma.escala.groupBy({
      by: ["lojaId"],
      where: { presenca: "PENDENTE", data: { gte: rIni, lte: rFim } },
      _count: { _all: true },
    }),
    // A confirmar no período: convites aguardando a diarista aceitar.
    prisma.convocacao.groupBy({
      by: ["lojaId"],
      where: { status: "PENDENTE", data: { gte: rIni, lte: rFim } },
      _count: { _all: true },
    }),
    // A pagar no período: diárias realizadas ainda não pagas.
    prisma.escala.groupBy({
      by: ["lojaId"],
      where: { presenca: "PRESENTE", pago: false, data: { gte: rIni, lte: rFim } },
      _sum: { valor: true },
    }),
    // Pago no período: diárias realizadas já pagas.
    prisma.escala.groupBy({
      by: ["lojaId"],
      where: { presenca: "PRESENTE", pago: true, data: { gte: rIni, lte: rFim } },
      _sum: { valor: true },
    }),
  ]);

  const escalasPorMarca = agruparPorMarca(escalasHoje);
  const pendentesPorMarca = agruparPorMarca(pendentes);
  const requisicoesPorMarca = agruparPorMarca(requisicoesAbertas);

  // Resumo por loja (período selecionado): a confirmar, confirmadas, a pagar e pago.
  const countPorLoja = (gb: { lojaId: string; _count: { _all: number } }[]) =>
    new Map(gb.map((g) => [g.lojaId, g._count._all]));
  const somaPorLoja = (gb: { lojaId: string; _sum: { valor: number | null } }[]) =>
    new Map(gb.map((g) => [g.lojaId, g._sum.valor ?? 0]));
  const confMap = countPorLoja(confGB);
  const convMap = countPorLoja(convitesGB);
  const aPagarMap = somaPorLoja(aPagarGB);
  const pagoMap = somaPorLoja(pagoGB);

  const resumoLojas = lojasResumo
    .map((l) => ({
      nome: l.nome,
      ordem: grupoDaLoja(l.nome).ordem,
      conf: confMap.get(l.id) ?? 0,
      conv: convMap.get(l.id) ?? 0,
      aPagar: aPagarMap.get(l.id) ?? 0,
      pago: pagoMap.get(l.id) ?? 0,
    }))
    .filter((l) => l.conf > 0 || l.conv > 0 || l.aPagar > 0 || l.pago > 0)
    .sort((a, b) => a.ordem - b.ordem || a.nome.localeCompare(b.nome));

  const badge = (presenca: string) =>
    presenca === "PRESENTE"
      ? "bg-green-100 text-green-700"
      : presenca === "FALTOU"
        ? "bg-red-100 text-red-700"
        : "bg-amber-100 text-amber-700";

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Início</h1>
        <p className="text-sm text-gray-500">Resumo de hoje</p>
      </div>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Vagas em aberto ({requisicoesAbertas.length})
          </h2>
          <Link href="/requisicoes" className="text-sm font-medium text-orange-700 hover:underline">
            Ver pedidos
          </Link>
        </div>
        {requisicoesAbertas.length === 0 ? (
          <EmptyState>Nenhuma vaga em aberto. 🎉</EmptyState>
        ) : (
          <Card className="p-2">
            {requisicoesPorMarca.map((g) => (
              <div key={g.label} className="mb-2 last:mb-0">
                <p className="px-1 text-[11px] font-bold uppercase tracking-wide text-gray-400">
                  {g.label}
                </p>
                <ul className="divide-y divide-gray-100">
                  {g.itens.map((r) => (
                    <li key={r.id} className="flex items-center justify-between gap-2 py-1.5">
                      <span className="min-w-0 text-sm">
                        <span className="font-medium text-gray-900">{r.loja.nome}</span>
                        <span className="block text-xs text-gray-500">
                          {r.funcao ?? "qualquer"} · {formatBRL(r.valorDiaria)} ·{" "}
                          {formatDateShort(r.data)}
                          {r.quantidade > 1 ? ` · ${r.quantidade} vagas` : ""}
                        </span>
                      </span>
                      <Link
                        href={`/requisicoes/${r.id}`}
                        className="shrink-0 rounded-lg bg-orange-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-800"
                      >
                        Convocar
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </Card>
        )}
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-gray-900">Resumo por loja</h2>
          <span className="text-xs text-gray-500">
            {diaSel ? formatDateShort(diaSel) : `${formatDateShort(rIni)}–${formatDateShort(rFim)}`}
          </span>
        </div>
        <div className="mb-2">
          <BarraDia basePath="/" diaSel={diaSel} />
        </div>
        {resumoLojas.length === 0 ? (
          <EmptyState>Sem movimento {diaSel ? "nesse dia" : "nesta semana"}.</EmptyState>
        ) : (
          <Card className="p-2">
            <p className="mb-1 px-1 text-[11px] text-gray-400">
              ⏳ a confirmar · ✓ confirmadas · 🔴 a pagar · 🟢 pago
            </p>
            <ul className="divide-y divide-gray-100">
              {resumoLojas.map((l) => (
                <li
                  key={l.nome}
                  className="flex items-center justify-between gap-2 py-1.5"
                >
                  <span className="min-w-0 truncate text-sm font-medium text-gray-900">
                    {l.nome}
                  </span>
                  <span className="flex shrink-0 flex-wrap items-center justify-end gap-1 text-[11px]">
                    {l.conv > 0 && (
                      <span className="rounded-full bg-amber-100 px-1.5 py-0.5 font-medium text-amber-700">
                        ⏳ {l.conv}
                      </span>
                    )}
                    {l.conf > 0 && (
                      <span className="rounded-full bg-blue-100 px-1.5 py-0.5 font-medium text-blue-700">
                        ✓ {l.conf}
                      </span>
                    )}
                    {l.aPagar > 0 && (
                      <span className="rounded-full bg-red-100 px-1.5 py-0.5 font-semibold text-red-700">
                        {formatBRL(l.aPagar)}
                      </span>
                    )}
                    {l.pago > 0 && (
                      <span className="rounded-full bg-green-100 px-1.5 py-0.5 font-medium text-green-700">
                        {formatBRL(l.pago)}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </section>

      <Link
        href="/sugestoes"
        className="relative flex items-center justify-between rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 shadow-sm hover:bg-orange-100"
      >
        <span>
          <span className="block text-sm font-semibold text-orange-800">
            💡 Sugestões e Solicitações
          </span>
          <span className="block text-xs text-orange-700">
            Quem indicar por loja e quem já pediu para trabalhar
          </span>
        </span>
        {solicitacoesPendentes > 0 && (
          <span className="shrink-0 rounded-full bg-orange-600 px-2 py-0.5 text-xs font-bold text-white">
            {solicitacoesPendentes}
          </span>
        )}
      </Link>

      <div className="grid grid-cols-3 gap-3 text-center">
        <Link href="/escala/novo">
          <Card className="h-full">
            <p className="text-2xl">📅</p>
            <p className="mt-1 text-sm font-medium text-gray-700">Agendar</p>
          </Card>
        </Link>
        <Link href="/diaristas">
          <Card className="h-full">
            <p className="text-2xl">👤</p>
            <p className="mt-1 text-sm font-medium text-gray-700">Diaristas</p>
          </Card>
        </Link>
        <Link href="/lojas">
          <Card className="h-full">
            <p className="text-2xl">🏬</p>
            <p className="mt-1 text-sm font-medium text-gray-700">Lojas</p>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Link href="/bonificacoes" className="rounded-xl border border-gray-200 bg-white px-2 py-3 text-center text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">
          🎁 Bônus
        </Link>
        <Link href="/ranking" className="rounded-xl border border-gray-200 bg-white px-2 py-3 text-center text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">
          🏆 Ranking
        </Link>
        <Link href="/mensagens" className="relative rounded-xl border border-gray-200 bg-white px-2 py-3 text-center text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">
          💬 Mensagens
          {mensagensNaoLidas > 0 && (
            <span className="absolute -right-1 -top-1 rounded-full bg-red-500 px-1.5 py-0.5 text-xs font-bold text-white">
              {mensagensNaoLidas}
            </span>
          )}
        </Link>
      </div>

      <Link
        href="/usuarios"
        className="block rounded-xl border border-gray-200 bg-white px-4 py-3 text-center text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
      >
        👥 Criar usuário (lojista, gestor, RH, TI, diarista)
      </Link>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Escalados hoje ({escalasHoje.length})</h2>
          <Link href="/escala" className="text-sm font-medium text-orange-700 hover:underline">
            Ver escala
          </Link>
        </div>
        {escalasHoje.length === 0 ? (
          <Card>
            <p className="text-sm text-gray-500">Ninguém escalado para hoje.</p>
          </Card>
        ) : (
          <Card>
            {escalasPorMarca.map((g) => (
              <div key={g.label} className="mb-2 last:mb-0">
                <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">{g.label}</p>
                <ul className="divide-y divide-gray-100">
                  {g.itens.map((e) => (
                    <li key={e.id} className="flex items-center justify-between gap-2 py-1.5 text-sm">
                      <span className="min-w-0 truncate">
                        <span className="text-gray-500">{e.loja.nome}</span>
                        <span className="text-gray-400"> — </span>
                        <span className="font-medium text-gray-900">{e.diarista.nome}</span>
                      </span>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${badge(e.presenca)}`}>
                        {e.presenca === "PRESENTE" ? "Presente" : e.presenca === "FALTOU" ? "Faltou" : "Pendente"}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </Card>
        )}
      </section>

      {pendentes.length > 0 && (
        <section>
          <h2 className="mb-2 text-lg font-semibold text-gray-900">Presenças pendentes ({pendentes.length})</h2>
          <Card>
            {pendentesPorMarca.map((g) => (
              <div key={g.label} className="mb-2 last:mb-0">
                <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">{g.label}</p>
                <ul className="divide-y divide-gray-100">
                  {g.itens.map((e) => (
                    <li key={e.id} className="flex items-center justify-between gap-2 py-1.5 text-sm">
                      <span className="min-w-0 truncate">
                        <span className="text-gray-500">{e.loja.nome}</span>
                        <span className="text-gray-400"> — </span>
                        <span className="font-medium text-gray-900">{e.diarista.nome}</span>
                      </span>
                      <span className="shrink-0 text-xs text-gray-400">{formatDateShort(e.data)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </Card>
        </section>
      )}

      <p className="text-center text-xs text-gray-400">
        {diaristasAtivas} diarista(s) e {lojasAtivas} loja(s) ativas.
      </p>
    </div>
  );
}
