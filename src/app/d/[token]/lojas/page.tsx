import { prisma } from "@/lib/prisma";
import { addDias, hojeISO } from "@/lib/dates";
import { enderecoCompleto } from "@/lib/loja";
import MarcaBadge from "@/components/MarcaBadge";
import ListaDiarias from "@/components/ListaDiarias";
import { exigirDiarista } from "@/lib/diaristaSessao";
import { montarItensDiarias, notasDasLojas, type ContextoDiarista } from "@/lib/diariasView";
import { alternarFavorita } from "../actions";

export const dynamic = "force-dynamic";

export default async function LojasPage({
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
        lojasPreferidas: {
          select: { id: true, nome: true, endereco: true, bairro: true, cidade: true },
          orderBy: { nome: "asc" },
        },
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

  const favoritasIds = new Set(diarista.lojasPreferidas.map((l) => l.id));

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
    favoritas: favoritasIds,
  };

  const notaDaLoja = await notasDasLojas([...new Set(requisicoes.map((r) => r.lojaId))]);
  const itens = montarItensDiarias(requisicoes, ctx, notaDaLoja);
  const outras = itens.filter((i) => !i.favorita);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Lojas</h1>
        <p className="text-sm text-gray-500">Suas favoritas e vagas de outras lojas</p>
      </div>

      <section>
        <h2 className="mb-2 font-semibold text-gray-900">❤️ Suas favoritas</h2>
        {diarista.lojasPreferidas.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500">
            Você ainda não favoritou nenhuma loja. Toque no 🤍 nas vagas para favoritar (até 5).
          </div>
        ) : (
          <ul className="space-y-2">
            {diarista.lojasPreferidas.map((l) => (
              <li
                key={l.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white p-3"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <MarcaBadge nome={l.nome} className="h-6 w-6 shrink-0 rounded" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900">{l.nome}</p>
                    {enderecoCompleto(l) && (
                      <p className="truncate text-[11px] text-gray-500">{enderecoCompleto(l)}</p>
                    )}
                  </div>
                </div>
                <form action={alternarFavorita}>
                  <input type="hidden" name="token" value={token} />
                  <input type="hidden" name="lojaId" value={l.id} />
                  <button
                    type="submit"
                    title="Remover dos favoritos"
                    aria-label="Remover dos favoritos"
                    className="shrink-0 text-lg leading-none"
                  >
                    ❤️
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-1 text-[11px] text-gray-400">
          {diarista.lojasPreferidas.length}/5 favoritas · usadas também para os avisos de novas vagas.
        </p>
      </section>

      <section>
        <h2 className="mb-2 font-semibold text-gray-900">Vagas de outras lojas</h2>
        {outras.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500">
            Nenhuma vaga de outras lojas no momento.
          </div>
        ) : (
          <ListaDiarias token={token} itens={outras} />
        )}
      </section>
    </div>
  );
}
