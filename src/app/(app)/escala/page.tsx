import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, EmptyState, btnPrimary } from "@/components/ui";
import ConfirmSubmit from "@/components/ConfirmSubmit";
import { formatBRL, formatDateShort, formatDateWithWeekday } from "@/lib/format";
import { addDias, hojeISO, inicioDaSemana, isISODate, semana } from "@/lib/dates";
import { deleteEscala, marcarPresenca } from "./actions";

export const dynamic = "force-dynamic";

export default async function EscalaPage({
  searchParams,
}: {
  searchParams: Promise<{ inicio?: string }>;
}) {
  const sp = await searchParams;
  const hoje = hojeISO();
  const inicio =
    sp.inicio && isISODate(sp.inicio) ? inicioDaSemana(sp.inicio) : inicioDaSemana(hoje);
  const dias = semana(inicio);

  const escalas = await prisma.escala.findMany({
    where: { data: { gte: dias[0], lte: dias[6] } },
    include: { diarista: true, loja: true, avaliacao: { select: { id: true } } },
    orderBy: [{ data: "asc" }, { criadoEm: "asc" }],
  });

  const porDia = new Map<string, typeof escalas>();
  for (const dia of dias) porDia.set(dia, []);
  for (const e of escalas) porDia.get(e.data)?.push(e);

  return (
    <div>
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Escala</h1>
          <p className="text-sm text-gray-500">
            {formatDateShort(dias[0])} – {formatDateShort(dias[6])}
          </p>
        </div>
        <Link href="/escala/novo" className={btnPrimary}>
          + Agendar
        </Link>
      </div>

      <div className="mb-4 flex items-center justify-between gap-2">
        <Link
          href={`/escala?inicio=${addDias(inicio, -7)}`}
          className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          ← Semana
        </Link>
        <Link
          href="/escala"
          className="text-sm font-medium text-teal-700 hover:underline"
        >
          Esta semana
        </Link>
        <Link
          href={`/escala?inicio=${addDias(inicio, 7)}`}
          className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Semana →
        </Link>
      </div>

      <div className="space-y-3">
        {dias.map((dia) => {
          const lista = porDia.get(dia) ?? [];
          const ehHoje = dia === hoje;
          return (
            <Card key={dia} className={ehHoje ? "ring-2 ring-teal-200" : ""}>
              <div className="mb-2 flex items-center justify-between">
                <span className="font-semibold capitalize text-gray-900">
                  {formatDateWithWeekday(dia)}
                  {ehHoje && (
                    <span className="ml-2 rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-700">
                      hoje
                    </span>
                  )}
                </span>
                <Link
                  href={`/escala/novo?data=${dia}`}
                  className="text-sm font-medium text-teal-700 hover:underline"
                >
                  + agendar
                </Link>
              </div>

              {lista.length === 0 ? (
                <p className="text-sm text-gray-400">Sem agendamentos.</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {lista.map((e) => (
                    <li key={e.id} className="flex items-start justify-between gap-3 py-2">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-gray-900">
                          {e.diarista.nome}
                        </p>
                        <p className="truncate text-sm text-gray-500">{e.loja.nome}</p>
                        <p className="text-sm text-gray-600">{formatBRL(e.valor)}</p>
                      </div>

                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        {e.presenca === "PENDENTE" ? (
                          <div className="flex gap-1.5">
                            <form action={marcarPresenca}>
                              <input type="hidden" name="id" value={e.id} />
                              <input type="hidden" name="presenca" value="PRESENTE" />
                              <button
                                type="submit"
                                className="rounded-lg bg-green-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-green-700"
                              >
                                Presente
                              </button>
                            </form>
                            <form action={marcarPresenca}>
                              <input type="hidden" name="id" value={e.id} />
                              <input type="hidden" name="presenca" value="FALTOU" />
                              <button
                                type="submit"
                                className="rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
                              >
                                Faltou
                              </button>
                            </form>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            {e.presenca === "PRESENTE" ? (
                              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                                Presente
                              </span>
                            ) : (
                              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                                Faltou
                              </span>
                            )}
                            {e.pago && (
                              <span className="rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-700">
                                pago
                              </span>
                            )}
                            <form action={marcarPresenca}>
                              <input type="hidden" name="id" value={e.id} />
                              <input type="hidden" name="presenca" value="PENDENTE" />
                              <button
                                type="submit"
                                className="text-xs text-gray-400 underline hover:text-gray-600"
                              >
                                desfazer
                              </button>
                            </form>
                          </div>
                        )}

                        <Link
                          href={`/escala/${e.id}/avaliar`}
                          className={`text-xs font-medium ${
                            e.avaliacao
                              ? "text-teal-600 hover:underline"
                              : "text-gray-400 hover:text-teal-700"
                          }`}
                        >
                          {e.avaliacao ? "★ avaliada" : "avaliar"}
                        </Link>

                        <form action={deleteEscala}>
                          <input type="hidden" name="id" value={e.id} />
                          <ConfirmSubmit
                            className="text-xs text-gray-400 hover:text-red-600"
                            message="Excluir este agendamento?"
                          >
                            excluir
                          </ConfirmSubmit>
                        </form>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          );
        })}
      </div>

      {escalas.length === 0 && (
        <div className="mt-4">
          <EmptyState>
            Nenhum agendamento nesta semana. Toque em <strong>+ Agendar</strong>.
          </EmptyState>
        </div>
      )}
    </div>
  );
}
