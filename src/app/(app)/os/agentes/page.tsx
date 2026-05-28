import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { garantirAgentes } from "@/lib/agentesDb";
import { Card, EmptyState, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AgentesListaPage() {
  await garantirAgentes();

  const agentes = await prisma.agente.findMany({
    orderBy: { nome: "asc" },
    include: { _count: { select: { execucoes: true } } },
  });

  return (
    <div className="space-y-4">
      <PageHeader title="Agentes" subtitle="Configure o System Prompt de cada Skill" />

      {agentes.length === 0 ? (
        <EmptyState>Nenhum agente cadastrado.</EmptyState>
      ) : (
        <Card className="p-0">
          <ul className="divide-y divide-gray-100">
            {agentes.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/os/agentes/${a.slug}`}
                  className="flex items-center justify-between gap-3 p-3 hover:bg-gray-50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900">
                      {a.nome}
                      {!a.ativo && (
                        <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                          inativo
                        </span>
                      )}
                    </p>
                    <p className="truncate text-xs text-gray-500">{a.descricao}</p>
                  </div>
                  <span className="shrink-0 text-xs text-gray-500">
                    {a._count.execucoes} execuç{a._count.execucoes === 1 ? "ão" : "ões"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div>
        <Link href="/os" className="text-sm text-gray-500 hover:underline">
          ← Dashboard
        </Link>
      </div>
    </div>
  );
}
