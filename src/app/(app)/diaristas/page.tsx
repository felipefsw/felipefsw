import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, EmptyState, PageHeader, btnDanger, inputClass } from "@/components/ui";
import ConfirmSubmit from "@/components/ConfirmSubmit";
import { formatBRL } from "@/lib/format";
import { FUNCOES } from "@/lib/funcoes";
import { deleteDiarista, toggleDiaristaAtivo } from "./actions";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

export default async function DiaristasPage({
  searchParams,
}: {
  searchParams: Promise<{ funcao?: string; q?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const filtro = FUNCOES.find((f) => f === sp.funcao);
  const q = (sp.q ?? "").trim();
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);

  const where = {
    ...(filtro ? { funcao: filtro } : {}),
    ...(q ? { nome: { contains: q, mode: "insensitive" as const } } : {}),
  };

  const [total, diaristas] = await Promise.all([
    prisma.diarista.count({ where }),
    prisma.diarista.findMany({
      where,
      orderBy: [{ ativo: "desc" }, { nome: "asc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);
  const totalPaginas = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Preserva filtros nos links.
  const qs = (extra: Record<string, string | number>) => {
    const p = new URLSearchParams();
    if (filtro) p.set("funcao", filtro);
    if (q) p.set("q", q);
    for (const [k, v] of Object.entries(extra)) p.set(k, String(v));
    const s = p.toString();
    return s ? `?${s}` : "";
  };

  const chipBase = "rounded-full border px-3 py-1 text-sm font-medium whitespace-nowrap";
  const chipOn = "border-orange-700 bg-orange-700 text-white";
  const chipOff = "border-gray-300 bg-white text-gray-700 hover:bg-gray-50";

  return (
    <div>
      <PageHeader
        title="Diaristas"
        subtitle={`${total} resultado(s)`}
        action={{ href: "/diaristas/nova", label: "+ Nova" }}
      />

      <form method="get" className="mb-3 flex gap-2">
        {filtro && <input type="hidden" name="funcao" value={filtro} />}
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar por nome…"
          className={inputClass}
        />
        <button
          type="submit"
          className="shrink-0 rounded-lg bg-orange-700 px-4 py-2 text-sm font-medium text-white hover:bg-orange-800"
        >
          Buscar
        </button>
      </form>

      <div className="mb-4 flex flex-wrap gap-2">
        <Link
          href={`/diaristas${q ? `?q=${encodeURIComponent(q)}` : ""}`}
          className={`${chipBase} ${filtro ? chipOff : chipOn}`}
        >
          Todas
        </Link>
        {FUNCOES.map((f) => {
          const p = new URLSearchParams();
          p.set("funcao", f);
          if (q) p.set("q", q);
          return (
            <Link
              key={f}
              href={`/diaristas?${p.toString()}`}
              className={`${chipBase} ${filtro === f ? chipOn : chipOff}`}
            >
              {f}
            </Link>
          );
        })}
      </div>

      {diaristas.length === 0 ? (
        <EmptyState>
          {q || filtro ? (
            <>Nenhuma diarista encontrada com esse filtro.</>
          ) : (
            <>
              Nenhuma diarista cadastrada ainda.
              <br />
              Toque em <strong>+ Nova</strong> para começar.
            </>
          )}
        </EmptyState>
      ) : (
        <div className="space-y-3">
          {diaristas.map((d) => (
            <Card key={d.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{d.nome}</span>
                    {d.funcao && (
                      <span className="rounded-full bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-700">
                        {d.funcao}
                      </span>
                    )}
                    {!d.ativo && (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                        inativa
                      </span>
                    )}
                  </div>
                  {d.telefone && <p className="text-sm text-gray-500">{d.telefone}</p>}
                  <p className="mt-1 text-sm text-gray-600">
                    Diária: <strong>{formatBRL(d.valorDiaria)}</strong>
                  </p>
                </div>
                <Link
                  href={`/diaristas/${d.id}`}
                  className="text-sm font-medium text-orange-700 hover:underline"
                >
                  Editar
                </Link>
              </div>

              <div className="mt-3 flex flex-wrap gap-2 border-t border-gray-100 pt-3">
                <form action={toggleDiaristaAtivo}>
                  <input type="hidden" name="id" value={d.id} />
                  <button
                    type="submit"
                    className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    {d.ativo ? "Desativar" : "Reativar"}
                  </button>
                </form>
                <form action={deleteDiarista}>
                  <input type="hidden" name="id" value={d.id} />
                  <ConfirmSubmit
                    className={btnDanger}
                    message={`Excluir "${d.nome}"? O histórico de agendamentos dessa pessoa também será apagado.`}
                  >
                    Excluir
                  </ConfirmSubmit>
                </form>
              </div>
            </Card>
          ))}
        </div>
      )}

      {totalPaginas > 1 && (
        <div className="mt-4 flex items-center justify-between gap-2">
          {page > 1 ? (
            <Link
              href={`/diaristas${qs({ page: page - 1 })}`}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              ← Anterior
            </Link>
          ) : (
            <span />
          )}
          <span className="text-sm text-gray-500">
            Página {page} de {totalPaginas}
          </span>
          {page < totalPaginas ? (
            <Link
              href={`/diaristas${qs({ page: page + 1 })}`}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Próxima →
            </Link>
          ) : (
            <span />
          )}
        </div>
      )}
    </div>
  );
}
