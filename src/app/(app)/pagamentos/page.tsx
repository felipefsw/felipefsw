import { prisma } from "@/lib/prisma";
import { Card, EmptyState } from "@/components/ui";
import CopyButton from "@/components/CopyButton";
import { formatBRL, formatDateShort } from "@/lib/format";
import { togglePago } from "./actions";

export const dynamic = "force-dynamic";

export default async function PagamentosPage() {
  // Mostra as diárias a pagar e as pagas recentemente (para o botão alternar no lugar).
  const corte = new Date();
  corte.setDate(corte.getDate() - 14);
  const diarias = await prisma.escala.findMany({
    where: {
      presenca: "PRESENTE",
      OR: [{ pago: false }, { pago: true, pagoEm: { gte: corte } }],
    },
    include: {
      diarista: { select: { nome: true, chavePix: true } },
      loja: { select: { id: true, nome: true } },
    },
    orderBy: [{ pago: "asc" }, { data: "asc" }],
  });

  // Agrupa por loja.
  type Item = (typeof diarias)[number];
  type GrupoLoja = { nome: string; aPagar: number; itens: Item[] };
  const porLoja = new Map<string, GrupoLoja>();
  for (const e of diarias) {
    const g = porLoja.get(e.loja.id) ?? { nome: e.loja.nome, aPagar: 0, itens: [] };
    if (!e.pago) g.aPagar += e.valor;
    g.itens.push(e);
    porLoja.set(e.loja.id, g);
  }
  const lojas = [...porLoja.values()].sort((a, b) => a.nome.localeCompare(b.nome));
  const lojasComPendencia = lojas.filter((l) => l.aPagar > 0);

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-gray-900">Pagamentos</h1>
      <p className="mb-3 text-sm text-gray-500">
        Diárias de quem trabalhou. Toque no botão para marcar pago (verde) ou não pago (vermelho).
      </p>

      {/* Resumo fino: total a pagar por loja */}
      {lojasComPendencia.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-x-3 gap-y-1 border-y border-gray-100 py-2 text-xs text-gray-600">
          {lojasComPendencia.map((l) => (
            <span key={l.nome}>
              <span className="font-medium text-gray-800">{l.nome}</span>:{" "}
              <span className="font-semibold text-orange-700">{formatBRL(l.aPagar)}</span>
            </span>
          ))}
        </div>
      )}

      {diarias.length === 0 ? (
        <EmptyState>Tudo em dia! Não há diárias pendentes de pagamento.</EmptyState>
      ) : (
        <div className="space-y-4">
          {lojas.map((l) => (
            <section key={l.nome}>
              <h2 className="mb-1 flex items-center justify-between text-sm font-bold uppercase tracking-wide text-gray-500">
                <span>{l.nome}</span>
                {l.aPagar > 0 && <span className="text-orange-700">{formatBRL(l.aPagar)}</span>}
              </h2>
              <Card className="p-2">
                <ul className="divide-y divide-gray-100">
                  {l.itens.map((e) => (
                    <li key={e.id} className="flex items-center justify-between gap-2 py-1.5">
                      <div className="min-w-0 text-sm">
                        <span className="font-medium text-gray-900">{e.diarista.nome}</span>
                        <span className="text-gray-500">
                          {" · "}
                          {formatDateShort(e.data)} · {formatBRL(e.valor)}
                        </span>
                        {e.diarista.chavePix && (
                          <CopyButton
                            text={e.diarista.chavePix}
                            label="Pix"
                            className="ml-2 rounded border border-gray-300 bg-white px-1.5 py-0.5 text-[11px] font-medium text-gray-600"
                          />
                        )}
                      </div>
                      <form action={togglePago} className="shrink-0">
                        <input type="hidden" name="id" value={e.id} />
                        <button
                          type="submit"
                          className={
                            e.pago
                              ? "rounded-lg bg-green-600 px-3 py-1 text-xs font-semibold text-white hover:bg-green-700"
                              : "rounded-lg border border-red-300 bg-white px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                          }
                        >
                          {e.pago ? "✓ Pago" : "Marcar pago"}
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>
              </Card>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
