import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { EmptyState, PageHeader, inputClass } from "@/components/ui";
import ConfirmDeleteLoja from "@/components/ConfirmDeleteLoja";
import MarcaBadge from "@/components/MarcaBadge";
import ClickMagicoBotao from "@/components/ClickMagicoBotao";
import { grupoDaLoja } from "@/lib/marcas";
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
              <div className="grid grid-cols-2 gap-2">
                {g.itens.map((loja) => {
                  const vagas = loja.requisicoes.reduce((s, r) => s + r.quantidade, 0);
                  const porFuncao = new Map<string, number>();
                  for (const r of loja.requisicoes)
                    porFuncao.set(r.funcao ?? "Qualquer", (porFuncao.get(r.funcao ?? "Qualquer") ?? 0) + r.quantidade);
                  return (
                  <div key={loja.id} className="rounded-xl border border-gray-200 bg-white p-3">
                    <Link href={`/lojas/${loja.id}`} className="block">
                      <div className="flex items-center gap-2">
                        <MarcaBadge nome={loja.nome} className="h-6 w-6 shrink-0 rounded" />
                        <span className="truncate text-sm font-semibold text-gray-900">
                          {loja.nome}
                        </span>
                      </div>
                      {(loja.bairro || loja.cidade) && (
                        <p className="mt-0.5 truncate text-xs text-gray-500">
                          {[loja.bairro, loja.cidade].filter(Boolean).join(" · ")}
                        </p>
                      )}
                      <p className="mt-0.5 truncate text-[11px] text-gray-500">
                        <span className="text-gray-400">Gestor/gerente:</span>{" "}
                        {loja.gestores.length > 0
                          ? loja.gestores.map((g) => g.nome).join(", ")
                          : "—"}
                      </p>
                      {vagas > 0 ? (
                        <p className="mt-1 text-[11px] font-semibold text-amber-700">
                          {vagas} vaga(s):{" "}
                          {[...porFuncao.entries()].map(([f, n]) => `${f} (${n})`).join(", ")}
                        </p>
                      ) : (
                        <p className="mt-1 text-[11px] text-gray-400">sem vagas abertas</p>
                      )}
                      <p className="mt-0.5 text-[11px] text-gray-400">
                        {loja._count.escalas} agend.
                        {!loja.ativo && " · inativa"}
                      </p>
                    </Link>
                    <div className="mt-2 flex flex-wrap gap-1.5 border-t border-gray-100 pt-2">
                      <form action={toggleLojaAtivo}>
                        <input type="hidden" name="id" value={loja.id} />
                        <button
                          type="submit"
                          className="rounded border border-gray-300 bg-white px-2 py-0.5 text-[11px] font-medium text-gray-600 hover:bg-gray-50"
                        >
                          {loja.ativo ? "Desativar" : "Reativar"}
                        </button>
                      </form>
                      {ehTI && (
                        <ConfirmDeleteLoja
                          id={loja.id}
                          nome={loja.nome}
                          action={deleteLoja}
                          className="rounded border border-red-200 bg-white px-2 py-0.5 text-[11px] font-medium text-red-600 hover:bg-red-50"
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
