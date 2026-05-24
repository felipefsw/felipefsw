import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui";
import { formatBRL } from "@/lib/format";
import { hojeISO } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function InicioPage() {
  const hoje = hojeISO();

  const [escalasHoje, pendentes, aPagar, diaristasAtivas, lojasAtivas, requisicoesAbertas] =
    await Promise.all([
      prisma.escala.findMany({
        where: { data: hoje },
        include: { diarista: true, loja: true },
        orderBy: { criadoEm: "asc" },
      }),
      prisma.escala.count({ where: { data: { lte: hoje }, presenca: "PENDENTE" } }),
      prisma.escala.findMany({
        where: { presenca: "PRESENTE", pago: false },
        select: { valor: true },
      }),
      prisma.diarista.count({ where: { ativo: true } }),
      prisma.loja.count({ where: { ativo: true } }),
      prisma.requisicao.count({ where: { status: "ABERTA" } }),
    ]);

  const totalAPagar = aPagar.reduce((s, e) => s + e.valor, 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Início</h1>
        <p className="text-sm text-gray-500">Resumo de hoje</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link href="/escala">
          <Card className="h-full">
            <p className="text-sm text-gray-500">Escalados hoje</p>
            <p className="mt-1 text-3xl font-bold text-gray-900">{escalasHoje.length}</p>
          </Card>
        </Link>
        <Link href="/escala">
          <Card className={`h-full ${pendentes > 0 ? "border-amber-300 bg-amber-50" : ""}`}>
            <p className="text-sm text-gray-500">Presenças pendentes</p>
            <p
              className={`mt-1 text-3xl font-bold ${
                pendentes > 0 ? "text-amber-700" : "text-gray-900"
              }`}
            >
              {pendentes}
            </p>
          </Card>
        </Link>
        <Link href="/requisicoes" className="col-span-2">
          <Card className={`h-full ${requisicoesAbertas > 0 ? "border-amber-300 bg-amber-50" : ""}`}>
            <div className="flex items-center justify-between">
              <p
                className={`text-sm font-medium ${
                  requisicoesAbertas > 0 ? "text-amber-800" : "text-gray-500"
                }`}
              >
                Requisições abertas
              </p>
              <p
                className={`text-2xl font-bold ${
                  requisicoesAbertas > 0 ? "text-amber-700" : "text-gray-900"
                }`}
              >
                {requisicoesAbertas}
              </p>
            </div>
          </Card>
        </Link>
        <Link href="/pagamentos" className="col-span-2">
          <Card className="border-orange-200 bg-orange-50">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-orange-800">Total a pagar</p>
              <p className="text-2xl font-bold text-orange-800">{formatBRL(totalAPagar)}</p>
            </div>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <Link href="/escala/novo">
          <Card className="h-full">
            <p className="text-2xl">📅</p>
            <p className="mt-1 text-sm font-medium text-gray-700">Agendar</p>
          </Card>
        </Link>
        <Link href="/diaristas/nova">
          <Card className="h-full">
            <p className="text-2xl">👤</p>
            <p className="mt-1 text-sm font-medium text-gray-700">Diarista</p>
          </Card>
        </Link>
        <Link href="/lojas/nova">
          <Card className="h-full">
            <p className="text-2xl">🏬</p>
            <p className="mt-1 text-sm font-medium text-gray-700">Loja</p>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/bonificacoes"
          className="rounded-xl border border-gray-200 bg-white px-2 py-3 text-center text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          🎁 Bônus
        </Link>
        <Link
          href="/ranking"
          className="rounded-xl border border-gray-200 bg-white px-2 py-3 text-center text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          🏆 Ranking
        </Link>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Hoje</h2>
          <Link href="/escala" className="text-sm font-medium text-orange-700 hover:underline">
            Ver escala
          </Link>
        </div>
        {escalasHoje.length === 0 ? (
          <Card>
            <p className="text-sm text-gray-500">Nenhuma diarista escalada para hoje.</p>
          </Card>
        ) : (
          <Card>
            <ul className="divide-y divide-gray-100">
              {escalasHoje.map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-gray-900">{e.diarista.nome}</p>
                    <p className="truncate text-sm text-gray-500">{e.loja.nome}</p>
                  </div>
                  {e.presenca === "PRESENTE" ? (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                      Presente
                    </span>
                  ) : e.presenca === "FALTOU" ? (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                      Faltou
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                      Pendente
                    </span>
                  )}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-gray-400">
              {diaristasAtivas} diarista(s) e {lojasAtivas} loja(s) ativas.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
