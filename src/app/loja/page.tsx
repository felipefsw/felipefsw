import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, EmptyState, btnPrimary } from "@/components/ui";
import { formatBRL, formatDateWithWeekday } from "@/lib/format";
import { getSessao } from "@/lib/auth";

export const dynamic = "force-dynamic";

function statusLabel(s: string) {
  if (s === "ABERTA") return { txt: "Aberta", cls: "bg-amber-100 text-amber-700" };
  if (s === "ATENDIDA") return { txt: "Atendida", cls: "bg-green-100 text-green-700" };
  return { txt: "Cancelada", cls: "bg-gray-100 text-gray-500" };
}

export default async function LojaHome() {
  const sessao = await getSessao();
  if (!sessao || sessao.tipo !== "loja") redirect("/entrar");

  const [requisicoes, escalas] = await Promise.all([
    prisma.requisicao.findMany({
      where: { lojaId: sessao.lojaId },
      include: { _count: { select: { escalas: true, inscricoes: true } } },
      orderBy: [{ data: "asc" }, { criadoEm: "desc" }],
    }),
    prisma.escala.findMany({
      where: { lojaId: sessao.lojaId },
      include: { diarista: { select: { id: true, nome: true, funcao: true } } },
      orderBy: { data: "desc" },
    }),
  ]);

  // Diaristas distintos que já vieram para esta loja.
  const vistos = new Map<string, { nome: string; funcao: string | null; vezes: number }>();
  for (const e of escalas) {
    const cur = vistos.get(e.diarista.id);
    if (cur) cur.vezes += 1;
    else vistos.set(e.diarista.id, { nome: e.diarista.nome, funcao: e.diarista.funcao, vezes: 1 });
  }
  const diaristas = [...vistos.values()].sort((a, b) => b.vezes - a.vezes);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Minha loja</h1>
        <Link href="/loja/requisicao/nova" className={btnPrimary}>
          + Solicitar diaristas
        </Link>
      </div>

      <section>
        <h2 className="mb-2 font-semibold text-gray-900">Minhas requisições</h2>
        {requisicoes.length === 0 ? (
          <EmptyState>
            Nenhuma requisição ainda. Toque em <strong>Solicitar diaristas</strong>.
          </EmptyState>
        ) : (
          <div className="space-y-3">
            {requisicoes.map((r) => {
              const st = statusLabel(r.status);
              return (
                <Card key={r.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm capitalize text-gray-700">
                        {formatDateWithWeekday(r.data)} · {r.horaInicio}–{r.horaFim}
                      </p>
                      <p className="mt-1 text-sm text-gray-600">
                        <strong>{r.quantidade}</strong> diarista(s)
                        {r.funcao ? <> · {r.funcao}</> : null} · {formatBRL(r.valorDiaria)}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {r._count.escalas} escalado(s) · {r._count.inscricoes} inscrito(s)
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${st.cls}`}>
                      {st.txt}
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-2 font-semibold text-gray-900">Diaristas que já vieram</h2>
        {diaristas.length === 0 ? (
          <EmptyState>Ninguém escalado para esta loja ainda.</EmptyState>
        ) : (
          <Card>
            <ul className="divide-y divide-gray-100">
              {diaristas.map((d) => (
                <li key={d.nome} className="flex items-center justify-between gap-3 py-2">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-gray-900">{d.nome}</span>
                    {d.funcao && (
                      <span className="rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700">
                        {d.funcao}
                      </span>
                    )}
                  </span>
                  <span className="text-sm text-gray-500">{d.vezes}× aqui</span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </section>
    </div>
  );
}
