import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { EmptyState, PageHeader, inputClass } from "@/components/ui";
import ConfirmDeleteLoja from "@/components/ConfirmDeleteLoja";
import MarcaBadge from "@/components/MarcaBadge";
import ClickMagicoBotao from "@/components/ClickMagicoBotao";
import { coresDaMarca, grupoDaLoja } from "@/lib/marcas";
import { getSessao } from "@/lib/auth";
import { deleteLoja, toggleLojaAtivo } from "./actions";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

export default async function LojasPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; erro?: string }>;
}) {
  const sp = await searchParams;
  const sessao = await getSessao();
  const ehTI = sessao?.tipo === "gestao" && sessao.perfil === "ti";
  const q = (sp.q ?? "").trim();
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);

  const where = q
    ? {
        OR: [
          { nome: { contains: q, mode: "insensitive" as const } },
          { cidade: { contains: q, mode: "insensitive" as const } },
          { bairro: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [total, lojas] = await Promise.all([
    prisma.loja.count({ where }),
    prisma.loja.findMany({
      where,
      orderBy: [{ ativo: "desc" }, { nome: "asc" }],
      include: {
        _count: { select: { escalas: true } },
        requisicoes: { where: { status: "ABERTA" }, select: { funcao: true, quantidade: true } },
        gestores: { select: { nome: true } },
      },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);
  const totalPaginas = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageQs = (n: number) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    p.set("page", String(n));
    return `/lojas?${p.toString()}`;
  };

  // Agrupa por marca (quadrantes).
  type LojaItem = (typeof lojas)[number];
  const grupos = new Map<string, { label: string; ordem: number; itens: LojaItem[] }>();
  for (const l of lojas) {
    const g = grupoDaLoja(l.nome);
    const cur = grupos.get(g.key) ?? { label: g.label, ordem: g.ordem, itens: [] };
    cur.itens.push(l);
    grupos.set(g.key, cur);
  }
  const gruposOrdenados = [...grupos.values()].sort((a, b) => a.ordem - b.ordem);

  return (
    <div>
      <PageHeader
        title="Lojas"
        subtitle={`${total} resultado(s)`}
        action={ehTI ? { href: "/lojas/nova", label: "+ Nova" } : undefined}
      />

      {sp.erro === "ti" && (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
          Apenas a TI pode criar ou excluir lojas.
        </div>
      )}

      <div className="mb-3">
        <Link href="/gestores" className="text-sm font-medium text-orange-700 hover:underline">
          Gerenciar gestores →
        </Link>
      </div>

      <div className="mb-4">
        <ClickMagicoBotao />
      </div>

      <form method="get" className="mb-4 flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar por nome, bairro ou cidade…"
          className={inputClass}
        />
        <button
          type="submit"
          className="shrink-0 rounded-lg bg-orange-700 px-4 py-2 text-sm font-medium text-white hover:bg-orange-800"
        >
          Buscar
        </button>
      </form>

      {lojas.length === 0 ? (
        <EmptyState>
          Nenhuma loja cadastrada ainda.
          <br />
          Toque em <strong>+ Nova</strong> para cadastrar a primeira.
        </EmptyState>
      ) : (
        <div className="space-y-5">
          {gruposOrdenados.map((g) => (
            <section key={g.label}>
              <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-500">
                {g.label} ({g.itens.length})
              </h2>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {g.itens.map((loja) => {
                  const vagas = loja.requisicoes.reduce((s, r) => s + r.quantidade, 0);
                  const cores = coresDaMarca(loja.nome);
                  return (
                  <div key={loja.id} className={`flex aspect-square flex-col overflow-hidden rounded-2xl shadow-sm ${cores.bg} ${cores.text} ${!loja.ativo ? "opacity-60" : ""}`}>
                    <Link href={`/lojas/${loja.id}`} prefetch className="flex flex-1 flex-col p-3">
                      <div className="flex items-center gap-2">
                        <MarcaBadge nome={loja.nome} className={`h-7 w-7 shrink-0 rounded p-0.5 ${cores.selo}`} />
                        {vagas > 0 && (
                          <span className="ml-auto rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-gray-900">
                            {vagas} vaga{vagas > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                      <p className="mt-2 line-clamp-2 text-base font-bold leading-tight">
                        {loja.nome}
                      </p>
                      {(loja.bairro || loja.cidade) && (
                        <p className={`mt-0.5 line-clamp-2 text-[11px] ${cores.sub}`}>
                          {[loja.bairro, loja.cidade].filter(Boolean).join(" · ")}
                        </p>
                      )}
                      <div className="mt-auto pt-2">
                        <p className={`truncate text-[11px] ${cores.sub}`}>
                          {loja.gestores.length > 0
                            ? loja.gestores.map((g) => g.nome).join(", ")
                            : "sem gestor"}
                        </p>
                        {!loja.ativo && (
                          <p className={`text-[10px] font-semibold ${cores.sub}`}>inativa</p>
                        )}
                      </div>
                    </Link>
                    <div className="flex gap-1 border-t border-white/20 bg-black/10 px-2 py-1">
                      <form action={toggleLojaAtivo} className="flex-1">
                        <input type="hidden" name="id" value={loja.id} />
                        <button
                          type="submit"
                          className="w-full rounded bg-white/80 px-2 py-0.5 text-[10px] font-medium text-gray-800 hover:bg-white"
                        >
                          {loja.ativo ? "Desativar" : "Reativar"}
                        </button>
                      </form>
                      {ehTI && (
                        <ConfirmDeleteLoja
                          id={loja.id}
                          nome={loja.nome}
                          action={deleteLoja}
                          className="flex-1 rounded bg-white/80 px-2 py-0.5 text-[10px] font-medium text-red-700 hover:bg-white"
                        />
                      )}
                    </div>
                  </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {totalPaginas > 1 && (
        <div className="mt-4 flex items-center justify-between gap-2">
          {page > 1 ? (
            <Link
              href={pageQs(page - 1)}
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
              href={pageQs(page + 1)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Próxima →
            </Link>
          ) : (
            <span />
          )}
        </div>
      )}

      {ehTI && (
        <Link
          href="/lojas/nova"
          className="mt-5 block rounded-xl bg-orange-700 px-4 py-3 text-center font-semibold text-white hover:bg-orange-800"
        >
          + Cadastrar nova loja
        </Link>
      )}
    </div>
  );
}
