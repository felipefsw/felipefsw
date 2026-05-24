import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, PageHeader, btnPrimary } from "@/components/ui";
import { marcarLidas, responderMensagem } from "../actions";

export const dynamic = "force-dynamic";

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const diarista = await prisma.diarista.findUnique({
    where: { id },
    select: {
      nome: true,
      mensagens: { orderBy: { criadoEm: "asc" } },
    },
  });
  if (!diarista) notFound();

  const temNaoLida = diarista.mensagens.some((m) => m.autor === "DIARISTA" && !m.lida);

  return (
    <div className="space-y-4">
      <PageHeader title={diarista.nome} subtitle="Conversa" />
      <Link href="/mensagens" className="text-sm font-medium text-orange-700">
        ← Todas as mensagens
      </Link>

      {temNaoLida && (
        <form action={marcarLidas}>
          <input type="hidden" name="diaristaId" value={id} />
          <button type="submit" className="text-xs text-gray-500 underline">
            marcar como lidas
          </button>
        </form>
      )}

      <Card>
        {diarista.mensagens.length === 0 ? (
          <p className="text-sm text-gray-500">Sem mensagens.</p>
        ) : (
          <div className="space-y-2">
            {diarista.mensagens.map((m) => (
              <div
                key={m.id}
                className={
                  m.autor === "GESTAO"
                    ? "ml-6 rounded-xl bg-orange-50 p-2 text-sm text-gray-800"
                    : "mr-6 rounded-xl bg-gray-100 p-2 text-sm text-gray-800"
                }
              >
                <span className="block text-[10px] font-medium text-gray-400">
                  {m.autor === "GESTAO" ? "RH" : diarista.nome}
                </span>
                {m.texto}
              </div>
            ))}
          </div>
        )}

        <form action={responderMensagem} className="mt-3 space-y-2">
          <input type="hidden" name="diaristaId" value={id} />
          <textarea
            name="texto"
            required
            rows={2}
            placeholder="Responder…"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 outline-none focus:border-orange-600 focus:ring-2 focus:ring-orange-100"
          />
          <button type="submit" className={btnPrimary}>
            Responder
          </button>
        </form>
      </Card>
    </div>
  );
}
