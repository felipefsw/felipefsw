import { prisma } from "@/lib/prisma";
import { Card, EmptyState, PageHeader, inputClass, labelClass, btnPrimary } from "@/components/ui";
import { createGestor, toggleGestorAtivo } from "./actions";

export const dynamic = "force-dynamic";

export default async function GestoresPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;
  const gestores = await prisma.gestor.findMany({
    orderBy: [{ ativo: "desc" }, { nome: "asc" }],
    include: { _count: { select: { lojas: true } } },
  });

  return (
    <div className="space-y-4">
      <PageHeader title="Gestores" subtitle="Quem administra as lojas" />

      <Card>
        <h2 className="font-semibold text-gray-900">Novo gestor</h2>
        {erro === "usuario" && (
          <p className="mt-1 text-sm text-red-600">Esse usuário já existe.</p>
        )}
        <form action={createGestor} className="mt-3 space-y-3">
          <div>
            <label className={labelClass} htmlFor="nome">
              Nome *
            </label>
            <input id="nome" name="nome" required className={inputClass} />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="usuario">
                Usuário (login) *
              </label>
              <input id="usuario" name="usuario" required placeholder="ex.: gestor1" className={inputClass} />
            </div>
            <div>
              <label className={labelClass} htmlFor="senha">
                Senha
              </label>
              <input id="senha" name="senha" placeholder="padrão 123456" className={inputClass} />
            </div>
          </div>
          <button type="submit" className={btnPrimary}>
            Criar gestor
          </button>
        </form>
        <p className="mt-2 text-xs text-gray-400">
          Depois, associe as lojas a este gestor no cadastro de cada loja (campo Gestor).
        </p>
      </Card>

      {gestores.length === 0 ? (
        <EmptyState>Nenhum gestor cadastrado ainda.</EmptyState>
      ) : (
        <div className="space-y-2">
          {gestores.map((g) => (
            <Card key={g.id}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="flex items-center gap-2 font-medium text-gray-900">
                    {g.nome}
                    {!g.ativo && (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                        inativo
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-gray-500">
                    usuário: <strong>{g.usuario}</strong> · {g._count.lojas} loja(s)
                  </p>
                </div>
                <form action={toggleGestorAtivo}>
                  <input type="hidden" name="id" value={g.id} />
                  <button
                    type="submit"
                    className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    {g.ativo ? "Desativar" : "Reativar"}
                  </button>
                </form>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
