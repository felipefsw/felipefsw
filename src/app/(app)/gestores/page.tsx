import { prisma } from "@/lib/prisma";
import { Card, EmptyState, PageHeader, inputClass, labelClass, btnPrimary } from "@/components/ui";
import { atribuirLojasAoGestor, createGestor, toggleGestorAtivo } from "./actions";

export const dynamic = "force-dynamic";

export default async function GestoresPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;
  const [gestores, lojas] = await Promise.all([
    prisma.gestor.findMany({
      orderBy: [{ ativo: "desc" }, { nome: "asc" }],
      include: { _count: { select: { lojas: true } } },
    }),
    prisma.loja.findMany({
      orderBy: { nome: "asc" },
      select: { id: true, nome: true, gestores: { select: { id: true } } },
    }),
  ]);

  return (
    <div className="space-y-4">
      <PageHeader title="Gestores" subtitle="Quem administra as lojas" />

      <Card>
        <h2 className="font-semibold text-gray-900">Novo gestor</h2>
        {erro === "usuario" && (
          <p className="mt-1 text-sm text-red-600">Esse usuário já existe.</p>
        )}
        {erro === "lojas" && (
          <p className="mt-1 text-sm text-red-600">
            Selecione pelo menos uma loja para o gestor.
          </p>
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

          <div>
            <p className={labelClass}>Lojas deste gestor * (marque ao menos uma)</p>
            {lojas.length === 0 ? (
              <p className="text-xs text-gray-400">Cadastre lojas antes de criar gestores.</p>
            ) : (
              <div className="grid grid-cols-2 gap-1">
                {lojas.map((l) => (
                  <label
                    key={l.id}
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      name="lojaIds"
                      value={l.id}
                      className="h-4 w-4 rounded border-gray-300 text-orange-700 focus:ring-orange-600"
                    />
                    <span className="truncate text-gray-700">{l.nome}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <button type="submit" className={btnPrimary}>
            Criar gestor
          </button>
        </form>
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

              <details className="mt-3 border-t border-gray-100 pt-3">
                <summary className="cursor-pointer text-sm font-medium text-orange-700">
                  Lojas deste gestor
                </summary>
                <form action={atribuirLojasAoGestor} className="mt-2">
                  <input type="hidden" name="gestorId" value={g.id} />
                  <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                    {lojas.map((l) => (
                      <label
                        key={l.id}
                        className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          name="lojaIds"
                          value={l.id}
                          defaultChecked={l.gestores.some((x) => x.id === g.id)}
                          className="h-4 w-4 rounded border-gray-300 text-orange-700 focus:ring-orange-600"
                        />
                        <span className="min-w-0 truncate text-gray-700">{l.nome}</span>
                      </label>
                    ))}
                  </div>
                  <button
                    type="submit"
                    className="mt-2 rounded-lg bg-orange-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-orange-800"
                  >
                    Salvar lojas deste gestor
                  </button>
                </form>
              </details>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
