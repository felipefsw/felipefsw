import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, EmptyState, PageHeader, btnDanger, inputClass } from "@/components/ui";
import ConfirmSubmit from "@/components/ConfirmSubmit";
import CopyButton from "@/components/CopyButton";
import Avatar from "@/components/Avatar";
import { FUNCOES } from "@/lib/funcoes";
import { mediaDaAvaliacao } from "@/lib/bonificacoes";
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
      include: {
        avaliacoes: { orderBy: { criadoEm: "desc" }, take: 5 },
        _count: { select: { escalas: { where: { presenca: "PRESENTE" } } } },
      },
    }),
  ]);
  const totalPaginas = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Nota (média das 5 últimas avaliações) só aparece após 5 avaliações.
  const resumo = (d: (typeof diaristas)[number]) => {
    const diarias = d._count.escalas;
    const nota =
      d.avaliacoes.length >= 5
        ? d.avaliacoes.reduce((s, a) => s + mediaDaAvaliacao(a), 0) / d.avaliacoes.length
        : null;
    return { diarias, nota };
  };

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
                <div className="flex min-w-0 gap-3">
                  <Avatar nome={d.nome} fotoUrl={d.fotoUrl} className="h-10 w-10" />
                  <div className="min-w-0">
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
                  {(() => {
                    const { diarias, nota } = resumo(d);
                    return (
                      <p className="mt-0.5 text-sm text-gray-600">
                        {nota !== null && (
                          <span className="font-medium text-orange-700">★ {nota.toFixed(1)} · </span>
                        )}
                        {diarias} diária(s) na rede
                      </p>
                    );
                  })()}
                  </div>
                </div>
                <Link
                  href={`/diaristas/${d.id}`}
                  className="shrink-0 text-sm font-medium text-orange-700 hover:underline"
                >
                  Editar
                </Link>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3">
                {d.chavePix && (
                  <CopyButton
                    text={d.chavePix}
                    label="Copiar Pix"
                    className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700"
                  />
                )}
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
