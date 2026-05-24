import { prisma } from "@/lib/prisma";
import { Card, EmptyState, PageHeader, inputClass, labelClass, btnPrimary } from "@/components/ui";
import { createMembro, resetarSenhaMembro, toggleMembroAtivo } from "./actions";

export const dynamic = "force-dynamic";

export default async function EquipePage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;
  const membros = await prisma.membro.findMany({
    orderBy: [{ ativo: "desc" }, { perfil: "asc" }, { nome: "asc" }],
  });

  return (
    <div className="space-y-4">
      <PageHeader title="Equipe RH / TI" subtitle="Quem acessa a gestão" />

      <Card>
        <h2 className="font-semibold text-gray-900">Novo membro</h2>
        <p className="mt-1 text-xs text-gray-500">
          A pessoa cria a própria senha no primeiro acesso (tela de entrar → RH/TI → nome).
        </p>
        {erro === "usuario" && <p className="mt-1 text-sm text-red-600">Esse usuário já existe.</p>}
        <form action={createMembro} className="mt-3 space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="nome">
                Nome *
              </label>
              <input id="nome" name="nome" required className={inputClass} />
            </div>
            <div>
              <label className={labelClass} htmlFor="usuario">
                Usuário (login) *
              </label>
              <input
                id="usuario"
                name="usuario"
                required
                placeholder="ex.: maria"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <p className={labelClass}>Setor *</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { v: "rh", label: "RH" },
                { v: "ti", label: "TI" },
              ].map((o) => (
                <label key={o.v}>
                  <input type="radio" name="perfil" value={o.v} required className="peer sr-only" />
                  <span className="block cursor-pointer rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-center text-sm font-medium text-gray-700 peer-checked:border-orange-600 peer-checked:bg-orange-50 peer-checked:text-orange-800 peer-checked:ring-2 peer-checked:ring-orange-300">
                    {o.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className={labelClass} htmlFor="papel">
              Cargo (opcional)
            </label>
            <input
              id="papel"
              name="papel"
              placeholder="ex.: Coordenadora, Analista, Estagiária"
              className={inputClass}
            />
          </div>

          <button type="submit" className={btnPrimary}>
            Criar membro
          </button>
        </form>
      </Card>

      {membros.length === 0 ? (
        <EmptyState>Nenhum membro cadastrado ainda.</EmptyState>
      ) : (
        <div className="space-y-2">
          {membros.map((m) => (
            <Card key={m.id}>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-medium text-gray-900">
                    {m.nome}
                    <span className="rounded-full bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-700 uppercase">
                      {m.perfil}
                    </span>
                    {!m.ativo && (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                        inativo
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-gray-500">
                    usuário: <strong>{m.usuario}</strong>
                    {m.papel ? ` · ${m.papel}` : ""} ·{" "}
                    {m.senha ? "senha definida" : "aguardando 1º acesso"}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col gap-1.5">
                  <form action={toggleMembroAtivo}>
                    <input type="hidden" name="id" value={m.id} />
                    <button
                      type="submit"
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      {m.ativo ? "Desativar" : "Reativar"}
                    </button>
                  </form>
                  {m.senha && (
                    <form action={resetarSenhaMembro}>
                      <input type="hidden" name="id" value={m.id} />
                      <button
                        type="submit"
                        className="w-full rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-100"
                      >
                        Resetar senha
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
