import Link from "next/link";
import { redirect } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import { getSessao } from "@/lib/auth";
import { sair } from "@/app/entrar/actions";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const sessao = await getSessao();
  if (!sessao || sessao.tipo !== "gestao") redirect("/entrar");

  return (
    <div className="mx-auto flex min-h-full max-w-2xl flex-col">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-neutral-900 text-white">
        <div className="flex items-center justify-between gap-2 px-4 py-3">
          <Link href="/" className="flex min-w-0 items-center gap-2 font-semibold">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/rwp-logo.svg" alt="RWP" className="h-7 w-auto shrink-0" />
            <span className="truncate">Gestão · Pizzarias RWP</span>
          </Link>
          <div className="flex shrink-0 items-center gap-2">
            <span className="rounded-full bg-orange-600 px-2 py-0.5 text-xs font-medium">
              {sessao.nome ? (
                <>
                  {sessao.nome} · <span className="uppercase">{sessao.perfil}</span>
                </>
              ) : (
                <span className="uppercase">{sessao.perfil}</span>
              )}
            </span>
            <form action={sair}>
              <button type="submit" className="text-xs font-medium text-orange-100 underline">
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 pb-24 pt-4">{children}</main>

      <BottomNav />
    </div>
  );
}
