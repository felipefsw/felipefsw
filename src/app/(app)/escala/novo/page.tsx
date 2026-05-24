import Link from "next/link";
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
import { hojeISO, isISODate, maxAgendamentoISO } from "@/lib/dates";
import { VALORES_DIARIA } from "@/lib/valoresDiaria";
import { formatBRL, formatDateShort } from "@/lib/format";
import { grupoDaLoja } from "@/lib/marcas";
import Avatar from "@/components/Avatar";
import SubmitButton from "@/components/SubmitButton";
import { createEscala, escalarNaVaga } from "../actions";

export const dynamic = "force-dynamic";

export default async function NovoAgendamentoPage({
  searchParams,
}: {
  searchParams: Promise<{ data?: string }>;
}) {
  const sp = await searchParams;
  const hoje = hojeISO();
  const max = maxAgendamentoISO();
  const dataInicial =
    sp.data && isISODate(sp.data) && sp.data >= hoje && sp.data <= max ? sp.data : hoje;

  const [diaristas, lojas, requisicoes] = await Promise.all([
    prisma.diarista.findMany({
      where: { ativo: true },
      orderBy: { nome: "asc" },
      include: {
        escalas: { select: { lojaId: true, data: true } },
        bloqueios: {
          where: { OR: [{ ate: null }, { ate: { gt: new Date() } }] },
          select: { lojaId: true },
        },
      },
    }),
    prisma.loja.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
    prisma.requisicao.findMany({
      where: { status: "ABERTA", data: { gte: hoje } },
      include: { loja: { select: { nome: true } }, _count: { select: { escalas: true } } },
      orderBy: { data: "asc" },
    }),
  ]);

  if (diaristas.length === 0 || lojas.length === 0) {
    return (
      <div>
        <PageHeader title="Agendar" />
        <EmptyState>
          Para agendar, você precisa de pelo menos{" "}
          {diaristas.length === 0 && (
            <>
              uma <Link href="/diaristas/nova" className="font-medium text-orange-700 underline">diarista</Link>
            </>
          )}
          {diaristas.length === 0 && lojas.length === 0 && " e "}
          {lojas.length === 0 && (
            <>
              uma <Link href="/lojas/nova" className="font-medium text-orange-700 underline">loja</Link>
            </>
          )}{" "}
          cadastrada.
        </EmptyState>
      </div>
    );
  }

  // Info de cada diarista para sugerir nas vagas.
  const info = diaristas.map((d) => {
    const freq = new Map<string, number>();
    const datas = new Set<string>();
    for (const e of d.escalas) {
      freq.set(e.lojaId, (freq.get(e.lojaId) ?? 0) + 1);
      datas.add(e.data);
    }
    return {
      id: d.id,
      nome: d.nome,
      funcao: d.funcao,
      fotoUrl: d.fotoUrl,
      freq,
      datas,
      bloq: new Set(d.bloqueios.map((b) => b.lojaId)),
    };
  });

  // Vagas abertas com sugestões (top diaristas da loja, livres no dia).
  const vagas = requisicoes
    .map((r) => {
      const faltam = r.quantidade - r._count.escalas;
      const sugeridos = info
        .filter(
          (d) =>
            (!r.funcao || d.funcao === r.funcao) &&
            !d.bloq.has(r.lojaId) &&
            !d.datas.has(r.data),
        )
        .sort((a, b) => (b.freq.get(r.lojaId) ?? 0) - (a.freq.get(r.lojaId) ?? 0))
        .slice(0, 4);
      return { r, faltam, sugeridos };
    })
    .filter((v) => v.faltam > 0);

  const grupos = new Map<string, { label: string; ordem: number; itens: typeof vagas }>();
  for (const v of vagas) {
    const g = grupoDaLoja(v.r.loja.nome);
    const cur = grupos.get(g.key) ?? { label: g.label, ordem: g.ordem, itens: [] as typeof vagas };
    cur.itens.push(v);
    grupos.set(g.key, cur);
  }
  const gruposOrdenados = [...grupos.values()].sort((a, b) => a.ordem - b.ordem);

  return (
    <div className="space-y-4">
      <PageHeader title="Agendar" subtitle="Escale nas vagas abertas com 1 toque" />

      {gruposOrdenados.length === 0 ? (
        <EmptyState>Nenhuma vaga aberta. Use o agendamento manual abaixo.</EmptyState>
      ) : (
        gruposOrdenados.map((g) => (
          <section key={g.label}>
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-500">
              {g.label}
            </h2>
            <div className="space-y-2">
              {g.itens.map(({ r, faltam, sugeridos }) => (
                <Card key={r.id}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-gray-900">{r.loja.nome}</p>
                    <span className="text-xs text-gray-400">{formatDateShort(r.data)}</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {r.funcao ?? "qualquer função"} · {r.horaInicio}–{r.horaFim} ·{" "}
                    {formatBRL(r.valorDiaria)} · faltam {faltam}
                  </p>
                  <div className="mt-2 space-y-1.5">
                    {sugeridos.length === 0 ? (
                      <p className="text-xs text-gray-400">Sem sugestões livres neste dia.</p>
                    ) : (
                      sugeridos.map((d) => (
                        <div key={d.id} className="flex items-center justify-between gap-2">
                          <span className="flex min-w-0 items-center gap-2">
                            <Avatar nome={d.nome} fotoUrl={d.fotoUrl} className="h-7 w-7" />
                            <span className="min-w-0">
                              <span className="block truncate text-sm text-gray-800">{d.nome}</span>
                              <span className="block text-[11px] text-gray-400">
                                {d.freq.get(r.lojaId) ?? 0}× nesta loja
                                {d.funcao ? ` · ${d.funcao}` : ""}
                              </span>
                            </span>
                          </span>
                          <form action={escalarNaVaga.bind(null, r.id, d.id)}>
                            <SubmitButton
                              pendingLabel="…"
                              className="shrink-0 rounded-lg bg-orange-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-orange-800"
                            >
                              Escalar
                            </SubmitButton>
                          </form>
                        </div>
                      ))
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </section>
        ))
      )}

      <details className="rounded-xl border border-gray-200 bg-white p-4">
        <summary className="cursor-pointer text-sm font-semibold text-gray-900">
          Agendar manualmente (escolher diarista e valor)
        </summary>
        <form action={createEscala} className="mt-3 space-y-4">
          <div>
            <label className={labelClass} htmlFor="diaristaId">
              Diarista *
            </label>
            <select id="diaristaId" name="diaristaId" required className={inputClass}>
              {diaristas.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass} htmlFor="lojaId">
              Loja *
            </label>
            <select id="lojaId" name="lojaId" required className={inputClass}>
              {lojas.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="data">
                Data *
              </label>
              <input
                id="data"
                name="data"
                type="date"
                required
                min={hoje}
                max={max}
                defaultValue={dataInicial}
                className={inputClass}
              />
            </div>
            <div>
              <p className={labelClass}>Valor da diária (toque em um)</p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                <label>
                  <input type="radio" name="valor" value="" defaultChecked className="peer sr-only" />
                  <span className="block cursor-pointer rounded-lg border border-gray-300 bg-white px-2 py-2 text-center text-xs font-medium text-gray-700 peer-checked:border-orange-600 peer-checked:bg-orange-50 peer-checked:text-orange-800 peer-checked:ring-2 peer-checked:ring-orange-300">
                    Padrão
                  </span>
                </label>
                {VALORES_DIARIA.map((v) => (
                  <label key={v.value}>
                    <input type="radio" name="valor" value={v.value} className="peer sr-only" />
                    <span className="block cursor-pointer rounded-lg border border-gray-300 bg-white px-2 py-2 text-center text-gray-700 peer-checked:border-orange-600 peer-checked:bg-orange-50 peer-checked:text-orange-800 peer-checked:ring-2 peer-checked:ring-orange-300">
                      <span className="block text-sm font-bold">R$ {v.total}</span>
                      <span className="block text-[10px] text-gray-500 peer-checked:text-orange-700">
                        {v.base}+10
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button type="submit" className={btnPrimary}>
              Agendar
            </button>
            <Link href="/escala" className={btnSecondary}>
              Cancelar
            </Link>
          </div>
        </form>
      </details>
    </div>
  );
}
