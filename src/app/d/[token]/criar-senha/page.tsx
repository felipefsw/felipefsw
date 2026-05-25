import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { acessoSemSenha, getSessao } from "@/lib/auth";
import { definirSenhaDiarista } from "../actions";

export const dynamic = "force-dynamic";

export default async function CriarSenhaPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ erro?: string }>;
}) {
  const { token } = await params;
  const { erro } = await searchParams;

  const diarista = await prisma.diarista.findUnique({
    where: { token },
    select: { nome: true, senha: true, id: true },
  });
  if (!diarista) notFound();

  // Se já tem senha (ou está no modo de teste com sessão), não precisa criar.
  const sessao = await getSessao();
  const sessaoDoDiarista = sessao?.tipo === "diarista" && sessao.diaristaId === diarista.id;
  if (diarista.senha || (acessoSemSenha() && sessaoDoDiarista)) {
    redirect(`/d/${token}`);
  }

  return (
    <div className="mx-auto max-w-md">
      <header className="bg-neutral-900 px-5 py-6 text-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/rwp-logo.svg" alt="RWP" className="mb-3 h-7 w-auto" />
        <h1 className="text-xl font-bold">Primeiro acesso</h1>
        <p className="mt-1 text-sm text-orange-100">
          Olá, {diarista.nome.split(" ")[0]}! Crie uma senha para acessar sua agenda.
        </p>
      </header>
      <main className="p-5">
        {erro === "senha" && (
          <p className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
            As senhas não conferem ou têm menos de 6 caracteres.
          </p>
        )}
        <form action={definirSenhaDiarista} className="space-y-3">
          <input type="hidden" name="token" value={token} />
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="senha">
              Crie uma senha
            </label>
            <input
              id="senha"
              name="senha"
              type="password"
              required
              minLength={6}
              placeholder="mínimo 6 caracteres"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 outline-none focus:border-orange-600 focus:ring-2 focus:ring-orange-100"
            />
          </div>
          <div>
            <label
              className="mb-1 block text-sm font-medium text-gray-700"
              htmlFor="confirmarSenha"
            >
              Repita a senha
            </label>
            <input
              id="confirmarSenha"
              name="confirmarSenha"
              type="password"
              required
              minLength={6}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 outline-none focus:border-orange-600 focus:ring-2 focus:ring-orange-100"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-orange-700 py-2.5 font-medium text-white hover:bg-orange-800"
          >
            Criar senha e entrar
          </button>
        </form>
      </main>
    </div>
  );
}
