import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { addDias, hojeISO } from "@/lib/dates";
import ListaDiarias from "@/components/ListaDiarias";
import { exigirDiarista } from "@/lib/diaristaSessao";
import { montarItensDiarias, notasDasLojas, type ContextoDiarista } from "@/lib/diariasView";

export const dynamic = "force-dynamic";

export default async function VagasPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  await exigirDiarista(token);

  const hoje = hojeISO();
  const limite = addDias(hoje, 2);

  const [diarista, requisicoes] = await Promise.all([
    prisma.diarista.findUnique({
      where: { token },
      include: {
        escalas: { select: { data: true, lojaId: true, presenca: true } },
        inscricoes: { select: { requisicaoId: true } },
        convidadoEm: { select: { id: true } },
        lojasPreferidas: { select: { id: true } },
        bloqueios: {
          where: { OR: [{ ate: null }, { ate: { gt: new Date() } }] },
          select: { lojaId: true },
        },
        convocacoes: { where: { status: "PENDENTE" }, select: { lojaId: true, data: true } },
      },
    }),
    prisma.requisicao.findMany({
      where: { status: "ABERTA", data: { gte: hoje, lte: limite } },
      include: { loja: true },
      orderBy: { data: "asc" },
    }),
  ]);

  if (!diarista) return null;

  const freqPorLoja = new Map<string, number>();
  for (const e of diarista.escalas) {
    if (e.presenca === "PRESENTE") {
      freqPorLoja.set(e.lojaId, (freqPorLoja.get(e.lojaId) ?? 0) + 1);
    }
  }

  const ctx: ContextoDiarista = {
    funcao: diarista.funcao,
    lojasBloqueadas: new Set(diarista.bloqueios.map((b) => b.lojaId)),
    datasComEscala: new Set(diarista.escalas.map((e) => e.data)),
    convocadoLojaData: new Set(diarista.convocacoes.map((c) => `${c.lojaId}|${c.data}`)),
    inscritoEm: new Set(diarista.inscricoes.map((i) => i.requisicaoId)),
    convidadoEm: new Set(diarista.convidadoEm.map((r) => r.id)),
    freqPorLoja,
    favoritas: new Set(diarista.lojasPreferidas.map((l) => l.id)),
  };

  const notaDaLoja = await notasDasLojas([...new Set(requisicoes.map((r) => r.lojaId))]);
  const itens = montarItensDiarias(requisicoes, ctx, notaDaLoja);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Vagas disponíveis</h1>
        <p className="text-sm text-gray-500">Próximos dias · escolha e solicite</p>
      </div>

      <Link
        href={`/d/${token}/perto`}
        className="flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-3 text-center text-base font-bold text-white shadow-sm hover:bg-orange-700"
      >
        📍 Encontrar diárias perto de mim
      </Link>

      <ListaDiarias token={token} itens={itens} />
    </div>
  );
}
