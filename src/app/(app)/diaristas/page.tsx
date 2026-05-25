import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, EmptyState, PageHeader, inputClass } from "@/components/ui";
import ConfirmSubmit from "@/components/ConfirmSubmit";
import SubmitButton from "@/components/SubmitButton";
import CopyButton from "@/components/CopyButton";
import CompartilharCadastro from "@/components/CompartilharCadastro";
import DiaristaInfo from "@/components/DiaristaInfo";
import BotaoBloquearGlobal from "@/components/BotaoBloquearGlobal";
import { FUNCOES } from "@/lib/funcoes";
import { mediaDaAvaliacao } from "@/lib/bonificacoes";
import { bloqueadaGlobalmente } from "@/lib/limites";
import { formatDate } from "@/lib/format";
import {
  aprovarDiaristaCadastro,
  deleteDiarista,
  desbloquearGlobal,
  toggleDiaristaAtivo,
} from "./actions";

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
    aprovado: true, // pendentes aparecem na seção de aprovação, não na lista geral
    ...(filtro ? { funcao: filtro } : {}),
    ...(q ? { nome: { contains: q, mode: "insensitive" as const } } : {}),
  };

  const [total, diaristas, pendentes] = await Promise.all([
    prisma.diarista.count({ where }),
    prisma.diarista.findMany({
      where,
      orderBy: [{ ativo: "desc" }, { nome: "asc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        avaliacoes: { orderBy: { criadoEm: "desc" }, take: 5 },
        escalas: { where: { presenca: "PRESENTE" }, select: { loja: { select: { nome: true } } } },
        _count: { select: { escalas: { where: { presenca: "PRESENTE" } } } },
      },
    }),
    // Autocadastros aguardando aprovação do RH.
    prisma.diarista.findMany({
      where: { aprovado: false, ativo: true },
      orderBy: { criadoEm: "desc" },
      select: {
        id: true,
        nome: true,
        cpf: true,
        funcao: true,
        telefone: true,
        fotoUrl: true,
        criadoEm: true,
      },
    }),
  ]);
  const totalPaginas = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Nota (média das 5 últimas), nº de diárias e a loja onde mais trabalha.
  const resumo = (d: (typeof diaristas)[number]) => {
    const diarias = d._count.escalas;
    const nota =
      d.avaliacoes.length >= 5
        ? d.avaliacoes.reduce((s, a) => s + mediaDaAvaliacao(a), 0) / d.avaliacoes.length
        : null;
    const cont = new Map<string, number>();
    for (const e of d.escalas) cont.set(e.loja.nome, (cont.get(e.loja.nome) ?? 0) + 1);
    const topLoja = [...cont.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    return { diarias, nota, topLoja };
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

      <div className="mb-4">
        <CompartilharCadastro />
      </div>

      {pendentes.length > 0 && (
        <section className="mb-4">
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-amber-700">
            Aguardando aprovação ({pendentes.length})
          </h2>
          <div className="space-y-2">
            {pendentes.map((p) => (
              <Card key={p.id} className="border-amber-200 bg-amber-50 p-3">
                <div className="flex items-start justify-between gap-2">
                  <DiaristaInfo
                    nome={p.nome}
                    fotoUrl={p.fotoUrl}
                    funcao={p.funcao}
                    nota={null}
                    diarias={0}
                    avatarClassName="h-9 w-9"
                    extra={
                      <span className="block text-[11px] text-gray-500">
                        {p.cpf ? `CPF ${p.cpf}` : "sem CPF"}
                        {p.telefone ? ` · ${p.telefone}` : ""}
                      </span>
                    }
                  />
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-amber-200 pt-2">
                  <Link
                    href={`/diaristas/${p.id}`}
                    className="rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-700"
                  >
                    Ver ficha
                  </Link>
                  <form action={aprovarDiaristaCadastro}>
                    <input type="hidden" name="id" value={p.id} />
                    <SubmitButton className="rounded-lg bg-green-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-green-700">
                      ✓ Aprovar
                    </SubmitButton>
                  </form>
                  <form action={deleteDiarista}>
                    <input type="hidden" name="id" value={p.id} />
                    <ConfirmSubmit
                      className="rounded-lg border border-red-200 bg-white px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                      message={`Recusar e excluir o cadastro de "${p.nome}"?`}
                    >
                      Recusar
                    </ConfirmSubmit>
                  </form>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

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
        <div className="space-y-2">
          {diaristas.map((d) => {
            const { diarias, nota, topLoja } = resumo(d);
            const bloqueada = bloqueadaGlobalmente(d.bloqueadoAte);
            const paraSempre = d.bloqueadoAte && d.bloqueadoAte.getUTCFullYear() >= 9999;
            return (
              <Card key={d.id} className="p-3">
                <div className="flex items-start justify-between gap-3">
                  <DiaristaInfo
                    nome={d.nome}
                    fotoUrl={d.fotoUrl}
                    funcao={d.funcao}
                    nota={nota}
                    diarias={diarias}
                    avatarClassName="h-10 w-10"
                    extra={
                      <>
                        {!d.ativo && (
                          <span className="mt-0.5 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-500">
                            inativa
                          </span>
                        )}
                        {topLoja && (
                          <span className="block text-[11px] text-gray-400">Mais em: {topLoja}</span>
                        )}
                      </>
                    }
                  />
                  <Link
                    href={`/diaristas/${d.id}`}
                    className="shrink-0 text-sm font-medium text-orange-700 hover:underline"
                  >
                    Editar
                  </Link>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-gray-100 pt-2">
                  {d.ativo && (
                    <Link
                      href={`/escala/novo?diarista=${d.id}`}
                      className="rounded-lg bg-orange-700 px-2.5 py-1 text-xs font-medium text-white hover:bg-orange-800"
                    >
                      Alocar
                    </Link>
                  )}
                  {d.chavePix && (
                    <CopyButton
                      text={d.chavePix}
                      label="Pix"
                      className="rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-700"
                    />
                  )}
                  {bloqueada ? (
                    <span className="flex items-center gap-1.5">
                      <span className="rounded-lg bg-red-50 px-2 py-1 text-xs font-medium text-red-600">
                        {paraSempre
                          ? "Bloqueada (sempre)"
                          : `Bloqueada até ${formatDate(d.bloqueadoAte!.toISOString().slice(0, 10))}`}
                      </span>
                      <form action={desbloquearGlobal}>
                        <input type="hidden" name="id" value={d.id} />
                        <button type="submit" className="text-xs text-orange-700 underline">
                          desbloquear
                        </button>
                      </form>
                    </span>
                  ) : (
                    <BotaoBloquearGlobal id={d.id} />
                  )}
                  <form action={toggleDiaristaAtivo}>
                    <input type="hidden" name="id" value={d.id} />
                    <button
                      type="submit"
                      className="rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      {d.ativo ? "Desativar" : "Reativar"}
                    </button>
                  </form>
                  <form action={deleteDiarista}>
                    <input type="hidden" name="id" value={d.id} />
                    <ConfirmSubmit
                      className="rounded-lg border border-red-200 bg-white px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                      message={`Excluir "${d.nome}"? O histórico de agendamentos dessa pessoa também será apagado.`}
                    >
                      Excluir
                    </ConfirmSubmit>
                  </form>
                </div>
              </Card>
            );
          })}
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
