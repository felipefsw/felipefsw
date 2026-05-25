import Link from "next/link";
import Avatar from "@/components/Avatar";
import FotoUpload from "@/components/FotoUpload";
import PushToggle from "@/components/PushToggle";
import { prisma } from "@/lib/prisma";
import { exigirDiarista } from "@/lib/diaristaSessao";
import { medalhasDoDiarista } from "@/lib/medalhas";
import { MIN_AVALIACOES, notaPublica } from "@/lib/notas";

export const dynamic = "force-dynamic";

export default async function PerfilPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const diarista = await exigirDiarista(token);

  const [medalhas, agg, diarias] = await Promise.all([
    medalhasDoDiarista(diarista.id),
    prisma.avaliacao.aggregate({
      where: { diaristaId: diarista.id },
      _avg: { estrelas: true },
      _count: { _all: true },
    }),
    prisma.escala.count({ where: { diaristaId: diarista.id, presenca: "PRESENTE" } }),
  ]);

  const totalAval = agg._count._all;
  const nota = notaPublica((agg._avg.estrelas ?? 0) * totalAval, totalAval);

  return (
    <div className="space-y-6">
      <section className="flex items-center gap-3">
        <Avatar nome={diarista.nome} fotoUrl={diarista.fotoUrl} className="h-16 w-16" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-bold text-gray-900">{diarista.nome}</h1>
          <p className="text-sm text-gray-500">Seu perfil</p>
        </div>
        <FotoUpload token={token} />
      </section>

      <section className="grid grid-cols-2 gap-3 text-center">
        <div className="rounded-xl border border-gray-200 bg-white p-3">
          <p className="text-2xl font-bold text-amber-600">
            {nota != null ? `★ ${nota.toFixed(1)}` : "—"}
          </p>
          <p className="text-xs text-gray-500">
            {nota != null
              ? "sua nota"
              : `nota após ${MIN_AVALIACOES} avaliações (${totalAval}/${MIN_AVALIACOES})`}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-3">
          <p className="text-2xl font-bold text-gray-900">{diarias}</p>
          <p className="text-xs text-gray-500">diárias na rede</p>
        </div>
      </section>

      <Link
        href={`/d/${token}/editar`}
        className="block rounded-xl bg-orange-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-orange-700"
      >
        ✏️ Editar meus dados / Pix
      </Link>

      {medalhas.length > 0 && (
        <section>
          <h2 className="mb-2 font-semibold text-gray-900">Suas conquistas</h2>
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
        </section>
      )}

      <section>
        <h2 className="mb-2 font-semibold text-gray-900">Avisos de novas vagas</h2>
        <PushToggle token={token} />
        {process.env.NEXT_PUBLIC_TELEGRAM_BOT && (
          <a
            href={`https://t.me/${process.env.NEXT_PUBLIC_TELEGRAM_BOT}?start=${token}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 block rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-center text-sm font-medium text-sky-800"
          >
            ✈️ Ativar avisos no Telegram
          </a>
        )}
      </section>

      <section>
        <Link
          href={`/d/${token}/guia`}
          className="block rounded-xl border border-gray-200 bg-white px-4 py-3 text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          📖 Guia do diarista
        </Link>
      </section>
    </div>
  );
}
