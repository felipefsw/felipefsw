import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { garantirAgentes } from "@/lib/agentesDb";
import { Card, EmptyState, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

const STATUS_BADGE: Record<string, string> = {
  PENDENTE: "bg-amber-100 text-amber-700",
  PROCESSANDO: "bg-blue-100 text-blue-700",
  CONCLUIDA: "bg-green-100 text-green-700",
  ERRO: "bg-red-100 text-red-700",
};

function formatHora(d: Date) {
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function OsHomePage() {
  await garantirAgentes();

  const [agentes, execucoesRecentes] = await Promise.all([
    prisma.agente.findMany({
      where: { ativo: true },
      orderBy: { nome: "asc" },
    }),
    prisma.execAgente.findMany({
      orderBy: { criadoEm: "desc" },
      take: 8,
      include: {
        agente: { select: { nome: true, slug: true } },
        loja: { select: { nome: true } },
      },
    }),
  ]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="RWP Master OS"
        subtitle="Hub de agentes de IA para a rede de pizzarias"
      />

      <section>
        <h2 className="mb-2 text-lg font-semibold text-gray-900">Skills (Ações)</h2>
        <div className="grid gap-3">
          <Link
            href="/os/auditoria"
            className="rounded-xl border border-orange-200 bg-orange-50 p-4 hover:bg-orange-100"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-orange-900">
                  💰 Auditoria Financeira (Saipos)
                </p>
                <p className="mt-0.5 text-xs text-orange-800">
                  Cole o relatório bruto do Saipos e receba a auditoria de fechamento + acerto de
                  motoboys. Tolerância R$ 2,00.
                </p>
              </div>
              <span className="shrink-0 rounded-lg bg-orange-700 px-3 py-1.5 text-xs font-semibold text-white">
                Executar
              </span>
            </div>
          </Link>
        </div>
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Agentes ({agentes.length})</h2>
          <Link href="/os/agentes" className="text-sm font-medium text-orange-700 hover:underline">
            Gerenciar
          </Link>
        </div>
        {agentes.length === 0 ? (
          <EmptyState>Nenhum agente cadastrado.</EmptyState>
        ) : (
          <Card className="p-0">
            <ul className="divide-y divide-gray-100">
              {agentes.map((a) => (
                <li key={a.id} className="p-3">
                  <Link
                    href={`/os/agentes/${a.slug}`}
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900">{a.nome}</p>
                      <p className="truncate text-xs text-gray-500">{a.descricao}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 font-mono text-[10px] text-gray-600">
                      {a.modelo}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold text-gray-900">
          Execuções recentes ({execucoesRecentes.length})
        </h2>
        {execucoesRecentes.length === 0 ? (
          <EmptyState>Nenhuma execução ainda. Rode a primeira auditoria.</EmptyState>
        ) : (
          <Card className="p-0">
            <ul className="divide-y divide-gray-100">
              {execucoesRecentes.map((e) => (
                <li key={e.id} className="p-3">
                  <Link
                    href={`/os/auditoria/${e.id}`}
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {e.titulo || e.agente.nome}
                      </p>
                      <p className="truncate text-xs text-gray-500">
                        {e.agente.nome}
                        {e.loja ? ` · ${e.loja.nome}` : ""} · {formatHora(e.criadoEm)}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_BADGE[e.status] ?? "bg-gray-100 text-gray-700"}`}
                    >
                      {e.status}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </section>
    </div>
  );
}
