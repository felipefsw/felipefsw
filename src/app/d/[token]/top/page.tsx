import { prisma } from "@/lib/prisma";
import Avatar from "@/components/Avatar";
import MarcaBadge from "@/components/MarcaBadge";
import { exigirDiarista } from "@/lib/diaristaSessao";
import { MIN_AVALIACOES, notaPublica } from "@/lib/notas";

export const dynamic = "force-dynamic";

export default async function TopPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  await exigirDiarista(token);

  const [avalDiarista, escalasFeitas, diaristas, avalLojas, lojas] = await Promise.all([
    prisma.avaliacao.groupBy({
      by: ["diaristaId"],
      _avg: { estrelas: true },
      _count: { _all: true },
    }),
    prisma.escala.groupBy({
      by: ["diaristaId"],
      where: { presenca: "PRESENTE" },
      _count: { _all: true },
    }),
    prisma.diarista.findMany({
      where: { ativo: true },
      select: { id: true, nome: true, fotoUrl: true },
    }),
    prisma.avaliacaoLoja.findMany({
      select: {
        lojaId: true,
        ambiente: true,
        tratamento: true,
        pagamentoEmDia: true,
        organizacao: true,
        seguranca: true,
      },
    }),
    prisma.loja.findMany({ where: { ativo: true }, select: { id: true, nome: true } }),
  ]);

  // ----- Top diaristas -----
  const notaDiarista = new Map<string, { media: number; qtd: number }>();
  for (const g of avalDiarista) {
    notaDiarista.set(g.diaristaId, { media: g._avg.estrelas ?? 0, qtd: g._count._all });
  }
  const diariasDe = new Map<string, number>();
  for (const g of escalasFeitas) diariasDe.set(g.diaristaId, g._count._all);

  const rankDiaristas = diaristas
    .map((d) => {
      const n = notaDiarista.get(d.id);
      return {
        id: d.id,
        nome: d.nome,
        fotoUrl: d.fotoUrl,
        diarias: diariasDe.get(d.id) ?? 0,
        nota: n ? notaPublica(n.media * n.qtd, n.qtd) : null,
      };
    })
    .filter((d) => d.diarias > 0 || d.nota != null)
    .sort(
      (a, b) => (b.nota ?? -1) - (a.nota ?? -1) || b.diarias - a.diarias || a.nome.localeCompare(b.nome),
    )
    .slice(0, 50);

  // ----- Lojas mais bem avaliadas -----
  const accLoja = new Map<string, { soma: number; qtd: number }>();
  for (const a of avalLojas) {
    const m = (a.ambiente + a.tratamento + a.pagamentoEmDia + a.organizacao + a.seguranca) / 5 / 2;
    const cur = accLoja.get(a.lojaId) ?? { soma: 0, qtd: 0 };
    cur.soma += m;
    cur.qtd += 1;
    accLoja.set(a.lojaId, cur);
  }
  const nomeLoja = new Map(lojas.map((l) => [l.id, l.nome]));
  const rankLojas = [...accLoja.entries()]
    .map(([id, v]) => ({ id, nome: nomeLoja.get(id) ?? "Loja", nota: notaPublica(v.soma, v.qtd) }))
    .filter((l) => l.nota != null)
    .sort((a, b) => (b.nota ?? 0) - (a.nota ?? 0))
    .slice(0, 30);

  const medalha = (i: number) => (i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}º`);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Top diaristas</h1>
        <p className="text-sm text-gray-500">
          Os melhores da rede por nota e diárias. Nota aparece após {MIN_AVALIACOES} avaliações.
        </p>
      </div>

      <section>
        <ul className="space-y-2">
          {rankDiaristas.map((d, i) => (
            <li
              key={d.id}
              className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3"
            >
              <span className="w-7 shrink-0 text-center text-sm font-bold text-gray-500">
                {medalha(i)}
              </span>
              <Avatar nome={d.nome} fotoUrl={d.fotoUrl} className="h-9 w-9 shrink-0" />
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900">
                {d.nome}
              </span>
              <span className="shrink-0 text-right text-xs text-gray-500">
                {d.nota != null ? (
                  <span className="font-semibold text-amber-600">★ {d.nota.toFixed(1)}</span>
                ) : (
                  <span className="text-gray-300">sem nota</span>
                )}
                <span className="block">{d.diarias} diárias</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-2 font-semibold text-gray-900">🏬 Lojas mais bem avaliadas</h2>
        {rankLojas.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500">
            Ainda não há lojas com {MIN_AVALIACOES} avaliações.
          </div>
        ) : (
          <ul className="space-y-2">
            {rankLojas.map((l, i) => (
              <li
                key={l.id}
                className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3"
              >
                <span className="w-7 shrink-0 text-center text-sm font-bold text-gray-500">
                  {medalha(i)}
                </span>
                <MarcaBadge nome={l.nome} className="h-8 w-8 shrink-0 rounded" />
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900">
                  {l.nome}
                </span>
                <span className="shrink-0 font-semibold text-amber-600">
                  ★ {(l.nota ?? 0).toFixed(1)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
