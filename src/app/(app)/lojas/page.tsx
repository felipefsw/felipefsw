import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, EmptyState, PageHeader, btnDanger } from "@/components/ui";
import ConfirmSubmit from "@/components/ConfirmSubmit";
import { deleteLoja, toggleLojaAtivo } from "./actions";

export const dynamic = "force-dynamic";

export default async function LojasPage() {
  const lojas = await prisma.loja.findMany({
    orderBy: [{ ativo: "desc" }, { nome: "asc" }],
    include: { _count: { select: { escalas: true } } },
  });

  return (
    <div>
      <PageHeader
        title="Lojas"
        subtitle={`${lojas.filter((l) => l.ativo).length} ativa(s)`}
        action={{ href: "/lojas/nova", label: "+ Nova" }}
      />

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
                  {loja.endereco && (
                    <p className="text-sm text-gray-500">{loja.endereco}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-400">
                    {loja._count.escalas} agendamento(s)
                  </p>
                </div>
                <Link
                  href={`/lojas/${loja.id}`}
                  className="text-sm font-medium text-teal-700 hover:underline"
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
    </div>
  );
}
