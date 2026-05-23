import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, EmptyState, PageHeader, btnDanger } from "@/components/ui";
import ConfirmSubmit from "@/components/ConfirmSubmit";
import { formatBRL } from "@/lib/format";
import { deleteDiarista, toggleDiaristaAtivo } from "./actions";

export const dynamic = "force-dynamic";

export default async function DiaristasPage() {
  const diaristas = await prisma.diarista.findMany({
    orderBy: [{ ativo: "desc" }, { nome: "asc" }],
  });

  return (
    <div>
      <PageHeader
        title="Diaristas"
        subtitle={`${diaristas.filter((d) => d.ativo).length} ativa(s)`}
        action={{ href: "/diaristas/nova", label: "+ Nova" }}
      />

      {diaristas.length === 0 ? (
        <EmptyState>
          Nenhuma diarista cadastrada ainda.
          <br />
          Toque em <strong>+ Nova</strong> para começar.
        </EmptyState>
      ) : (
        <div className="space-y-3">
          {diaristas.map((d) => (
            <Card key={d.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{d.nome}</span>
                    {!d.ativo && (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                        inativa
                      </span>
                    )}
                  </div>
                  {d.telefone && <p className="text-sm text-gray-500">{d.telefone}</p>}
                  <p className="mt-1 text-sm text-gray-600">
                    Diária: <strong>{formatBRL(d.valorDiaria)}</strong>
                  </p>
                </div>
                <Link
                  href={`/diaristas/${d.id}`}
                  className="text-sm font-medium text-teal-700 hover:underline"
                >
                  Editar
                </Link>
              </div>

              <div className="mt-3 flex flex-wrap gap-2 border-t border-gray-100 pt-3">
                <form action={toggleDiaristaAtivo}>
                  <input type="hidden" name="id" value={d.id} />
                  <button
                    type="submit"
                    className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    {d.ativo ? "Desativar" : "Reativar"}
                  </button>
                </form>
                <form action={deleteDiarista}>
                  <input type="hidden" name="id" value={d.id} />
                  <ConfirmSubmit
                    className={btnDanger}
                    message={`Excluir "${d.nome}"? O histórico de agendamentos dessa pessoa também será apagado.`}
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
