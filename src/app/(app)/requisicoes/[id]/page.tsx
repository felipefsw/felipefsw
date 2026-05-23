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
import { formatBRL, formatDateWithWeekday } from "@/lib/format";
import { hojeISO, maxAgendamentoISO } from "@/lib/dates";
import { fecharRequisicao } from "../actions";

export const dynamic = "force-dynamic";

export default async function FecharRequisicaoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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
          <Link href="/requisicoes" className="font-medium text-teal-700 underline">
            Voltar
          </Link>
        </EmptyState>
      </div>
    );
  }

  const [diaristas, escalasNoDia, inscricoes] = await Promise.all([
    prisma.diarista.findMany({
      where: {
        ativo: true,
        ...(requisicao.funcao ? { funcao: requisicao.funcao } : {}),
      },
      orderBy: { nome: "asc" },
    }),
    // Diaristas já escalados nesse mesmo dia (em qualquer loja) não podem ser
    // selecionados de novo, para evitar conflito de agenda.
    prisma.escala.findMany({
      where: { data: requisicao.data },
      include: { loja: { select: { nome: true } } },
    }),
    prisma.inscricao.findMany({
      where: { requisicaoId: requisicao.id },
      select: { diaristaId: true },
    }),
  ]);

  const ocupadoEm = new Map<string, string>();
  for (const e of escalasNoDia) ocupadoEm.set(e.diaristaId, e.loja.nome);

  // Quem se inscreveu nessa requisição aparece primeiro.
  const inscritos = new Set(inscricoes.map((i) => i.diaristaId));
  diaristas.sort((a, b) => Number(inscritos.has(b.id)) - Number(inscritos.has(a.id)));

  return (
    <div className="space-y-4">
      <PageHeader title="Fechar requisição" subtitle={requisicao.loja.nome} />

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

      {diaristas.length === 0 ? (
        <EmptyState>
          Nenhuma diarista ativa
          {requisicao.funcao ? <> com a função {requisicao.funcao}</> : null}.{" "}
          <Link href="/diaristas/nova" className="font-medium text-teal-700 underline">
            Cadastrar
          </Link>
        </EmptyState>
      ) : (
        <Card>
          <form action={fecharRequisicao} className="space-y-4">
            <input type="hidden" name="id" value={requisicao.id} />

            <div>
              <label className={labelClass} htmlFor="data">
                Data do trabalho
              </label>
              <input
                id="data"
                name="data"
                type="date"
                required
                min={hojeISO()}
                max={maxAgendamentoISO()}
                defaultValue={requisicao.data}
                className={inputClass}
              />
            </div>

            <div>
              <p className={labelClass}>Escolha os diaristas</p>
              <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
                {diaristas.map((d) => {
                  const ocupada = ocupadoEm.get(d.id);
                  if (ocupada) {
                    return (
                      <li
                        key={d.id}
                        className="flex items-center gap-3 px-3 py-2.5 opacity-60"
                        title={`Já selecionado para ${ocupada} nesse dia`}
                      >
                        <input
                          type="checkbox"
                          disabled
                          className="h-5 w-5 rounded border-gray-300"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="font-medium text-gray-500 line-through">{d.nome}</span>
                            {d.funcao && (
                              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-400">
                                {d.funcao}
                              </span>
                            )}
                          </span>
                          <span className="block text-xs text-gray-400">
                            Já selecionado para {ocupada} nesse dia
                          </span>
                        </span>
                      </li>
                    );
                  }
                  return (
                    <li key={d.id}>
                      <label className="flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-gray-50">
                        <input
                          type="checkbox"
                          name="diaristaIds"
                          value={d.id}
                          className="h-5 w-5 rounded border-gray-300 text-teal-700 focus:ring-teal-600"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="font-medium text-gray-900">{d.nome}</span>
                            {d.funcao && (
                              <span className="rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700">
                                {d.funcao}
                              </span>
                            )}
                            {inscritos.has(d.id) && (
                              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                                se inscreveu
                              </span>
                            )}
                          </span>
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-1 text-xs text-gray-400">
                Cada diarista marcado vira um agendamento na escala, no horário e valor (
                {formatBRL(requisicao.valorDiaria)}) desta requisição.
              </p>
            </div>

            <div className="flex gap-2 pt-1">
              <button type="submit" className={btnPrimary}>
                Fechar e criar escala
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
