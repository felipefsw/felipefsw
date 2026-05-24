import Link from "next/link";
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
  const ranking = await rankingDoMes(mes);
  const [ano, m] = mes.split("-");
  const voltarHref = token ? `/d/${token}` : "/entrar";

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
