import { prisma } from "@/lib/prisma";
import { definirSenhaPorToken } from "./actions";

export const dynamic = "force-dynamic";

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 outline-none focus:border-orange-600 focus:ring-2 focus:ring-orange-100";

export default async function DefinirSenhaPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ erro?: string }>;
}) {
  const { token } = await params;
  const { erro } = await searchParams;

  // Descobre de quem é o link (loja, gestor ou membro).
  const [loja, gestor, membro] = await Promise.all([
    prisma.loja.findUnique({ where: { tokenSenha: token }, select: { nome: true } }),
    prisma.gestor.findUnique({ where: { tokenSenha: token }, select: { nome: true } }),
    prisma.membro.findUnique({ where: { tokenSenha: token }, select: { nome: true } }),
  ]);
  const alvo = loja ?? gestor ?? membro;

  if (!alvo) {
    return (
      <div className="mx-auto max-w-md p-6 text-center">
        <h1 className="mt-10 text-xl font-bold text-gray-900">Link inválido</h1>
        <p className="mt-2 text-gray-500">
          Este link de acesso já foi usado ou expirou. Peça um novo ao RH.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md">
      <header className="bg-neutral-900 px-5 py-6 text-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/rwp-logo.svg" alt="RWP" className="mb-3 h-7 w-auto" />
        <h1 className="text-xl font-bold">Criar sua senha</h1>
        <p className="mt-1 text-sm text-orange-100">{alvo.nome}</p>
      </header>

      <main className="p-5">
        {erro === "senha" && (
          <p className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
            A senha precisa de 6+ caracteres e as duas têm que ser iguais.
          </p>
        )}
        <form action={definirSenhaPorToken} className="space-y-3">
          <input type="hidden" name="token" value={token} />
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="senha">
              Nova senha
            </label>
            <input
              id="senha"
              name="senha"
              type="password"
              required
              minLength={6}
              placeholder="mínimo 6 caracteres"
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="confirmarSenha">
              Repita a senha
            </label>
            <input
              id="confirmarSenha"
              name="confirmarSenha"
              type="password"
              required
              minLength={6}
              className={inputClass}
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-orange-700 py-2.5 font-medium text-white hover:bg-orange-800"
          >
            Salvar senha e entrar
          </button>
        </form>
      </main>
    </div>
  );
}
