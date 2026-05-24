import { prisma } from "@/lib/prisma";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import { aprovarSolicitacao, recusarSolicitacao } from "./actions";

export const dynamic = "force-dynamic";

export default async function SolicitacoesPage() {
  const pendentes = await prisma.gestor.findMany({
    where: { aprovado: false },
    orderBy: { criadoEm: "desc" },
    include: { lojas: { select: { nome: true }, orderBy: { nome: "asc" } } },
  });

  return (
    <div className="space-y-4">
      <PageHeader title="Pedidos de acesso" subtitle="Autocadastros de lojista/gestor a aprovar" />

      {pendentes.length === 0 ? (
        <EmptyState>Nenhum pedido pendente.</EmptyState>
      ) : (
        <div className="space-y-3">
          {pendentes.map((g) => (
            <Card key={g.id}>
              <p className="font-medium text-gray-900">{g.nome}</p>
              {g.telefone && <p className="text-sm text-gray-500">WhatsApp: {g.telefone}</p>}
              <p className="mt-1 text-sm text-gray-600">
                Lojas pedidas:{" "}
                <span className="text-gray-800">
                  {g.lojas.map((l) => l.nome).join(", ") || "—"}
                </span>
              </p>
              <div className="mt-3 flex gap-2 border-t border-gray-100 pt-3">
                <form action={aprovarSolicitacao}>
                  <input type="hidden" name="id" value={g.id} />
                  <button
                    type="submit"
                    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                  >
                    Aprovar
                  </button>
                </form>
                <form action={recusarSolicitacao}>
                  <input type="hidden" name="id" value={g.id} />
                  <button
                    type="submit"
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                  >
                    Recusar
                  </button>
                </form>
              </div>
              <p className="mt-2 text-xs text-gray-400">
                Ao aprovar, o link de acesso aparece em <strong>Gestores</strong> para você enviar no
                WhatsApp.
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
