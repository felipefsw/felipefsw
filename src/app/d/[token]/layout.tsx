import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { diaristaAutenticado } from "@/lib/diaristaSessao";
import BottomNavDiarista from "@/components/BottomNavDiarista";
import MenuDiarista from "@/components/MenuDiarista";
import ChatRH from "@/components/ChatRH";

export const dynamic = "force-dynamic";

export default async function DiaristaLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const diarista = await diaristaAutenticado(token);

  // Telas sem moldura: link inválido, 1º acesso (criar senha) e redirecionamentos.
  // As próprias páginas tratam esses casos.
  if (!diarista) return <>{children}</>;

  const mensagens = await prisma.mensagem.findMany({
    where: { diaristaId: diarista.id },
    orderBy: { criadoEm: "asc" },
    take: 30,
  });

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col">
      <header className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-gray-200 bg-neutral-900 px-4 py-3 text-white">
        <Link href={`/d/${token}`} className="flex min-w-0 items-center gap-2 font-semibold">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/rwp-logo.svg" alt="RWP" className="h-7 w-auto shrink-0" />
        </Link>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href={`/d/${token}/top`}
            className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white"
          >
            🏆 Top diaristas
          </Link>
          <MenuDiarista token={token} />
        </div>
      </header>

      <main className="flex-1 px-4 pb-24 pt-4">{children}</main>

      <ChatRH token={token} mensagens={mensagens} />
      <BottomNavDiarista token={token} />
    </div>
  );
}
