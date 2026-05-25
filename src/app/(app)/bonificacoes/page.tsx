import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import { formatBRL } from "@/lib/format";
import {
  MARCOS_DIARIAS,
  MEDIA_MINIMA,
  VALOR_BONUS,
  mediaGeral,
  mesAtual,
  rankingDoMes,
  tipoMarco,
} from "@/lib/bonificacoes";
import { pagarMarco, pagarTopMes } from "./actions";

export const dynamic = "force-dynamic";

export default async function BonificacoesPage() {
  const mes = mesAtual();

  const [diaristas, ranking, topPagos] = await Promise.all([
    prisma.diarista.findMany({
      include: {
        avaliacoes: { select: { estrelas: true } },
        bonificacoes: {
          where: { tipo: { startsWith: "MARCO_" } },
          select: { tipo: true },
        },
        _count: { select: { escalas: { where: { presenca: "PRESENTE" } } } },
      },
    }),
    rankingDoMes(mes),
    prisma.bonificacao.findMany({
      where: { tipo: "TOP_MES", referencia: mes },
      select: { diaristaId: true },
    }),
  ]);

  // Para cada marco, quem já fez N diárias mantendo a média e ainda não recebeu.
  const elegiveisPorMarco = MARCOS_DIARIAS.map((n) => ({
    n,
    lista: diaristas
      .filter(
        (d) =>
          d._count.escalas >= n &&
          mediaGeral(d.avaliacoes) >= MEDIA_MINIMA &&
          !d.bonificacoes.some((b) => b.tipo === tipoMarco(n)),
      )
      .map((d) => ({
        id: d.id,
        nome: d.nome,
        diarias: d._count.escalas,
        media: mediaGeral(d.avaliacoes),
      })),
  }));

  const topPagosSet = new Set(topPagos.map((b) => b.diaristaId));

  return (
    <div className="space-y-5">
      <PageHeader title="Bonificações" subtitle="R$ 100,00 por marco de diárias + Top do mês" />

      <p className="rounded-lg border border-orange-200 bg-orange-50 p-3 text-xs text-orange-800">
        A cada marco de diárias ({MARCOS_DIARIAS.join(", ")}) mantendo a média ≥{" "}
        {MEDIA_MINIMA.toFixed(1).replace(".", ",")} ★, o diarista ganha {formatBRL(VALOR_BONUS)}.
      </p>

      <p className="text-sm">
        <Link href="/ranking" className="font-medium text-orange-700 underline">
          Ver ranking público →
        </Link>
      </p>

      {elegiveisPorMarco.map(({ n, lista }) => (
        <section key={n}>
          <h2 className="mb-2 font-semibold text-gray-900">
            Marco de {n} diárias (média ≥ {MEDIA_MINIMA.toFixed(1).replace(".", ",")} ★) ·{" "}
            {formatBRL(VALOR_BONUS)}
          </h2>
          {lista.length === 0 ? (
            <EmptyState>Ninguém elegível a este marco no momento.</EmptyState>
          ) : (
            <div className="space-y-2">
              {lista.map((d) => (
                <Card key={d.id}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-gray-900">{d.nome}</span>
                      <span className="block text-xs text-gray-500">
                        {d.diarias} diárias · média {d.media.toFixed(1)} ★
                      </span>
                    </span>
                    <form action={pagarMarco}>
                      <input type="hidden" name="diaristaId" value={d.id} />
                      <input type="hidden" name="marco" value={n} />
                      <button
                        type="submit"
                        className="shrink-0 rounded-lg bg-orange-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-orange-800"
                      >
                        Pagar {formatBRL(VALOR_BONUS)}
                      </button>
                    </form>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>
      ))}

      <section>
        <h2 className="mb-2 font-semibold text-gray-900">Top do mês · {formatBRL(VALOR_BONUS)}</h2>
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
                        Pagar {formatBRL(VALOR_BONUS)}
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
