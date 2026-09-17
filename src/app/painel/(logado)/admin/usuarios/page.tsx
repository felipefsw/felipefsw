import {
  CabecalhoPainel,
  CardPainel,
  ErroPainel,
  botaoPrimario,
  botaoSecundario,
  inputPainel,
  labelPainel,
  superficie,
} from "@/components/painel/ui";
import { prisma } from "@/lib/prisma";
import { NOME_DO_PAPEL, PAPEIS, exigeEditar } from "@/lib/painel/papeis";
import { contextoPainel } from "@/lib/painel/sessao";
import { alternarAtivo, criarUsuario, darAcesso, tirarAcesso, trocarSenha } from "./actions";

export const dynamic = "force-dynamic";

const ERROS: Record<string, string> = {
  dados: "Faltou preencher alguma coisa.",
  senha: "A senha precisa ter pelo menos 6 caracteres.",
  email: "Já existe um usuário com esse e-mail.",
  voce_mesmo: "Você não pode desativar o seu próprio usuário.",
};

const AVISOS: Record<string, string> = {
  criado: "Usuário criado.",
  acesso: "Acesso atualizado.",
  ativo: "Situação do usuário atualizada.",
  senha: "Senha trocada.",
};

export default async function UsuariosPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; ok?: string }>;
}) {
  const { erro, ok } = await searchParams;
  const ctx = await contextoPainel();
  exigeEditar(ctx.acesso, ctx.storeId, "usuarios");

  const [usuarios, lojas] = await Promise.all([
    prisma.profile.findMany({
      orderBy: [{ active: "desc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        email: true,
        active: true,
        memberships: {
          select: { storeId: true, role: true, store: { select: { name: true, shortName: true } } },
          orderBy: { store: { name: "asc" } },
        },
      },
    }),
    prisma.store.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, shortName: true },
    }),
  ]);

  return (
    <>
      <CabecalhoPainel
        titulo="Usuários e acessos"
        subtitulo="O papel vale por loja. Administrador da rede e CD enxergam todas as lojas."
      />

      {erro ? <ErroPainel>{ERROS[erro] ?? "Não deu certo."}</ErroPainel> : null}
      {ok ? (
        <div className="rounded-lg border border-[var(--painel-verde)]/40 bg-[var(--painel-verde)]/10 px-3 py-2 text-sm text-[var(--painel-verde)]">
          {AVISOS[ok] ?? "Pronto."}
        </div>
      ) : null}

      <CardPainel className="mt-3">
        <h2 className="mb-3 font-bold">Novo usuário</h2>
        <form action={criarUsuario} className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={labelPainel} htmlFor="name">Nome</label>
            <input id="name" name="name" required className={inputPainel} />
          </div>
          <div>
            <label className={labelPainel} htmlFor="email">E-mail (é o login)</label>
            <input id="email" name="email" type="email" required className={inputPainel} />
          </div>
          <div>
            <label className={labelPainel} htmlFor="phone">WhatsApp (opcional)</label>
            <input id="phone" name="phone" className={inputPainel} />
          </div>
          <div>
            <label className={labelPainel} htmlFor="senha">Senha provisória</label>
            <input id="senha" name="senha" required minLength={6} className={inputPainel} />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className={botaoPrimario}>Criar usuário</button>
          </div>
        </form>
      </CardPainel>

      <h2 className="mb-2 mt-6 text-lg font-bold">{usuarios.length} usuários</h2>
      <ul className="space-y-3">
        {usuarios.map((u) => (
          <li key={u.id} className={`${superficie} p-4`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-semibold">
                  {u.name}
                  {!u.active ? (
                    <span className="ml-2 text-xs font-normal text-[var(--painel-vermelho)]">
                      desativado
                    </span>
                  ) : null}
                </p>
                <p className="truncate text-sm text-[var(--painel-texto-fraco)]">{u.email}</p>
              </div>
              {u.id !== ctx.userId ? (
                <form action={alternarAtivo}>
                  <input type="hidden" name="userId" value={u.id} />
                  <button type="submit" className="shrink-0 text-xs underline">
                    {u.active ? "Desativar" : "Reativar"}
                  </button>
                </form>
              ) : null}
            </div>

            {u.memberships.length > 0 ? (
              <ul className="mt-3 space-y-1">
                {u.memberships.map((m) => (
                  <li key={m.storeId} className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate">
                      {m.store.shortName ?? m.store.name} ·{" "}
                      <span className="text-[var(--painel-dourado)]">{NOME_DO_PAPEL[m.role]}</span>
                    </span>
                    <form action={tirarAcesso}>
                      <input type="hidden" name="userId" value={u.id} />
                      <input type="hidden" name="storeId" value={m.storeId} />
                      <button type="submit" className="shrink-0 text-xs underline">tirar</button>
                    </form>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-[var(--painel-texto-fraco)]">
                Sem acesso a nenhuma loja ainda.
              </p>
            )}

            <form action={darAcesso} className="mt-3 flex flex-wrap items-end gap-2">
              <input type="hidden" name="userId" value={u.id} />
              <div className="min-w-[10rem] flex-1">
                <label className={labelPainel}>Loja</label>
                <select name="storeId" className={inputPainel} required>
                  {lojas.map((l) => (
                    <option key={l.id} value={l.id}>{l.shortName ?? l.name}</option>
                  ))}
                </select>
              </div>
              <div className="min-w-[10rem] flex-1">
                <label className={labelPainel}>Papel</label>
                <select name="role" className={inputPainel} required>
                  {PAPEIS.map((p) => (
                    <option key={p} value={p}>{NOME_DO_PAPEL[p]}</option>
                  ))}
                </select>
              </div>
              <button type="submit" className={botaoSecundario}>Dar acesso</button>
            </form>

            <form action={trocarSenha} className="mt-2 flex flex-wrap items-end gap-2">
              <input type="hidden" name="userId" value={u.id} />
              <div className="min-w-[12rem] flex-1">
                <label className={labelPainel}>Nova senha</label>
                <input name="senha" minLength={6} required className={inputPainel} />
              </div>
              <button type="submit" className={botaoSecundario}>Trocar senha</button>
            </form>
          </li>
        ))}
      </ul>
    </>
  );
}
