import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, EmptyState, PageHeader, btnSecondary } from "@/components/ui";
import { formatBRL, formatDateWithWeekday } from "@/lib/format";
import { corDoTurno } from "@/lib/horarios";
import { contextoLoja, getSessao } from "@/lib/auth";
import Avatar from "@/components/Avatar";
import SubmitButton from "@/components/SubmitButton";
import { aprovarCandidato } from "../../actions";

export const dynamic = "force-dynamic";

function notaDe(avaliacoes: { estrelas: number }[]): number | null {
  if (avaliacoes.length < 5) return null;
  return avaliacoes.reduce((s, a) => s + a.estrelas, 0) / avaliacoes.length;
}

export default async function DecidirRequisicaoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = contextoLoja(await getSessao());
  if (!ctx) redirect("/entrar");

  const { id } = await params;
  const requisicao = await prisma.requisicao.findUnique({
    where: { id },
    include: {
      _count: { select: { escalas: true } },
      inscricoes: {
        include: {
          diarista: {
            select: {
              id: true,
              nome: true,
              funcao: true,
              fotoUrl: true,
              avaliacoes: { select: { estrelas: true }, orderBy: { criadoEm: "desc" }, take: 5 },
              _count: { select: { escalas: { where: { presenca: "PRESENTE" } } } },
            },
          },
        },
      },
      convidados: { select: { id: true } },
    },
  });
  if (!requisicao || requisicao.lojaId !== ctx.lojaId) notFound();
  const convidadosSet = new Set(requisicao.convidados.map((c) => c.id));

  if (requisicao.status !== "ABERTA") {
    return (
      <div className="space-y-4">
        <PageHeader title="Requisição" />
        <EmptyState>
          Esta requisição já está <strong>{requisicao.status.toLowerCase()}</strong>.{" "}
          <Link href="/loja" className="font-medium text-orange-700 underline">
            Voltar
          </Link>
        </EmptyState>
      </div>
    );
  }

  const candidatos = requisicao.inscricoes;
  const turno = corDoTurno(requisicao.horaInicio);
  const faltam = requisicao.quantidade - requisicao._count.escalas;

  return (
    <div className="space-y-4">
      <PageHeader title="Escolher diaristas" subtitle="Toque em Aprovar para confirmar o candidato" />

      <Card className={turno.card}>
        <p className="text-sm capitalize text-gray-700">
          {formatDateWithWeekday(requisicao.data)} ·{" "}
          <span className={`rounded px-1.5 py-0.5 font-medium ${turno.chip}`}>
            {requisicao.horaInicio}–{requisicao.horaFim}
          </span>
        </p>
        <p className="mt-1 text-sm text-gray-600">
          {requisicao.quantidade} vaga(s)
          {requisicao.funcao ? <> · {requisicao.funcao}</> : null} ·{" "}
          {formatBRL(requisicao.valorDiaria)}
        </p>
        <p className="mt-1 text-xs text-gray-500">
          {faltam > 0 ? `Faltam ${faltam} vaga(s).` : "Vagas preenchidas."}
        </p>
      </Card>

      {candidatos.length === 0 ? (
        <EmptyState>
          Ninguém pegou esta diária ainda. Quando os diaristas se candidatarem, eles aparecem aqui.
        </EmptyState>
      ) : (
        <div className="space-y-2">
          {candidatos.map((c) => {
            const nota = notaDe(c.diarista.avaliacoes);
            return (
              <Card key={c.id}>
                <Link
                  href={`/loja/candidato/${c.diarista.id}`}
                  className="text-xs font-medium text-orange-700 underline"
                >
                  Saber mais sobre esta pessoa →
                </Link>
                <div className="mt-1 flex items-center justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-3">
                    <Avatar nome={c.diarista.nome} fotoUrl={c.diarista.fotoUrl} className="h-10 w-10" />
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-gray-900">
                        {c.diarista.nome}
                      </span>
                      <span className="block text-xs text-gray-500">
                        {nota !== null ? `★ ${nota.toFixed(1)} de 5 · ` : ""}
                        {c.diarista._count.escalas} diária(s)
                        {c.diarista.funcao ? ` · ${c.diarista.funcao}` : ""}
                        {convidadosSet.has(c.diarista.id) ? " · convidado" : ""}
                      </span>
                    </span>
                  </span>
                  {faltam > 0 ? (
                    <form action={aprovarCandidato.bind(null, requisicao.id, c.diarista.id)}>
                      <SubmitButton
                        pendingLabel="Aprovando…"
                        className="shrink-0 rounded-lg bg-orange-700 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-800"
                      >
                        Aprovar
                      </SubmitButton>
                    </form>
                  ) : (
                    <span className="shrink-0 text-xs text-gray-400">vagas cheias</span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Link href="/loja" className={btnSecondary}>
        Voltar
      </Link>
    </div>
  );
}
