import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessao } from "@/lib/auth";
import { sair } from "@/app/entrar/actions";

export default async function LojaLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const sessao = await getSessao();
  if (!sessao || sessao.tipo !== "loja") redirect("/entrar");

  const loja = await prisma.loja.findUnique({
    where: { id: sessao.lojaId },
    select: { nome: true },
  });
  if (!loja) redirect("/entrar");

  return (
    <div className="mx-auto flex min-h-full max-w-2xl flex-col">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-teal-700 text-white">
        <div className="flex items-center justify-between gap-2 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2 font-semibold">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/rwp-logo.svg" alt="RWP" className="h-7 w-auto shrink-0" />
            <span className="truncate">{loja.nome}</span>
          </div>
          <form action={sair}>
            <button type="submit" className="shrink-0 text-xs font-medium text-teal-100 underline">
              Sair
            </button>
          </form>
        </div>
      </header>

      <main className="flex-1 px-4 pb-10 pt-4">{children}</main>
    </div>
  );
}
