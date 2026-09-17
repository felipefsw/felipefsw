import { redirect } from "next/navigation";
import { getSessao } from "@/lib/auth";
import { CardPainel, ErroPainel, botaoPrimario, inputPainel, labelPainel } from "@/components/painel/ui";
import { entrarNoPainel } from "./actions";

export const dynamic = "force-dynamic";

export default async function EntrarNoPainelPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;
  const sessao = await getSessao();
  if (sessao?.tipo === "painel") redirect("/painel");

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4 py-10">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold">Painel do Gestor</h1>
        <p className="text-sm text-[var(--painel-texto-fraco)]">
          Pizza Pizza · We Love Pizza · Rei da Pizza
        </p>
      </div>

      <CardPainel>
        <form action={entrarNoPainel} className="space-y-3">
          <div>
            <label className={labelPainel} htmlFor="email">
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              required
              className={inputPainel}
              placeholder="voce@exemplo.com"
            />
          </div>
          <div>
            <label className={labelPainel} htmlFor="senha">
              Senha
            </label>
            <input
              id="senha"
              name="senha"
              type="password"
              autoComplete="current-password"
              required
              className={inputPainel}
            />
          </div>

          {erro === "login" ? <ErroPainel>E-mail ou senha não conferem.</ErroPainel> : null}

          <button type="submit" className={`${botaoPrimario} w-full`}>
            Entrar
          </button>
        </form>
      </CardPainel>

      <p className="mt-4 text-center text-xs text-[var(--painel-texto-fraco)]">
        Esqueceu a senha? Peça para o administrador da rede gerar uma nova em
        Admin › Usuários.
      </p>
    </main>
  );
}
