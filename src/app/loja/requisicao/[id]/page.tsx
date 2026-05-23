import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  Card,
  EmptyState,
  PageHeader,
  btnPrimary,
  btnSecondary,
  labelClass,
} from "@/components/ui";
import { formatBRL, formatDateWithWeekday } from "@/lib/format";
import { contextoLoja, getSessao } from "@/lib/auth";
import { decidirRequisicao } from "../../actions";

export const dynamic = "force-dynamic";

function prazoDecisao(data: string, horaInicio: string): string {
  const [a, m, d] = data.split("-").map(Number);
  const [h, min] = horaInicio.split(":").map(Number);
  const dt = new Date(a, m - 1, d, h, min);
  dt.setHours(dt.getHours() - 4);
  return `${String(dt.getDate()).padStart(2, "0")}/${String(dt.getMonth() + 1).padStart(2, "0")} ${String(dt.getHours()).padStart(2, "0")}:${String(dt.getMinutes()).padStart(2, "0")}`;
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
      inscricoes: { include: { diarista: { select: { id: true, nome: true, funcao: true } } } },
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
          <Link href="/loja" className="font-medium text-teal-700 underline">
            Voltar
          </Link>
        </EmptyState>
      </div>
    );
  }

  const candidatos = requisicao.inscricoes;
  const cabemTodos = candidatos.length <= requisicao.quantidade;

  return (
    <div className="space-y-4">
      <PageHeader title="Escolher diaristas" subtitle="Candidatos que pegaram esta diária" />

      <Card>
        <p className="text-sm capitalize text-gray-700">
          {formatDateWithWeekday(requisicao.data)} · {requisicao.horaInicio}–{requisicao.horaFim}
        </p>
        <p className="mt-1 text-sm text-gray-600">
          {requisicao.quantidade} vaga(s)
          {requisicao.funcao ? <> · {requisicao.funcao}</> : null} ·{" "}
          {formatBRL(requisicao.valorDiaria)}
        </p>
        <p className="mt-1 text-xs text-amber-700">⏰ Decida até {prazoDecisao(requisicao.data, requisicao.horaInicio)}</p>
      </Card>

      {candidatos.length === 0 ? (
        <EmptyState>
          Ninguém pegou esta diária ainda. Quando os diaristas se candidatarem, eles aparecem aqui.
        </EmptyState>
      ) : (
        <Card>
          {cabemTodos ? (
            <p className="mb-2 text-sm text-green-700">
              ✓ Cabem todos os {candidatos.length} candidato(s). É só confirmar.
            </p>
          ) : (
            <p className="mb-2 text-sm text-amber-700">
              {candidatos.length} candidatos para {requisicao.quantidade} vaga(s). Escolha quem vai.
            </p>
          )}
          <form action={decidirRequisicao} className="space-y-4">
            <input type="hidden" name="id" value={requisicao.id} />
            <div>
              <p className={labelClass}>Candidatos</p>
              <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
                {candidatos.map((c) => (
                  <li key={c.id}>
                    <label className="flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-gray-50">
                      <input
                        type="checkbox"
                        name="diaristaIds"
                        value={c.diarista.id}
                        defaultChecked={cabemTodos}
                        className="h-5 w-5 rounded border-gray-300 text-teal-700 focus:ring-teal-600"
                      />
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-gray-900">{c.diarista.nome}</span>
                        {c.diarista.funcao && (
                          <span className="rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700">
                            {c.diarista.funcao}
                          </span>
                        )}
                        {convidadosSet.has(c.diarista.id) && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                            convidado
                          </span>
                        )}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex gap-2">
              <button type="submit" className={btnPrimary}>
                Confirmar escolha
              </button>
              <Link href="/loja" className={btnSecondary}>
                Voltar
              </Link>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
