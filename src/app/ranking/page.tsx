import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { mesAtual, rankingDoMes } from "@/lib/bonificacoes";

export const dynamic = "force-dynamic";

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

function medalha(i: number): string {
  return i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}º`;
}

export default async function RankingPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const mes = mesAtual();
  const [ranking, diaristas] = await Promise.all([
    rankingDoMes(mes),
    prisma.diarista.findMany({
      where: { ativo: true },
      select: {
        id: true,
        nome: true,
        avaliacoes: { select: { estrelas: true } },
        _count: { select: { escalas: { where: { presenca: "PRESENTE" } } } },
      },
    }),
  ]);
  const [ano, m] = mes.split("-");
  const voltarHref = token ? `/d/${token}` : "/entrar";

  // Top 5 balanceando NOTA (qualidade) e QUANTIDADE de diárias.
  const top5 = diaristas
    .map((d) => {
      const n = d.avaliacoes.length;
      const media = n ? d.avaliacoes.reduce((s, a) => s + a.estrelas, 0) / n : 0;
      const diarias = d._count.escalas;
      const score = (media / 5) * 0.5 + (Math.min(diarias, 30) / 30) * 0.5;
      return { id: d.id, nome: d.nome, media, diarias, n, score };
    })
    .filter((d) => d.diarias >= 1)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return (
    <div className="mx-auto max-w-md">
      <header className="bg-neutral-900 px-5 py-6 text-white">
        <div className="mb-3 flex items-center justify-between">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/rwp-logo.svg" alt="RWP" className="h-7 w-auto" />
          <Link href={voltarHref} className="text-sm font-medium text-orange-100 underline">
            ← Voltar
          </Link>
        </div>
        <h1 className="text-xl font-bold">Ranking de diaristas</h1>
        <p className="mt-1 text-sm capitalize text-orange-100">
          {MESES[Number(m) - 1]} de {ano}
        </p>
      </header>

      <main className="p-5">
        <h2 className="mb-2 font-semibold text-gray-900">🏆 Top 5 (nota + quantidade)</h2>
        {top5.length === 0 ? (
          <div className="mb-5 rounded-xl border border-dashed border-gray-300 bg-white p-4 text-center text-sm text-gray-500">
            Ainda sem diárias suficientes.
          </div>
        ) : (
          <ol className="mb-6 space-y-2">
            {top5.map((d, i) => (
              <li
                key={d.id}
                className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 ${
                  i < 3 ? "border-amber-300 bg-amber-50" : "border-gray-200 bg-white"
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className="w-8 text-center text-lg">{medalha(i)}</span>
                  <span className="font-medium text-gray-900">{d.nome}</span>
                </span>
                <span className="text-right">
                  <span className="block font-semibold text-orange-700">
                    {d.n > 0 ? `★ ${d.media.toFixed(1)}` : "sem nota"}
                  </span>
                  <span className="block text-xs text-gray-400">{d.diarias} diárias</span>
                </span>
              </li>
            ))}
          </ol>
        )}

        <h2 className="mb-2 font-semibold text-gray-900">Ranking do mês</h2>
        <p className="mb-4 text-sm text-gray-500">
          Melhores médias do mês (mínimo de 3 diárias avaliadas). Os primeiros colocados
          recebem <strong>R$ 100,00</strong>.
        </p>

        {ranking.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center text-gray-500">
            Ainda não há diaristas suficientes avaliados neste mês.
          </div>
        ) : (
          <ol className="space-y-2">
            {ranking.slice(0, 20).map((r, i) => (
              <li
                key={r.id}
                className={`flex items-center justify-between gap-3 rounded-xl border bg-white px-4 py-3 ${
                  i < 3 ? "border-amber-300" : "border-gray-200"
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className="w-8 text-center text-lg">{medalha(i)}</span>
                  <span className="font-medium text-gray-900">{r.nome}</span>
                </span>
                <span className="text-right">
                  <span className="block font-semibold text-orange-700">
                    ★ {r.media.toFixed(1)}
                  </span>
                  <span className="block text-xs text-gray-400">{r.diarias} diárias</span>
                </span>
              </li>
            ))}
          </ol>
        )}

        <p className="mt-5 text-center text-sm">
          <Link href={voltarHref} className="font-medium text-orange-700 underline">
            {token ? "← Voltar para minha agenda" : "Entrar"}
          </Link>
        </p>
      </main>
    </div>
  );
}
