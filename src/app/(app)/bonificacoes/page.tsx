import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import { formatBRL } from "@/lib/format";
import {
  DIARIAS_CASHBACK,
  DIARIAS_CASHBACK_20,
  MEDIA_MINIMA_CASHBACK,
  MEDIA_MINIMA_CASHBACK_20,
  mediaDaAvaliacao,
  mesAtual,
  rankingDoMes,
} from "@/lib/bonificacoes";
import { pagarCashback, pagarCashback20, pagarTopMes } from "./actions";

export const dynamic = "force-dynamic";

export default async function BonificacoesPage() {
  const mes = mesAtual();

  const [diaristas, ranking, topPagos] = await Promise.all([
    prisma.diarista.findMany({
      include: {
        avaliacoes: { orderBy: { criadoEm: "asc" }, take: DIARIAS_CASHBACK_20 },
        bonificacoes: {
          where: { tipo: { in: ["CASHBACK_5", "CASHBACK_20"] } },
          select: { tipo: true },
        },
      },
    }),
    rankingDoMes(mes),
    prisma.bonificacao.findMany({
      where: { tipo: "TOP_MES", referencia: mes },
      select: { diaristaId: true },
    }),
  ]);

  const mediaDe = (avs: { estrelas: number }[]): number =>
    avs.reduce((s, a) => s + mediaDaAvaliacao(a), 0) / (avs.length || 1);

  // Elegíveis ao cashback: 5 primeiras diárias avaliadas com média >= 9, ainda não pagos.
  const elegiveisCashback = diaristas
    .filter(
      (d) =>
        !d.bonificacoes.some((b) => b.tipo === "CASHBACK_5") &&
        d.avaliacoes.length >= DIARIAS_CASHBACK &&
        mediaDe(d.avaliacoes.slice(0, DIARIAS_CASHBACK)) >= MEDIA_MINIMA_CASHBACK,
    )
    .map((d) => ({ id: d.id, nome: d.nome }));

  // Segundo bônus: 20 primeiras diárias avaliadas com média >= 8,5, ainda não pagos.
  const elegiveisCashback20 = diaristas
    .filter(
      (d) =>
        !d.bonificacoes.some((b) => b.tipo === "CASHBACK_20") &&
        d.avaliacoes.length >= DIARIAS_CASHBACK_20 &&
        mediaDe(d.avaliacoes.slice(0, DIARIAS_CASHBACK_20)) >= MEDIA_MINIMA_CASHBACK_20,
    )
    .map((d) => ({ id: d.id, nome: d.nome }));

  const topPagosSet = new Set(topPagos.map((b) => b.diaristaId));

  return (
    <div className="space-y-5">
      <PageHeader title="Bonificações" subtitle="Cashback e top do mês (R$ 100,00)" />

      <p className="text-sm">
        <Link href="/ranking" className="font-medium text-orange-700 underline">
          Ver ranking público →
        </Link>
      </p>

      <section>
        <h2 className="mb-2 font-semibold text-gray-900">
          Cashback — 5 diárias com média ≥ {MEDIA_MINIMA_CASHBACK.toFixed(1)}
        </h2>
        {elegiveisCashback.length === 0 ? (
          <EmptyState>Ninguém elegível ao cashback no momento.</EmptyState>
        ) : (
          <div className="space-y-2">
            {elegiveisCashback.map((d) => (
              <Card key={d.id}>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-gray-900">{d.nome}</span>
                  <form action={pagarCashback}>
                    <input type="hidden" name="diaristaId" value={d.id} />
                    <button
                      type="submit"
                      className="rounded-lg bg-orange-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-orange-800"
                    >
                      Pagar {formatBRL(10000)}
                    </button>
                  </form>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-2 font-semibold text-gray-900">
          Cashback — 20 diárias com média ≥ {MEDIA_MINIMA_CASHBACK_20.toFixed(1)}
        </h2>
        {elegiveisCashback20.length === 0 ? (
          <EmptyState>Ninguém elegível ao bônus de 20 diárias no momento.</EmptyState>
        ) : (
          <div className="space-y-2">
            {elegiveisCashback20.map((d) => (
              <Card key={d.id}>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-gray-900">{d.nome}</span>
                  <form action={pagarCashback20}>
                    <input type="hidden" name="diaristaId" value={d.id} />
                    <button
                      type="submit"
                      className="rounded-lg bg-orange-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-orange-800"
                    >
                      Pagar {formatBRL(10000)}
                    </button>
                  </form>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-2 font-semibold text-gray-900">Top do mês</h2>
        {ranking.length === 0 ? (
          <EmptyState>Sem ranking neste mês ainda.</EmptyState>
        ) : (
          <div className="space-y-2">
            {ranking.slice(0, 10).map((r, i) => (
              <Card key={r.id} className={i < 3 ? "border-amber-300" : ""}>
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-3">
                    <span className="w-6 text-center font-semibold text-gray-500">{i + 1}º</span>
                    <span>
                      <span className="block font-medium text-gray-900">{r.nome}</span>
                      <span className="block text-xs text-gray-400">
                        média {r.media.toFixed(1)} · {r.diarias} diárias
                      </span>
                    </span>
                  </span>
                  {topPagosSet.has(r.id) ? (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                      pago
                    </span>
                  ) : (
                    <form action={pagarTopMes}>
                      <input type="hidden" name="diaristaId" value={r.id} />
                      <input type="hidden" name="referencia" value={mes} />
                      <button
                        type="submit"
                        className="rounded-lg bg-orange-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-orange-800"
                      >
                        Pagar {formatBRL(10000)}
                      </button>
                    </form>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
