import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatBRL, formatDateWithWeekday } from "@/lib/format";
import { addDias, hojeISO } from "@/lib/dates";
import { confirmarPresenca } from "./actions";

export const dynamic = "force-dynamic";

export default async function DiaristaLinkPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const hoje = hojeISO();
  const desde = addDias(hoje, -14);

  const diarista = await prisma.diarista.findUnique({
    where: { token },
    include: {
      escalas: {
        where: { data: { gte: desde } },
        include: { loja: true, avaliacaoLoja: { select: { id: true } } },
        orderBy: { data: "asc" },
      },
    },
  });

  if (!diarista) {
    return (
      <div className="mx-auto max-w-md p-6 text-center">
        <h1 className="mt-10 text-xl font-bold text-gray-900">Link inválido</h1>
        <p className="mt-2 text-gray-500">
          Este link não foi encontrado. Peça um novo link ao responsável.
        </p>
      </div>
    );
  }

  const proximas = diarista.escalas.filter((e) => e.data >= hoje);
  const recentes = diarista.escalas.filter((e) => e.data < hoje).reverse();

  return (
    <div className="mx-auto max-w-md">
      <header className="bg-teal-700 px-5 py-6 text-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/rwp-logo.svg" alt="RWP" className="mb-3 h-7 w-auto" />
        <p className="text-sm text-teal-100">Olá,</p>
        <h1 className="text-2xl font-bold">{diarista.nome}</h1>
        <p className="mt-1 text-sm text-teal-100">Sua agenda de trabalho</p>
      </header>

      <main className="space-y-6 p-5">
        <section>
          <h2 className="mb-2 font-semibold text-gray-900">Próximos dias</h2>
          {proximas.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center text-gray-500">
              Nenhum dia agendado por enquanto.
            </div>
          ) : (
            <ul className="space-y-3">
              {proximas.map((e) => (
                <li
                  key={e.id}
                  className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium capitalize text-gray-900">
                        {formatDateWithWeekday(e.data)}
                        {e.data === hoje && (
                          <span className="ml-2 rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-700">
                            hoje
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-gray-500">{e.loja.nome}</p>
                      {e.loja.endereco && (
                        <p className="text-xs text-gray-400">{e.loja.endereco}</p>
                      )}
                      <p className="mt-1 text-sm text-gray-600">{formatBRL(e.valor)}</p>
                    </div>
                    {e.presenca === "PRESENTE" ? (
                      <span className="shrink-0 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                        ✓ confirmado
                      </span>
                    ) : null}
                  </div>

                  {e.presenca !== "PRESENTE" && e.data <= hoje && (
                    <form action={confirmarPresenca} className="mt-3">
                      <input type="hidden" name="id" value={e.id} />
                      <input type="hidden" name="token" value={token} />
                      <button
                        type="submit"
                        className="w-full rounded-lg bg-green-600 py-2 font-medium text-white hover:bg-green-700"
                      >
                        Confirmar presença
                      </button>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {recentes.length > 0 && (
          <section>
            <h2 className="mb-2 font-semibold text-gray-900">Dias anteriores</h2>
            <ul className="space-y-2">
              {recentes.map((e) => (
                <li
                  key={e.id}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="capitalize text-gray-600">
                      {formatDateWithWeekday(e.data)} · {e.loja.nome}
                    </span>
                    {e.presenca === "PRESENTE" ? (
                      <span className="text-green-600">presente</span>
                    ) : e.presenca === "FALTOU" ? (
                      <span className="text-red-500">faltou</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </div>
                  {e.presenca === "PRESENTE" &&
                    (e.avaliacaoLoja ? (
                      <span className="mt-1 inline-block text-xs text-teal-600">
                        ★ loja avaliada
                      </span>
                    ) : (
                      <Link
                        href={`/d/${token}/avaliar-loja/${e.id}`}
                        className="mt-2 inline-block rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-800"
                      >
                        Avaliar loja
                      </Link>
                    ))}
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="pb-6 text-center text-xs text-gray-400">
          Em caso de dúvida, fale com o responsável.
        </p>
      </main>
    </div>
  );
}
