import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { corDoTurno } from "@/lib/horarios";
import { medalhasDoDiarista } from "@/lib/medalhas";
import { contextoLoja, getSessao } from "@/lib/auth";
import Avatar from "@/components/Avatar";
import MarcaBadge from "@/components/MarcaBadge";

export const dynamic = "force-dynamic";

export default async function CandidatoPage({
  params,
}: {
  params: Promise<{ diaristaId: string }>;
}) {
  const ctx = contextoLoja(await getSessao());
  if (!ctx) redirect("/entrar");

  const { diaristaId } = await params;
  const diarista = await prisma.diarista.findUnique({
    where: { id: diaristaId },
    include: {
      lojasPreferidas: { select: { nome: true } },
      avaliacoes: {
        include: { escala: { include: { loja: { select: { nome: true } } } } },
        orderBy: { criadoEm: "desc" },
      },
      escalas: {
        include: { loja: { select: { nome: true } } },
        orderBy: { data: "desc" },
        take: 50,
      },
    },
  });
  if (!diarista) notFound();

  const medalhas = await medalhasDoDiarista(diaristaId);
  const presentes = diarista.escalas.filter((e) => e.presenca === "PRESENTE");
  const totalDiarias = presentes.length;
  const nota =
    diarista.avaliacoes.length >= 5
      ? diarista.avaliacoes.slice(0, 5).reduce((s, a) => s + a.estrelas, 0) / 5
      : null;
  const locais = [...new Set(presentes.map((e) => e.loja.nome))];
  const primeira = presentes.length ? presentes[presentes.length - 1].data : null;

  return (
    <div className="space-y-4">
      <Link href="/loja" className="text-sm font-medium text-orange-700 underline">
        ← Voltar
      </Link>

      <div className="flex items-center gap-3">
        <Avatar nome={diarista.nome} fotoUrl={diarista.fotoUrl} className="h-16 w-16" />
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-gray-900">{diarista.nome}</h1>
          <p className="text-sm text-gray-500">
            {diarista.funcao ?? "Diarista"}
            {nota !== null ? ` · ★ ${nota.toFixed(1)} de 5` : " · sem nota ainda"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-gray-200 bg-white p-3 text-center">
          <p className="text-2xl font-bold text-orange-700">{totalDiarias}</p>
          <p className="text-xs text-gray-500">diárias feitas</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-3 text-center">
          <p className="text-2xl font-bold text-orange-700">{locais.length}</p>
          <p className="text-xs text-gray-500">lojas atendidas</p>
        </div>
      </div>

      {primeira && (
        <p className="text-center text-xs text-gray-400">Na rede desde {formatDate(primeira)}</p>
      )}

      {medalhas.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {medalhas.map((m) => (
            <span
              key={m.nome}
              className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-sm font-medium text-amber-800"
            >
              {m.emoji} {m.nome}
            </span>
          ))}
        </div>
      )}

      {diarista.lojasPreferidas.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <h2 className="mb-1 font-semibold text-gray-900">Lojas preferidas</h2>
          <p className="text-sm text-gray-600">
            {diarista.lojasPreferidas.map((l) => l.nome).join(", ")}
          </p>
        </div>
      )}

      {nota !== null && diarista.avaliacoes.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <h2 className="mb-2 font-semibold text-gray-900">Avaliações recentes</h2>
          <ul className="divide-y divide-gray-100">
            {diarista.avaliacoes.slice(0, 8).map((a) => (
              <li key={a.id} className="py-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-gray-600">
                    {formatDate(a.escala.data)} · {a.escala.loja.nome}
                  </span>
                  <span className="rounded-full bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-700">
                    ★ {a.estrelas}
                  </span>
                </div>
                {a.comentario && <p className="mt-1 text-sm text-gray-500">{a.comentario}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="mb-2 font-semibold text-gray-900">Histórico de diárias</h2>
        {diarista.escalas.length === 0 ? (
          <p className="text-sm text-gray-500">Sem diárias registradas ainda.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {diarista.escalas.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className="flex min-w-0 items-center gap-2">
                  <MarcaBadge nome={e.loja.nome} className="h-5 w-5 shrink-0 rounded" />
                  <span className="min-w-0">
                    <span className="block truncate text-gray-700">{e.loja.nome}</span>
                    <span className="text-xs text-gray-400">
                      {formatDate(e.data)}
                      {e.horaInicio && e.horaFim ? (
                        <>
                          {" · "}
                          <span className={`rounded px-1 ${corDoTurno(e.horaInicio).chip}`}>
                            {e.horaInicio}–{e.horaFim}
                          </span>
                        </>
                      ) : null}
                    </span>
                  </span>
                </span>
                <span className="shrink-0">
                  {e.presenca === "PRESENTE" ? (
                    <span className="text-green-600">presente</span>
                  ) : e.presenca === "FALTOU" ? (
                    <span className="text-red-500">faltou</span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
