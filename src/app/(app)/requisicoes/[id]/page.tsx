import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  Card,
  EmptyState,
  PageHeader,
  btnPrimary,
  btnSecondary,
  inputClass,
  labelClass,
} from "@/components/ui";
import DiaristaInfo from "@/components/DiaristaInfo";
import { formatBRL, formatDateWithWeekday } from "@/lib/format";
import { bloqueadaGlobalmente } from "@/lib/limites";
import { fecharRequisicao } from "../actions";

export const dynamic = "force-dynamic";

function notaDe(avaliacoes: { estrelas: number }[]): number | null {
  if (avaliacoes.length < 5) return null;
  return avaliacoes.reduce((s, a) => s + a.estrelas, 0) / avaliacoes.length;
}

export default async function ConvidarRequisicaoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ erro?: string; q?: string }>;
}) {
  const { id } = await params;
  const { erro, q } = await searchParams;
  const busca = (q ?? "").trim();
  const requisicao = await prisma.requisicao.findUnique({
    where: { id },
    include: { loja: true },
  });
  if (!requisicao) notFound();

  if (requisicao.status !== "ABERTA") {
    return (
      <div className="space-y-4">
        <PageHeader title="Requisição" subtitle={requisicao.loja.nome} />
        <EmptyState>
          Esta requisição já está <strong>{requisicao.status.toLowerCase()}</strong>.{" "}
          <Link href="/requisicoes" className="font-medium text-orange-700 underline">
            Voltar
          </Link>
        </EmptyState>
      </div>
    );
  }

  const [diaristas, escalasNoDia, inscricoes, bloqueios, convites] = await Promise.all([
    prisma.diarista.findMany({
      where: {
        ativo: true,
        aprovado: true,
        ...(requisicao.funcao ? { funcao: requisicao.funcao } : {}),
        ...(busca ? { nome: { contains: busca, mode: "insensitive" as const } } : {}),
      },
      orderBy: { nome: "asc" },
      include: {
        avaliacoes: { select: { estrelas: true }, orderBy: { criadoEm: "desc" }, take: 5 },
        _count: { select: { escalas: { where: { presenca: "PRESENTE" } } } },
        lojasPreferidas: { where: { id: requisicao.lojaId }, select: { id: true } },
        escalas: {
          where: { lojaId: requisicao.lojaId, presenca: "PRESENTE" },
          select: { id: true },
        },
      },
    }),
    prisma.escala.findMany({
      where: { data: requisicao.data },
      include: { loja: { select: { nome: true } } },
    }),
    prisma.inscricao.findMany({
      where: { requisicaoId: requisicao.id },
      select: { diaristaId: true },
    }),
    prisma.bloqueio.findMany({
      where: { lojaId: requisicao.lojaId, OR: [{ ate: null }, { ate: { gt: new Date() } }] },
      select: { diaristaId: true },
    }),
    prisma.convocacao.findMany({
      where: { requisicaoId: requisicao.id, status: "PENDENTE" },
      select: { diaristaId: true },
    }),
  ]);

  const ocupadoEm = new Map<string, string>();
  for (const e of escalasNoDia) ocupadoEm.set(e.diaristaId, e.loja.nome);
  const bloqueados = new Set(bloqueios.map((b) => b.diaristaId));
  const jaConvidados = new Set(convites.map((c) => c.diaristaId));

  const inscritos = new Set(inscricoes.map((i) => i.diaristaId));
  // Ordem: quem já se candidatou primeiro, depois os preferenciais da loja
  // (prefere a loja ou já trabalhou lá, por frequência), e o resto em ordem alfabética.
  const freqLoja = (d: (typeof diaristas)[number]) => d.escalas.length;
  const prefereLoja = (d: (typeof diaristas)[number]) =>
    d.lojasPreferidas.length > 0 || d.escalas.length > 0;
  const rank = (d: (typeof diaristas)[number]) =>
    inscritos.has(d.id) ? 0 : prefereLoja(d) ? 1 : 2;
  diaristas.sort((a, b) => {
    const ra = rank(a);
    const rb = rank(b);
    if (ra !== rb) return ra - rb;
    if (ra <= 1 && freqLoja(b) !== freqLoja(a)) return freqLoja(b) - freqLoja(a);
    return a.nome.localeCompare(b.nome);
  });

  return (
    <div className="space-y-4">
      <PageHeader title="Convidar diaristas" subtitle={requisicao.loja.nome} />

      {erro === "selecione" && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-medium text-amber-800">
          Selecione pelo menos uma diarista para convidar.
        </div>
      )}
      {erro === "indisponivel" && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
          Ninguém selecionado está disponível (já tem diária no dia, bloqueado ou já convidado).
        </div>
      )}

      <Card>
        <p className="text-sm capitalize text-gray-600">
          {formatDateWithWeekday(requisicao.data)} · {requisicao.horaInicio}–{requisicao.horaFim}
        </p>
        <p className="mt-1 text-sm text-gray-600">
          Pedido: <strong>{requisicao.quantidade}</strong> diarista(s)
          {requisicao.funcao ? <> · {requisicao.funcao}</> : null} ·{" "}
          {formatBRL(requisicao.valorDiaria)} cada
        </p>
        {requisicao.observacoes && (
          <p className="mt-1 text-sm text-gray-500">{requisicao.observacoes}</p>
        )}
      </Card>

      <form method="get" className="flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={busca}
          placeholder="🔍 Buscar diarista pelo nome…"
          className={inputClass}
        />
        <button type="submit" className={btnSecondary}>
          Buscar
        </button>
      </form>

      {diaristas.length === 0 ? (
        <EmptyState>
          {busca ? (
            <>
              Nenhuma diarista encontrada para “{busca}”.{" "}
              <Link href={`/requisicoes/${id}`} className="font-medium text-orange-700 underline">
                Limpar busca
              </Link>
            </>
          ) : (
            <>
              Nenhuma diarista ativa
              {requisicao.funcao ? <> com a função {requisicao.funcao}</> : null}.{" "}
              <Link href="/diaristas/nova" className="font-medium text-orange-700 underline">
                Cadastrar
              </Link>
            </>
          )}
        </EmptyState>
      ) : (
        <Card>
          <form action={fecharRequisicao} className="space-y-4">
            <input type="hidden" name="id" value={requisicao.id} />

            <div>
              <p className={labelClass}>Quem você quer convidar?</p>
              <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
                {diaristas.map((d) => {
                  const ocupada = ocupadoEm.get(d.id);
                  const motivo = ocupada
                    ? `Já tem diária em ${ocupada} nesse dia`
                    : bloqueados.has(d.id)
                      ? "Bloqueado nesta loja"
                      : bloqueadaGlobalmente(d.bloqueadoAte)
                        ? "Bloqueado pelo RH"
                        : jaConvidados.has(d.id)
                          ? "Já convidado"
                          : null;
                  if (motivo) {
                    return (
                      <li
                        key={d.id}
                        className="flex items-center gap-3 px-3 py-2.5 opacity-60"
                        title={motivo}
                      >
                        <input type="checkbox" disabled className="h-5 w-5 rounded border-gray-300" />
                        <span className="min-w-0 flex-1">
                          <span className="font-medium text-gray-500 line-through">{d.nome}</span>
                          <span className="block text-xs text-gray-400">{motivo}</span>
                        </span>
                      </li>
                    );
                  }
                  return (
                    <li key={d.id}>
                      <label className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-gray-50">
                        <input
                          type="checkbox"
                          name="diaristaIds"
                          value={d.id}
                          className="h-5 w-5 rounded border-gray-300 text-orange-700 focus:ring-orange-600"
                        />
                        <DiaristaInfo
                          nome={d.nome}
                          fotoUrl={d.fotoUrl}
                          funcao={d.funcao}
                          nota={notaDe(d.avaliacoes)}
                          diarias={d._count.escalas}
                          avatarClassName="h-8 w-8"
                          extra={
                            inscritos.has(d.id) ? (
                              <span className="text-[11px] font-medium text-amber-700">
                                já se candidatou
                              </span>
                            ) : prefereLoja(d) ? (
                              <span className="text-[11px] font-medium text-orange-600">
                                preferencial da loja
                              </span>
                            ) : undefined
                          }
                        />
                      </label>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-1 text-xs text-gray-400">
                Cada diarista convidada recebe um convite e precisa aceitar. A vaga fecha quando as
                aceitas completarem {requisicao.quantidade} diarista(s).
              </p>
            </div>

            <div className="flex gap-2 pt-1">
              <button type="submit" className={btnPrimary}>
                Enviar convites
              </button>
              <Link href="/requisicoes" className={btnSecondary}>
                Voltar
              </Link>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
