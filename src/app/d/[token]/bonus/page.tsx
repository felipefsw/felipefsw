import { prisma } from "@/lib/prisma";
import { formatBRL } from "@/lib/format";
import { exigirDiarista } from "@/lib/diaristaSessao";
import { MARCOS_DIARIAS, MEDIA_MINIMA, VALOR_BONUS, mediaGeral } from "@/lib/bonificacoes";

export const dynamic = "force-dynamic";

function nomeBonus(tipo: string): string {
  if (tipo.startsWith("MARCO_")) return `Bônus de ${tipo.replace("MARCO_", "")} diárias`;
  if (tipo === "CASHBACK_5") return "Cashback de 5 diárias";
  if (tipo === "CASHBACK_20") return "Cashback de 20 diárias";
  if (tipo === "MILESTONE_30") return "Bônus de 30 diárias";
  if (tipo === "MILESTONE_50") return "Bônus de 50 diárias";
  if (tipo === "TOP_MES") return "Top do mês";
  return "Bônus";
}

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
      avaliacoes: { select: { estrelas: true } },
      bonificacoes: { where: { pago: true }, orderBy: { criadoEm: "desc" } },
      _count: { select: { escalas: { where: { presenca: "PRESENTE" } } } },
    },
  });
  if (!diarista) return null;

  const diarias = diarista._count.escalas;
  const totalAval = diarista.avaliacoes.length;
  const media = mediaGeral(diarista.avaliacoes);
  const mediaOk = media >= MEDIA_MINIMA;
  const minStr = MEDIA_MINIMA.toFixed(1).replace(".", ",");

  const proximo = MARCOS_DIARIAS.find((n) => diarias < n) ?? null;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Bônus</h1>
        <p className="text-sm text-gray-500">
          A cada marco de diárias, mantendo a média ≥ {minStr} ★, você ganha {formatBRL(VALOR_BONUS)}.
        </p>
      </div>

      <section className="grid grid-cols-2 gap-3 text-center">
        <div className="rounded-xl border border-gray-200 bg-white p-3">
          <p className="text-2xl font-bold text-gray-900">{diarias}</p>
          <p className="text-xs text-gray-500">diárias feitas</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-3">
          <p className={`text-2xl font-bold ${mediaOk ? "text-green-600" : "text-amber-600"}`}>
            {totalAval > 0 ? `★ ${media.toFixed(1)}` : "—"}
          </p>
          <p className="text-xs text-gray-500">
            {totalAval > 0 ? (mediaOk ? "média ok!" : `precisa ≥ ${minStr}`) : "sem avaliações"}
          </p>
        </div>
      </section>

      {proximo && (
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 shadow-sm">
          <p className="text-sm font-semibold text-orange-900">
            🎁 Próximo bônus: {formatBRL(VALOR_BONUS)} em {proximo} diárias
          </p>
          <p className="mt-0.5 text-xs text-orange-700">
            Faltam {proximo - diarias} diária(s) — e mantenha a média ≥ {minStr} ★.
          </p>
          <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-white">
            <div
              className="h-full rounded-full bg-orange-500"
              style={{ width: `${Math.min(100, (diarias / proximo) * 100)}%` }}
            />
          </div>
          <p className="mt-1 text-right text-xs font-medium text-orange-700">
            {diarias}/{proximo}
          </p>
        </div>
      )}

      <section>
        <h2 className="mb-2 font-semibold text-gray-900">Como funciona</h2>
        <ul className="space-y-2 text-sm text-gray-700">
          {MARCOS_DIARIAS.map((n) => (
            <li
              key={n}
              className={`flex items-center justify-between rounded-xl border p-3 ${
                diarias >= n ? "border-green-200 bg-green-50" : "border-gray-200 bg-white"
              }`}
            >
              <span>
                <strong>{n} diárias</strong> mantendo média ≥ {minStr} ★
              </span>
              <strong className="text-green-700">{formatBRL(VALOR_BONUS)}</strong>
            </li>
          ))}
          <li className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-3">
            <span>
              🏆 <strong>Top do mês</strong> (melhor média do mês)
            </span>
            <strong className="text-green-700">{formatBRL(VALOR_BONUS)}</strong>
          </li>
        </ul>
        <p className="mt-2 text-xs text-gray-400">
          As notas das diárias avaliadas formam sua média. Mantê-la alta garante os bônus.
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
                <span>{nomeBonus(b.tipo)}</span>
                <strong>{formatBRL(b.valor)}</strong>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
