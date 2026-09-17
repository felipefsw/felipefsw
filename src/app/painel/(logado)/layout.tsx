import Link from "next/link";
import { sessionSecretInseguro } from "@/lib/auth";
import { NOME_DO_PAPEL } from "@/lib/painel/papeis";
import { contextoPainel } from "@/lib/painel/sessao";
import { lojasDoAcesso, podeEditar } from "@/lib/painel/papeis";
import { sairDoPainel } from "../entrar/actions";

export const dynamic = "force-dynamic";

export default async function PainelLogadoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await contextoPainel();
  const lojas = await lojasDoAcesso(ctx.acesso);
  const ehAdmin = podeEditar(ctx.acesso, ctx.storeId, "usuarios");
  const podeEnviar = podeEditar(ctx.acesso, ctx.storeId, "operacao");

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col">
      <header className="sticky top-0 z-10 border-b border-[var(--painel-borda)] bg-[var(--painel-superficie)]">
        <div className="flex items-center justify-between gap-2 px-4 py-3">
          <Link href="/painel" className="min-w-0">
            <span className="block truncate text-lg font-bold leading-tight">
              {ctx.lojaNome}
            </span>
            <span className="block text-xs text-[var(--painel-texto-fraco)]">
              Painel do Gestor
            </span>
          </Link>

          <div className="flex shrink-0 items-center gap-2">
            <span className="rounded-full bg-[var(--painel-laranja)] px-2 py-0.5 text-xs font-semibold text-white">
              {NOME_DO_PAPEL[ctx.papel]}
            </span>
            {lojas.length > 1 ? (
              <Link
                href="/painel/trocar-loja"
                className="text-xs font-medium text-[var(--painel-dourado)] underline"
              >
                Trocar loja
              </Link>
            ) : null}
            {ehAdmin ? (
              <Link href="/painel/admin" className="text-xs font-medium underline">
                Admin
              </Link>
            ) : null}
            <form action={sairDoPainel}>
              <button type="submit" className="text-xs font-medium underline">
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>

      <nav className="flex gap-1 overflow-x-auto border-b border-[var(--painel-borda)] px-4 py-2 text-sm">
        <Link href="/painel" className="shrink-0 rounded-lg px-2 py-1 hover:bg-white/5">
          Início
        </Link>
        {podeEnviar ? (
          <Link href="/painel/enviar" className="shrink-0 rounded-lg px-2 py-1 hover:bg-white/5">
            Enviar
          </Link>
        ) : null}
        <Link href="/painel/vendas" className="shrink-0 rounded-lg px-2 py-1 hover:bg-white/5">
          Vendas 360
        </Link>
      </nav>

      {sessionSecretInseguro() ? (
        <div className="border-b border-[var(--painel-vermelho)]/40 bg-[var(--painel-vermelho)]/10 px-4 py-2 text-xs font-medium text-[var(--painel-vermelho)]">
          ⚠️ Defina a variável <strong>SESSION_SECRET</strong> na Vercel (um texto
          longo e aleatório) e faça um novo deploy. Sem ela, dá para forjar uma sessão.
        </div>
      ) : null}

      <main className="flex-1 px-4 pb-16 pt-4">{children}</main>

      <footer className="px-4 pb-6 text-center text-xs text-[var(--painel-texto-fraco)]">
        {ctx.nome} · {ctx.lojaNome}
      </footer>
    </div>
  );
}
