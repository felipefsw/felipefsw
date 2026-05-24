import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, EmptyState, PageHeader, btnDanger, inputClass } from "@/components/ui";
import ConfirmSubmit from "@/components/ConfirmSubmit";
import { deleteLoja, toggleLojaAtivo } from "./actions";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

export default async function LojasPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);

  const where = q
    ? {
        OR: [
          { nome: { contains: q, mode: "insensitive" as const } },
          { cidade: { contains: q, mode: "insensitive" as const } },
          { bairro: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [total, lojas] = await Promise.all([
    prisma.loja.count({ where }),
    prisma.loja.findMany({
      where,
      orderBy: [{ ativo: "desc" }, { nome: "asc" }],
      include: { _count: { select: { escalas: true } } },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);
  const totalPaginas = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageQs = (n: number) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    p.set("page", String(n));
    return `/lojas?${p.toString()}`;
  };

  return (
    <div>
      <PageHeader
        title="Lojas"
        subtitle={`${total} resultado(s)`}
        action={{ href: "/lojas/nova", label: "+ Nova" }}
      />

      <div className="mb-3">
        <Link href="/gestores" className="text-sm font-medium text-orange-700 hover:underline">
          Gerenciar gestores →
        </Link>
      </div>

      <form method="get" className="mb-4 flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar por nome, bairro ou cidade…"
          className={inputClass}
        />
        <button
          type="submit"
          className="shrink-0 rounded-lg bg-orange-700 px-4 py-2 text-sm font-medium text-white hover:bg-orange-800"
        >
          Buscar
        </button>
      </form>

      {lojas.length === 0 ? (
        <EmptyState>
          Nenhuma loja cadastrada ainda.
          <br />
          Toque em <strong>+ Nova</strong> para cadastrar a primeira.
        </EmptyState>
      ) : (
        <div className="space-y-3">
          {lojas.map((loja) => (
            <Card key={loja.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{loja.nome}</span>
                    {!loja.ativo && (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                        inativa
                      </span>
                    )}
                  </div>
                  {(loja.bairro || loja.cidade) && (
                    <p className="text-sm text-gray-500">
                      {[loja.bairro, loja.cidade].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  {loja.cnpj && (
                    <p className="text-sm text-gray-500">CNPJ: {loja.cnpj}</p>
                  )}
                  {loja.endereco && (
                    <p className="text-sm text-gray-500">{loja.endereco}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-400">
                    {loja._count.escalas} agendamento(s)
                  </p>
                </div>
                <Link
                  href={`/lojas/${loja.id}`}
                  className="text-sm font-medium text-orange-700 hover:underline"
                >
                  Editar
                </Link>
              </div>

              <div className="mt-3 flex flex-wrap gap-2 border-t border-gray-100 pt-3">
                <form action={toggleLojaAtivo}>
                  <input type="hidden" name="id" value={loja.id} />
                  <button
                    type="submit"
                    className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    {loja.ativo ? "Desativar" : "Reativar"}
                  </button>
                </form>
                <form action={deleteLoja}>
                  <input type="hidden" name="id" value={loja.id} />
                  <ConfirmSubmit
                    className={btnDanger}
                    message={`Excluir "${loja.nome}"? Os agendamentos dessa loja também serão apagados.`}
                  >
                    Excluir
                  </ConfirmSubmit>
                </form>
              </div>
            </Card>
          ))}
        </div>
      )}

      {totalPaginas > 1 && (
        <div className="mt-4 flex items-center justify-between gap-2">
          {page > 1 ? (
            <Link
              href={pageQs(page - 1)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              ← Anterior
            </Link>
          ) : (
            <span />
          )}
          <span className="text-sm text-gray-500">
            Página {page} de {totalPaginas}
          </span>
          {page < totalPaginas ? (
            <Link
              href={pageQs(page + 1)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Próxima →
            </Link>
          ) : (
            <span />
          )}
        </div>
      )}
    </div>
  );
}
