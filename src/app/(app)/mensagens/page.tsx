import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function MensagensPage() {
  const msgs = await prisma.mensagem.findMany({
    orderBy: { criadoEm: "desc" },
    take: 300,
    include: { diarista: { select: { id: true, nome: true } } },
  });

  type Item = { id: string; nome: string; ultima: string; quando: Date; naoLidas: number };
  const porDiarista = new Map<string, Item>();
  for (const m of msgs) {
    const cur =
      porDiarista.get(m.diaristaId) ??
      { id: m.diaristaId, nome: m.diarista.nome, ultima: m.texto, quando: m.criadoEm, naoLidas: 0 };
    if (m.autor === "DIARISTA" && !m.lida) cur.naoLidas += 1;
    porDiarista.set(m.diaristaId, cur);
  }
  const lista = [...porDiarista.values()];

  return (
    <div>
      <PageHeader title="Mensagens" subtitle="Conversas com os diaristas" />
      {lista.length === 0 ? (
        <EmptyState>Nenhuma mensagem ainda.</EmptyState>
      ) : (
        <div className="space-y-2">
          {lista.map((d) => (
            <Link key={d.id} href={`/mensagens/${d.id}`}>
              <Card className="hover:bg-gray-50">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 font-medium text-gray-900">
                      {d.nome}
                      {d.naoLidas > 0 && (
                        <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
                          {d.naoLidas}
                        </span>
                      )}
                    </p>
                    <p className="truncate text-sm text-gray-500">{d.ultima}</p>
                  </div>
                  <span className="shrink-0 text-xs text-gray-400">
                    {formatDate(d.quando.toISOString().slice(0, 10))}
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
