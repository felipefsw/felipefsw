import { prisma } from "@/lib/prisma";
import { Card, EmptyState, btnPrimary } from "@/components/ui";
import { formatBRL, formatDateShort } from "@/lib/format";
import { desfazerPago, marcarPago, pagarTudoDoDiarista } from "./actions";

export const dynamic = "force-dynamic";

export default async function PagamentosPage() {
  const aPagar = await prisma.escala.findMany({
    where: { presenca: "PRESENTE", pago: false },
    include: { diarista: true, loja: true },
    orderBy: [{ data: "asc" }],
  });

  const pagos = await prisma.escala.findMany({
    where: { presenca: "PRESENTE", pago: true },
    include: { diarista: true, loja: true },
    orderBy: [{ pagoEm: "desc" }],
    take: 30,
  });

  // Agrupa "a pagar" por diarista.
  const grupos = new Map<
    string,
    { nome: string; chavePix: string | null; total: number; itens: typeof aPagar }
  >();
  for (const e of aPagar) {
    const g = grupos.get(e.diaristaId) ?? {
      nome: e.diarista.nome,
      chavePix: e.diarista.chavePix,
      total: 0,
      itens: [] as typeof aPagar,
    };
    g.total += e.valor;
    g.itens.push(e);
    grupos.set(e.diaristaId, g);
  }

  const totalGeral = aPagar.reduce((s, e) => s + e.valor, 0);

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-gray-900">Pagamentos</h1>
      <p className="mb-4 text-sm text-gray-500">
        Diárias de quem trabalhou (presente) e ainda não recebeu.
      </p>

      <Card className="mb-4 border-orange-200 bg-orange-50">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-orange-800">Total a pagar</span>
          <span className="text-2xl font-bold text-orange-800">{formatBRL(totalGeral)}</span>
        </div>
      </Card>

      {grupos.size === 0 ? (
        <EmptyState>Tudo em dia! Não há diárias pendentes de pagamento.</EmptyState>
      ) : (
        <div className="space-y-3">
          {[...grupos.entries()].map(([diaristaId, g]) => (
            <Card key={diaristaId}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-900">{g.nome}</p>
                  {g.chavePix && (
                    <p className="text-sm text-gray-500">Pix: {g.chavePix}</p>
                  )}
                  <p className="mt-1 text-sm text-gray-600">
                    {g.itens.length} diária(s) · <strong>{formatBRL(g.total)}</strong>
                  </p>
                </div>
                <form action={pagarTudoDoDiarista}>
                  <input type="hidden" name="diaristaId" value={diaristaId} />
                  <button type="submit" className={btnPrimary}>
                    Pagar tudo
                  </button>
                </form>
              </div>

              <ul className="mt-3 divide-y divide-gray-100 border-t border-gray-100">
                {g.itens.map((e) => (
                  <li key={e.id} className="flex items-center justify-between gap-3 py-2">
                    <div className="text-sm">
                      <span className="text-gray-500">{formatDateShort(e.data)}</span>{" "}
                      <span className="text-gray-700">· {e.loja.nome}</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {formatBRL(e.valor)}
                      </span>
                    </div>
                    <form action={marcarPago}>
                      <input type="hidden" name="id" value={e.id} />
                      <button
                        type="submit"
                        className="rounded-lg border border-orange-600 px-3 py-1 text-sm font-medium text-orange-700 hover:bg-orange-50"
                      >
                        Marcar pago
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      )}

      {pagos.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-2 text-lg font-semibold text-gray-900">Histórico de pagos</h2>
          <Card>
            <ul className="divide-y divide-gray-100">
              {pagos.map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-3 py-2">
                  <div className="min-w-0 text-sm">
                    <p className="truncate font-medium text-gray-900">{e.diarista.nome}</p>
                    <p className="truncate text-gray-500">
                      {formatDateShort(e.data)} · {e.loja.nome} · {formatBRL(e.valor)}
                    </p>
                  </div>
                  <form action={desfazerPago}>
                    <input type="hidden" name="id" value={e.id} />
                    <button
                      type="submit"
                      className="shrink-0 text-xs text-gray-400 underline hover:text-gray-600"
                    >
                      desfazer
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}
    </div>
  );
}
