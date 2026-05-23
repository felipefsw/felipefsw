import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, EmptyState, PageHeader, btnDanger } from "@/components/ui";
import ConfirmSubmit from "@/components/ConfirmSubmit";
import { formatDateWithWeekday } from "@/lib/format";
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
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const filtro = STATUS.find((s) => s.key === status)?.key ?? "ABERTA";

  const requisicoes = await prisma.requisicao.findMany({
    where: { status: filtro },
    include: { loja: true, _count: { select: { escalas: true } } },
    orderBy: [{ data: "asc" }, { criadoEm: "desc" }],
  });

  const chipBase = "rounded-full border px-3 py-1 text-sm font-medium whitespace-nowrap";
  const chipOn = "border-teal-700 bg-teal-700 text-white";
  const chipOff = "border-gray-300 bg-white text-gray-700 hover:bg-gray-50";

  return (
    <div>
      <PageHeader
        title="Requisições"
        subtitle="Pedidos de diaristas das lojas"
        action={{ href: "/requisicoes/nova", label: "+ Nova" }}
      />

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
        <div className="space-y-3">
          {requisicoes.map((r) => (
            <Card key={r.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-gray-900">{r.loja.nome}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge(r.status)}`}>
                      {STATUS.find((s) => s.key === r.status)?.label ?? r.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm capitalize text-gray-600">
                    {formatDateWithWeekday(r.data)}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    <strong>{r.quantidade}</strong> diarista(s)
                    {r.funcao ? <> · {r.funcao}</> : null}
                  </p>
                  {r._count.escalas > 0 && (
                    <p className="mt-1 text-sm text-teal-700">
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
                    className="shrink-0 rounded-lg bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800"
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
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
