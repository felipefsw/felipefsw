import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui";
import { formatBRL, formatDateShort } from "@/lib/format";
import { hojeISO } from "@/lib/dates";
import { grupoDaLoja } from "@/lib/marcas";

export const dynamic = "force-dynamic";

type ComLoja = { loja: { nome: string } };

function agruparPorMarca<T extends ComLoja>(itens: T[]) {
  const m = new Map<string, { label: string; ordem: number; itens: T[] }>();
  for (const it of itens) {
    const g = grupoDaLoja(it.loja.nome);
    const cur = m.get(g.key) ?? { label: g.label, ordem: g.ordem, itens: [] as T[] };
    cur.itens.push(it);
    m.set(g.key, cur);
  }
  return [...m.values()].sort((a, b) => a.ordem - b.ordem);
}

export default async function InicioPage() {
  const hoje = hojeISO();

  const [
    escalasHoje,
    pendentes,
    aPagar,
    diaristasAtivas,
    lojasAtivas,
    requisicoesAbertas,
    faltasHoje,
    mensagensNaoLidas,
  ] = await Promise.all([
    prisma.escala.findMany({
      where: { data: hoje },
      include: { diarista: { select: { nome: true } }, loja: { select: { nome: true } } },
      orderBy: { criadoEm: "asc" },
    }),
    prisma.escala.findMany({
      where: { data: { lte: hoje }, presenca: "PENDENTE" },
      include: { diarista: { select: { nome: true } }, loja: { select: { nome: true } } },
      orderBy: { data: "asc" },
    }),
    prisma.escala.findMany({
      where: { presenca: "PRESENTE", pago: false },
      select: { valor: true, loja: { select: { nome: true } } },
    }),
    prisma.diarista.count({ where: { ativo: true } }),
    prisma.loja.count({ where: { ativo: true } }),
    prisma.requisicao.findMany({
      where: { status: "ABERTA" },
      include: { loja: { select: { nome: true } } },
      orderBy: { data: "asc" },
    }),
    prisma.escala.count({ where: { data: hoje, presenca: "FALTOU" } }),
    prisma.mensagem.count({ where: { autor: "DIARISTA", lida: false } }),
  ]);

  const totalAPagar = aPagar.reduce((s, e) => s + e.valor, 0);
  const vagasAbertasHoje = requisicoesAbertas.filter((r) => r.data === hoje).length;

  const pagarPorLoja = new Map<string, number>();
  for (const e of aPagar) {
    pagarPorLoja.set(e.loja.nome, (pagarPorLoja.get(e.loja.nome) ?? 0) + e.valor);
  }
  const pagarLista = [...pagarPorLoja.entries()].sort((a, b) => b[1] - a[1]);

  const escalasPorMarca = agruparPorMarca(escalasHoje);
  const pendentesPorMarca = agruparPorMarca(pendentes);
  const requisicoesPorMarca = agruparPorMarca(requisicoesAbertas);

  const semaforo =
    vagasAbertasHoje > 0
      ? { cls: "border-red-300 bg-red-50 text-red-800", txt: `🔴 ${vagasAbertasHoje} vaga(s) em aberto para hoje` }
      : faltasHoje > 0
        ? { cls: "border-amber-300 bg-amber-50 text-amber-800", txt: `🟡 ${faltasHoje} falta(s) hoje` }
        : { cls: "border-green-300 bg-green-50 text-green-800", txt: "🟢 Tudo certo para hoje" };

  const badge = (presenca: string) =>
    presenca === "PRESENTE"
      ? "bg-green-100 text-green-700"
      : presenca === "FALTOU"
        ? "bg-red-100 text-red-700"
        : "bg-amber-100 text-amber-700";

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Início</h1>
        <p className="text-sm text-gray-500">Resumo de hoje</p>
      </div>

      <Link href={vagasAbertasHoje > 0 ? "/requisicoes" : "/escala"}>
        <div className={`rounded-xl border p-3 text-sm font-semibold ${semaforo.cls}`}>
          {semaforo.txt}
        </div>
      </Link>

      <Card className="border-orange-200 bg-orange-50">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-orange-800">Total a pagar</p>
          <p className="text-2xl font-bold text-orange-800">{formatBRL(totalAPagar)}</p>
        </div>
        {pagarLista.length > 0 && (
          <ul className="mt-2 divide-y divide-orange-100 border-t border-orange-100">
            {pagarLista.map(([nome, valor]) => (
              <li key={nome} className="flex items-center justify-between py-1 text-sm">
                <span className="truncate text-orange-900">{nome}</span>
                <span className="font-semibold text-orange-800">{formatBRL(valor)}</span>
              </li>
            ))}
          </ul>
        )}
        <Link href="/pagamentos" className="mt-2 inline-block text-xs font-medium text-orange-700 underline">
          Ir para pagamentos →
        </Link>
      </Card>

      <div className="grid grid-cols-3 gap-3 text-center">
        <Link href="/escala/novo">
          <Card className="h-full">
            <p className="text-2xl">📅</p>
            <p className="mt-1 text-sm font-medium text-gray-700">Agendar</p>
          </Card>
        </Link>
        <Link href="/diaristas">
          <Card className="h-full">
            <p className="text-2xl">👤</p>
            <p className="mt-1 text-sm font-medium text-gray-700">Diaristas</p>
          </Card>
        </Link>
        <Link href="/lojas">
          <Card className="h-full">
            <p className="text-2xl">🏬</p>
            <p className="mt-1 text-sm font-medium text-gray-700">Lojas</p>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Link href="/bonificacoes" className="rounded-xl border border-gray-200 bg-white px-2 py-3 text-center text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">
          🎁 Bônus
        </Link>
        <Link href="/ranking" className="rounded-xl border border-gray-200 bg-white px-2 py-3 text-center text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">
          🏆 Ranking
        </Link>
        <Link href="/mensagens" className="relative rounded-xl border border-gray-200 bg-white px-2 py-3 text-center text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">
          💬 Mensagens
          {mensagensNaoLidas > 0 && (
            <span className="absolute -right-1 -top-1 rounded-full bg-red-500 px-1.5 py-0.5 text-xs font-bold text-white">
              {mensagensNaoLidas}
            </span>
          )}
        </Link>
      </div>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Escalados hoje ({escalasHoje.length})</h2>
          <Link href="/escala" className="text-sm font-medium text-orange-700 hover:underline">
            Ver escala
          </Link>
        </div>
        {escalasHoje.length === 0 ? (
          <Card>
            <p className="text-sm text-gray-500">Ninguém escalado para hoje.</p>
          </Card>
        ) : (
          <Card>
            {escalasPorMarca.map((g) => (
              <div key={g.label} className="mb-2 last:mb-0">
                <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">{g.label}</p>
                <ul className="divide-y divide-gray-100">
                  {g.itens.map((e) => (
                    <li key={e.id} className="flex items-center justify-between gap-2 py-1.5 text-sm">
                      <span className="min-w-0 truncate">
                        <span className="text-gray-500">{e.loja.nome}</span>
                        <span className="text-gray-400"> — </span>
                        <span className="font-medium text-gray-900">{e.diarista.nome}</span>
                      </span>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${badge(e.presenca)}`}>
                        {e.presenca === "PRESENTE" ? "Presente" : e.presenca === "FALTOU" ? "Faltou" : "Pendente"}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </Card>
        )}
      </section>

      {pendentes.length > 0 && (
        <section>
          <h2 className="mb-2 text-lg font-semibold text-gray-900">Presenças pendentes ({pendentes.length})</h2>
          <Card>
            {pendentesPorMarca.map((g) => (
              <div key={g.label} className="mb-2 last:mb-0">
                <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">{g.label}</p>
                <ul className="divide-y divide-gray-100">
                  {g.itens.map((e) => (
                    <li key={e.id} className="flex items-center justify-between gap-2 py-1.5 text-sm">
                      <span className="min-w-0 truncate">
                        <span className="text-gray-500">{e.loja.nome}</span>
                        <span className="text-gray-400"> — </span>
                        <span className="font-medium text-gray-900">{e.diarista.nome}</span>
                      </span>
                      <span className="shrink-0 text-xs text-gray-400">{formatDateShort(e.data)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </Card>
        </section>
      )}

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Requisições abertas ({requisicoesAbertas.length})</h2>
          <Link href="/requisicoes" className="text-sm font-medium text-orange-700 hover:underline">
            Ver todas
          </Link>
        </div>
        {requisicoesAbertas.length === 0 ? (
          <Card>
            <p className="text-sm text-gray-500">Nenhuma requisição aberta.</p>
          </Card>
        ) : (
          <Card>
            {requisicoesPorMarca.map((g) => (
              <div key={g.label} className="mb-2 last:mb-0">
                <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">{g.label}</p>
                <ul className="divide-y divide-gray-100">
                  {g.itens.map((r) => (
                    <li key={r.id} className="flex items-center justify-between gap-2 py-1.5 text-sm">
                      <span className="min-w-0 truncate text-gray-700">
                        {r.loja.nome}
                        <span className="text-gray-400">
                          {" · "}
                          {r.funcao ?? "qualquer"} ({r.quantidade})
                        </span>
                      </span>
                      <span className="shrink-0 text-xs text-gray-400">{formatDateShort(r.data)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </Card>
        )}
      </section>

      <p className="text-center text-xs text-gray-400">
        {diaristasAtivas} diarista(s) e {lojasAtivas} loja(s) ativas.
      </p>
    </div>
  );
}
