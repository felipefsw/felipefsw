import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import Avatar from "@/components/Avatar";
import SubmitButton from "@/components/SubmitButton";
import { formatBRL, formatDateShort } from "@/lib/format";
import { hojeISO } from "@/lib/dates";
import { grupoDaLoja } from "@/lib/marcas";
import { escalarNaVaga } from "../escala/actions";

export const dynamic = "force-dynamic";

export default async function SugestoesPage() {
  const hoje = hojeISO();

  const [diaristas, requisicoes] = await Promise.all([
    prisma.diarista.findMany({
      where: { ativo: true },
      select: {
        id: true,
        nome: true,
        funcao: true,
        fotoUrl: true,
        escalas: { select: { lojaId: true, data: true } },
        bloqueios: {
          where: { OR: [{ ate: null }, { ate: { gt: new Date() } }] },
          select: { lojaId: true },
        },
        lojasPreferidas: { select: { id: true } },
      },
    }),
    prisma.requisicao.findMany({
      where: { status: "ABERTA", data: { gte: hoje } },
      include: {
        loja: { select: { nome: true } },
        _count: { select: { escalas: true } },
        inscricoes: {
          where: { status: "PENDENTE" },
          include: { diarista: { select: { id: true, nome: true, funcao: true, fotoUrl: true } } },
        },
      },
      orderBy: { data: "asc" },
    }),
  ]);

  // Resumo de cada diarista para pontuar as sugestões por loja.
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
      fotoUrl: d.fotoUrl,
      freq,
      datas,
      bloq: new Set(d.bloqueios.map((b) => b.lojaId)),
      preferidas: new Set(d.lojasPreferidas.map((l) => l.id)),
    };
  });

  // Vagas abertas com diaristas sugeridos: preferenciais da loja
  // (já trabalharam lá ou marcaram como preferida), livres no dia e sem bloqueio.
  const vagas = requisicoes
    .map((r) => {
      const faltam = r.quantidade - r._count.escalas;
      const sugeridos = info
        .filter(
          (d) =>
            (!r.funcao || d.funcao === r.funcao) &&
            !d.bloq.has(r.lojaId) &&
            !d.datas.has(r.data),
        )
        .map((d) => ({
          ...d,
          vezes: d.freq.get(r.lojaId) ?? 0,
          preferida: d.preferidas.has(r.lojaId),
        }))
        .sort(
          (a, b) =>
            Number(b.preferida) - Number(a.preferida) || b.vezes - a.vezes,
        )
        .slice(0, 5);
      return { r, faltam, sugeridos };
    })
    .filter((v) => v.faltam > 0);

  // Solicitações dos diaristas: quem se candidatou a uma vaga aberta.
  const solicitacoes = requisicoes.flatMap((r) =>
    r.inscricoes.map((i) => ({ r, diarista: i.diarista })),
  );

  // Agrupa as vagas por marca (quadrante) para facilitar a leitura.
  const grupos = new Map<string, { label: string; ordem: number; itens: typeof vagas }>();
  for (const v of vagas) {
    const g = grupoDaLoja(v.r.loja.nome);
    const cur = grupos.get(g.key) ?? { label: g.label, ordem: g.ordem, itens: [] as typeof vagas };
    cur.itens.push(v);
    grupos.set(g.key, cur);
  }
  const gruposOrdenados = [...grupos.values()].sort((a, b) => a.ordem - b.ordem);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sugestões e Solicitações"
        subtitle="Quem indicar para cada loja e quem já pediu para trabalhar"
      />

      {/* Solicitações dos diaristas (quem se candidatou) */}
      <section>
        <h2 className="mb-2 text-lg font-semibold text-gray-900">
          Solicitações dos diaristas ({solicitacoes.length})
        </h2>
        {solicitacoes.length === 0 ? (
          <EmptyState>Nenhum diarista se candidatou a uma vaga aberta.</EmptyState>
        ) : (
          <div className="space-y-2">
            {solicitacoes.map(({ r, diarista }) => (
              <Card key={`${r.id}-${diarista.id}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-2">
                    <Avatar nome={diarista.nome} fotoUrl={diarista.fotoUrl} className="h-9 w-9" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-gray-900">
                        {diarista.nome}
                      </span>
                      <span className="block truncate text-[11px] text-gray-400">
                        quer {r.loja.nome} · {formatDateShort(r.data)} · {formatBRL(r.valorDiaria)}
                        {diarista.funcao ? ` · ${diarista.funcao}` : ""}
                      </span>
                    </span>
                  </span>
                  <form action={escalarNaVaga.bind(null, r.id, diarista.id)}>
                    <SubmitButton
                      pendingLabel="…"
                      className="shrink-0 rounded-lg bg-orange-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-orange-800"
                    >
                      Alocar
                    </SubmitButton>
                  </form>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Sugestões por loja (vagas abertas) */}
      <section>
        <h2 className="mb-2 text-lg font-semibold text-gray-900">
          Sugestões por loja ({vagas.length} vaga(s))
        </h2>
        {gruposOrdenados.length === 0 ? (
          <EmptyState>
            Nenhuma vaga aberta no momento.{" "}
            <Link href="/requisicoes" className="font-medium text-orange-700 underline">
              Ver pedidos
            </Link>
          </EmptyState>
        ) : (
          <div className="space-y-4">
            {gruposOrdenados.map((g) => (
              <div key={g.label}>
                <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-500">
                  {g.label}
                </h3>
                <div className="space-y-2">
                  {g.itens.map(({ r, faltam, sugeridos }) => (
                    <Card key={r.id}>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-gray-900">{r.loja.nome}</p>
                        <span className="text-xs text-gray-400">{formatDateShort(r.data)}</span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {r.funcao ?? "qualquer função"} · {r.horaInicio}–{r.horaFim} ·{" "}
                        {formatBRL(r.valorDiaria)} · faltam {faltam}
                      </p>
                      <div className="mt-2 space-y-1.5">
                        {sugeridos.length === 0 ? (
                          <p className="text-xs text-gray-400">Sem sugestões livres neste dia.</p>
                        ) : (
                          sugeridos.map((d) => (
                            <div key={d.id} className="flex items-center justify-between gap-2">
                              <span className="flex min-w-0 items-center gap-2">
                                <Avatar nome={d.nome} fotoUrl={d.fotoUrl} className="h-7 w-7" />
                                <span className="min-w-0">
                                  <span className="block truncate text-sm text-gray-800">
                                    {d.nome}
                                  </span>
                                  <span className="block text-[11px] text-gray-400">
                                    {d.preferida && (
                                      <span className="font-medium text-orange-600">preferida · </span>
                                    )}
                                    {d.vezes}× nesta loja
                                    {d.funcao ? ` · ${d.funcao}` : ""}
                                  </span>
                                </span>
                              </span>
                              <form action={escalarNaVaga.bind(null, r.id, d.id)}>
                                <SubmitButton
                                  pendingLabel="…"
                                  className="shrink-0 rounded-lg bg-orange-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-orange-800"
                                >
                                  Alocar
                                </SubmitButton>
                              </form>
                            </div>
                          ))
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
