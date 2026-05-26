import Link from "next/link";
import { redirect } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import TrilhaAprendizado from "@/components/TrilhaAprendizado";
import { TRILHA_RH, TRILHA_TI } from "@/lib/trilhas";
import { getSessao, sessionSecretInseguro } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sair } from "@/app/entrar/actions";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const sessao = await getSessao();
  if (!sessao || sessao.tipo !== "gestao") redirect("/entrar");

  // Contagem do sino: cadastros pendentes + candidaturas pendentes + mensagens não lidas.
  const [cadastrosPend, inscricoesPend, mensagensNL] = await Promise.all([
    prisma.diarista.count({ where: { aprovado: false, ativo: true } }),
    prisma.inscricao.count({ where: { status: "PENDENTE" } }),
    prisma.mensagem.count({ where: { autor: "DIARISTA", lida: false } }),
  ]);
  const totalNotif = cadastrosPend + inscricoesPend + mensagensNL;

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
            <Link
              href="/notificacoes"
              aria-label="Notificações"
              className="relative flex h-8 w-8 items-center justify-center rounded-full text-lg hover:bg-white/10"
            >
              🔔
              {totalNotif > 0 && (
                <span className="absolute -right-0.5 -top-0.5 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                  {totalNotif > 99 ? "99+" : totalNotif}
                </span>
              )}
            </Link>
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

      {sessionSecretInseguro() && (
        <div className="border-b border-red-200 bg-red-50 px-4 py-2 text-xs font-medium text-red-700">
          ⚠️ Segurança: defina a variável <strong>SESSION_SECRET</strong> no Vercel (texto longo
          aleatório) e faça redeploy. Sem ela, a sessão pode ser forjada.
        </div>
      )}

      <main className="flex-1 px-4 pb-24 pt-4">{children}</main>

      <TrilhaAprendizado
        id={`${sessao.perfil}-v1`}
        titulo={sessao.perfil === "ti" ? "Guia da TI" : "Guia do RH"}
        passos={sessao.perfil === "ti" ? TRILHA_TI : TRILHA_RH}
        posicao="acimaMenu"
      />

      <BottomNav />
    </div>
  );
}
