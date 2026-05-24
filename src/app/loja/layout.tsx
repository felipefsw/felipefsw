import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { contextoLoja, getSessao } from "@/lib/auth";
import MarcaBadge from "@/components/MarcaBadge";
import { sair } from "@/app/entrar/actions";

export default async function LojaLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const ctx = contextoLoja(await getSessao());
  if (!ctx) redirect("/entrar");

  const loja = ctx.lojaId
    ? await prisma.loja.findUnique({ where: { id: ctx.lojaId }, select: { nome: true } })
    : null;

  // Gestor sem loja associada: avisa em vez de entrar em loop.
  if (!loja) {
    if (!ctx.gestorId) redirect("/entrar");
    return (
      <div className="mx-auto max-w-md p-6">
        <h1 className="text-xl font-bold text-gray-900">Sem loja associada</h1>
        <p className="mt-2 text-sm text-gray-600">
          Seu usuário ainda não tem nenhuma loja vinculada. Peça ao RH para associar suas lojas
          (RH → Lojas → editar a loja → campo <strong>Gestor</strong>) e depois saia e entre de novo.
        </p>
        <form action={sair} className="mt-4">
          <button
            type="submit"
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
          >
            Sair
          </button>
        </form>
      </div>
    );
  }

  let podeTrocar = false;
  if (ctx.gestorId) {
    const n = await prisma.loja.count({ where: { gestorId: ctx.gestorId, ativo: true } });
    podeTrocar = n > 1;
  }

  return (
    <div className="mx-auto flex min-h-full max-w-2xl flex-col">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-neutral-900 text-white">
        <div className="flex items-center justify-between gap-2 px-4 py-3">
          <Link href="/loja" className="flex min-w-0 items-center gap-2 font-semibold">
            <MarcaBadge nome={loja.nome} className="h-7 w-7 shrink-0 rounded" />
            <span className="truncate">{loja.nome}</span>
          </Link>
          <div className="flex shrink-0 items-center gap-3">
            <Link href="/loja" className="text-xs font-medium text-orange-100 underline">
              🏠 Início
            </Link>
            {podeTrocar && (
              <Link href="/loja/trocar" className="text-xs font-medium text-orange-100 underline">
                Trocar loja
              </Link>
            )}
            <form action={sair}>
              <button type="submit" className="text-xs font-medium text-orange-100 underline">
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
