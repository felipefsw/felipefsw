import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { contextoLoja, getSessao } from "@/lib/auth";
import { sair } from "@/app/entrar/actions";

export default async function LojaLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const ctx = contextoLoja(await getSessao());
  if (!ctx) redirect("/entrar");

  const loja = await prisma.loja.findUnique({
    where: { id: ctx.lojaId },
    select: { nome: true },
  });
  if (!loja) redirect("/entrar");

  let podeTrocar = false;
  if (ctx.gestorId) {
    const n = await prisma.loja.count({ where: { gestorId: ctx.gestorId, ativo: true } });
    podeTrocar = n > 1;
  }

  return (
    <div className="mx-auto flex min-h-full max-w-2xl flex-col">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-teal-700 text-white">
        <div className="flex items-center justify-between gap-2 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2 font-semibold">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/rwp-logo.svg" alt="RWP" className="h-7 w-auto shrink-0" />
            <span className="truncate">{loja.nome}</span>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {podeTrocar && (
              <Link href="/loja/trocar" className="text-xs font-medium text-teal-100 underline">
                Trocar loja
              </Link>
            )}
            <form action={sair}>
              <button type="submit" className="text-xs font-medium text-teal-100 underline">
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 pb-10 pt-4">{children}</main>
    </div>
  );
}
