import { prisma } from "@/lib/prisma";
import { formatBRL } from "@/lib/format";
import { exigirDiarista } from "@/lib/diaristaSessao";
import {
  DIARIAS_CASHBACK,
  DIARIAS_CASHBACK_20,
  DIARIAS_MILESTONE_30,
  DIARIAS_MILESTONE_50,
  MEDIA_MINIMA_CASHBACK,
  VALOR_BONUS,
  VALOR_BONUS_30,
  VALOR_BONUS_50,
} from "@/lib/bonificacoes";

export const dynamic = "force-dynamic";

const NOME_BONUS: Record<string, string> = {
  CASHBACK_5: "Cashback de 5 diárias",
  CASHBACK_20: "Cashback de 20 diárias",
  MILESTONE_30: "Bônus de 30 diárias",
  MILESTONE_50: "Bônus de 50 diárias",
  TOP_MES: "Top do mês",
};

export default async function BonusPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  await exigirDiarista(token);

  const diarista = await prisma.diarista.findUnique({
    where: { token },
    include: {
      bonificacoes: { where: { pago: true }, orderBy: { criadoEm: "desc" } },
      _count: { select: { avaliacoes: true } },
    },
  });
  if (!diarista) return null;

  const feitas = diarista._count.avaliacoes;

  const marcos = [
    { n: DIARIAS_CASHBACK, valor: VALOR_BONUS, nota: MEDIA_MINIMA_CASHBACK },
    { n: DIARIAS_CASHBACK_20, valor: VALOR_BONUS, nota: MEDIA_MINIMA_CASHBACK },
    { n: DIARIAS_MILESTONE_30, valor: VALOR_BONUS_30, nota: null as number | null },
    { n: DIARIAS_MILESTONE_50, valor: VALOR_BONUS_50, nota: null as number | null },
  ];
  const proximo = marcos.find((m) => feitas < m.n) ?? null;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Bônus</h1>
        <p className="text-sm text-gray-500">Como ganhar dinheiro extra trabalhando na rede</p>
      </div>

      {proximo && (
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 shadow-sm">
          <p className="text-sm font-semibold text-orange-900">
            🎁 Próximo bônus: {formatBRL(proximo.valor)} em {proximo.n} diárias
          </p>
          <p className="mt-0.5 text-xs text-orange-700">
            Faltam {proximo.n - feitas} diária(s)
            {proximo.nota ? ` bem avaliada(s) (média ≥ ${proximo.nota.toFixed(1).replace(".", ",")} ★)` : ""}.
          </p>
          <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-white">
            <div
              className="h-full rounded-full bg-orange-500"
              style={{ width: `${Math.min(100, (feitas / proximo.n) * 100)}%` }}
            />
          </div>
          <p className="mt-1 text-right text-xs font-medium text-orange-700">
            {feitas}/{proximo.n}
          </p>
        </div>
      )}

      <section>
        <h2 className="mb-2 font-semibold text-gray-900">Como funciona</h2>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="rounded-xl border border-gray-200 bg-white p-3">
            <strong>{DIARIAS_CASHBACK} diárias</strong> bem avaliadas (média ≥{" "}
            {MEDIA_MINIMA_CASHBACK.toFixed(1).replace(".", ",")} ★) ={" "}
            <strong className="text-green-700">{formatBRL(VALOR_BONUS)}</strong>
          </li>
          <li className="rounded-xl border border-gray-200 bg-white p-3">
            <strong>{DIARIAS_CASHBACK_20} diárias</strong> bem avaliadas (média ≥{" "}
            {MEDIA_MINIMA_CASHBACK.toFixed(1).replace(".", ",")} ★) ={" "}
            <strong className="text-green-700">{formatBRL(VALOR_BONUS)}</strong>
          </li>
          <li className="rounded-xl border border-gray-200 bg-white p-3">
            <strong>{DIARIAS_MILESTONE_30} diárias</strong> realizadas ={" "}
            <strong className="text-green-700">{formatBRL(VALOR_BONUS_30)}</strong>
          </li>
          <li className="rounded-xl border border-gray-200 bg-white p-3">
            <strong>{DIARIAS_MILESTONE_50} diárias</strong> realizadas ={" "}
            <strong className="text-green-700">{formatBRL(VALOR_BONUS_50)}</strong>
          </li>
          <li className="rounded-xl border border-gray-200 bg-white p-3">
            🏆 <strong>Top do mês</strong> (melhor média do mês) ={" "}
            <strong className="text-green-700">{formatBRL(VALOR_BONUS)}</strong>
          </li>
        </ul>
        <p className="mt-2 text-xs text-gray-400">
          Mantenha sua média acima de {MEDIA_MINIMA_CASHBACK.toFixed(1).replace(".", ",")} ★ para
          garantir os bônus por boa avaliação.
        </p>
      </section>

      {diarista.bonificacoes.length > 0 && (
        <section>
          <h2 className="mb-2 font-semibold text-gray-900">Seus bônus já conquistados</h2>
          <ul className="space-y-1.5">
            {diarista.bonificacoes.map((b) => (
              <li
                key={b.id}
                className="flex items-center justify-between rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800"
              >
                <span>{NOME_BONUS[b.tipo] ?? "Bônus"}</span>
                <strong>{formatBRL(b.valor)}</strong>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
