import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { EmptyState, PageHeader, btnDanger } from "@/components/ui";
import ConfirmSubmit from "@/components/ConfirmSubmit";
import { formatBRL, formatDateWithWeekday } from "@/lib/format";
import ClickMagicoBotao from "@/components/ClickMagicoBotao";
import { grupoDaLoja } from "@/lib/marcas";
import { corDaFuncao } from "@/lib/funcoesCor";
import { cancelarRequisicao, deleteRequisicao, reabrirRequisicao } from "./actions";

export const dynamic = "force-dynamic";

const STATUS = [
  { key: "ABERTA", label: "Abertas" },
  { key: "ATENDIDA", label: "Atendidas" },
  { key: "CANCELADA", label: "Canceladas" },
] as const;

function statusBadge(status: string) {
  if (status === "ABERTA")
    return "bg-amber-100 text-amber-700";
  if (status === "ATENDIDA")
    return "bg-green-100 text-green-700";
  return "bg-gray-100 text-gray-500";
}

export default async function RequisicoesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; erro?: string }>;
}) {
  const { status, erro } = await searchParams;
  const filtro = STATUS.find((s) => s.key === status)?.key ?? "ABERTA";

  const requisicoes = await prisma.requisicao.findMany({
    where: { status: filtro },
    include: { loja: true, _count: { select: { escalas: true } } },
    orderBy: { criadoEm: "desc" },
  });

  // Agrupa por marca (quadrantes).
  type ReqItem = (typeof requisicoes)[number];
  const grupos = new Map<string, { label: string; ordem: number; itens: ReqItem[] }>();
  for (const r of requisicoes) {
    const g = grupoDaLoja(r.loja.nome);
    const cur = grupos.get(g.key) ?? { label: g.label, ordem: g.ordem, itens: [] };
    cur.itens.push(r);
    grupos.set(g.key, cur);
  }
  const gruposOrdenados = [...grupos.values()].sort((a, b) => a.ordem - b.ordem);

  const chipBase = "rounded-full border px-3 py-1 text-sm font-medium whitespace-nowrap";
  const chipOn = "border-orange-700 bg-orange-700 text-white";
  const chipOff = "border-gray-300 bg-white text-gray-700 hover:bg-gray-50";

  return (
    <div>
      <PageHeader
        title="Requisições"
        subtitle="Pedidos de diaristas das lojas"
        action={{ href: "/requisicoes/nova", label: "+ Nova" }}
      />

      {erro === "duplicada" && (
        <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-medium text-amber-800">
          Já existe uma requisição igual em aberto (mesma data, horário e função).
        </div>
      )}

      <div className="mb-3">
        <ClickMagicoBotao />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {STATUS.map((s) => (
          <Link
            key={s.key}
            href={`/requisicoes?status=${s.key}`}
            className={`${chipBase} ${filtro === s.key ? chipOn : chipOff}`}
          >
            {s.label}
          </Link>
        ))}
      </div>

      {requisicoes.length === 0 ? (
        <EmptyState>
          {filtro === "ABERTA" ? (
            <>
              Nenhuma requisição aberta.
              <br />
              Toque em <strong>+ Nova</strong> para a loja pedir diaristas.
            </>
          ) : (
            <>Nenhuma requisição nesta situação.</>
          )}
        </EmptyState>
      ) : (
        <div className="space-y-5">
          {gruposOrdenados.map((grupo) => (
            <section key={grupo.label}>
              <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-500">
                {grupo.label} ({grupo.itens.length})
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {grupo.itens.map((r) => (
            <div
              key={r.id}
              className={`rounded-xl border p-4 shadow-sm ${corDaFuncao(r.funcao).card}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-gray-900">{r.loja.nome}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge(r.status)}`}>
                      {STATUS.find((s) => s.key === r.status)?.label ?? r.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm capitalize text-gray-600">
                    {formatDateWithWeekday(r.data)} · {r.horaInicio}–{r.horaFim}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    <strong>{r.quantidade}</strong> diarista(s)
                    {r.funcao ? <> · {r.funcao}</> : null} · {formatBRL(r.valorDiaria)}
                  </p>
                  {r._count.escalas > 0 && (
                    <p className="mt-1 text-sm text-orange-700">
                      {r._count.escalas} escalado(s)
                    </p>
                  )}
                  {r.observacoes && (
                    <p className="mt-1 text-sm text-gray-500">{r.observacoes}</p>
                  )}
                </div>
                {r.status === "ABERTA" && (
                  <Link
                    href={`/requisicoes/${r.id}`}
                    className="shrink-0 rounded-lg bg-orange-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-orange-800"
                  >
                    Fechar
                  </Link>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-2 border-t border-gray-100 pt-3">
                {r.status === "ABERTA" ? (
                  <form action={cancelarRequisicao}>
                    <input type="hidden" name="id" value={r.id} />
                    <button
                      type="submit"
                      className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                  </form>
                ) : (
                  <form action={reabrirRequisicao}>
                    <input type="hidden" name="id" value={r.id} />
                    <button
                      type="submit"
                      className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Reabrir
                    </button>
                  </form>
                )}
                <form action={deleteRequisicao}>
                  <input type="hidden" name="id" value={r.id} />
                  <ConfirmSubmit
                    className={btnDanger}
                    message="Excluir esta requisição? As escalas já criadas não são apagadas."
                  >
                    Excluir
                  </ConfirmSubmit>
                </form>
              </div>
            </div>
          ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
