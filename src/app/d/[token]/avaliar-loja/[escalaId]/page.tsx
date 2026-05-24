import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDateWithWeekday } from "@/lib/format";
import { ASPECTOS_LOJA } from "@/lib/aspectosLoja";
import { salvarAvaliacaoLoja } from "../../actions";

export const dynamic = "force-dynamic";

const NOTAS = Array.from({ length: 11 }, (_, i) => i); // 0..10

export default async function AvaliarLojaPage({
  params,
}: {
  params: Promise<{ token: string; escalaId: string }>;
}) {
  const { token, escalaId } = await params;

  const escala = await prisma.escala.findUnique({
    where: { id: escalaId },
    include: { diarista: true, loja: true, avaliacaoLoja: true },
  });

  // Autorização pelo link.
  if (!escala || escala.diarista.token !== token) {
    return (
      <div className="mx-auto max-w-md p-6 text-center">
        <h1 className="mt-10 text-xl font-bold text-gray-900">Link inválido</h1>
        <p className="mt-2 text-gray-500">Não foi possível abrir esta avaliação.</p>
      </div>
    );
  }

  const atual = escala.avaliacaoLoja as Record<string, number> | null;

  return (
    <div className="mx-auto max-w-md">
      <header className="bg-neutral-900 px-5 py-6 text-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/rwp-logo.svg" alt="RWP" className="mb-3 h-7 w-auto" />
        <h1 className="text-xl font-bold">Avaliar a loja</h1>
        <p className="mt-1 text-sm text-orange-100">
          {escala.loja.nome} · <span className="capitalize">{formatDateWithWeekday(escala.data)}</span>
        </p>
      </header>

      <main className="p-5">
        <p className="mb-4 text-sm text-gray-500">
          Sua opinião é confidencial e ajuda a melhorar as lojas. Notas de 0 a 10.
        </p>

        <form action={salvarAvaliacaoLoja} className="space-y-4">
          <input type="hidden" name="escalaId" value={escala.id} />
          <input type="hidden" name="token" value={token} />

          {ASPECTOS_LOJA.map((a) => (
            <div key={a.key} className="flex items-center justify-between gap-3">
              <label className="text-sm font-medium text-gray-700" htmlFor={a.key}>
                {a.label}
              </label>
              <select
                id={a.key}
                name={a.key}
                required
                defaultValue={atual ? String(atual[a.key]) : ""}
                className="w-24 rounded-lg border border-gray-300 bg-white px-3 py-2 outline-none focus:border-orange-600 focus:ring-2 focus:ring-orange-100"
              >
                <option value="" disabled>
                  —
                </option>
                {NOTAS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          ))}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="comentario">
              Comentário (opcional)
            </label>
            <textarea
              id="comentario"
              name="comentario"
              rows={3}
              defaultValue={escala.avaliacaoLoja?.comentario ?? ""}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 outline-none focus:border-orange-600 focus:ring-2 focus:ring-orange-100"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              className="flex-1 rounded-lg bg-orange-700 py-2.5 font-medium text-white hover:bg-orange-800"
            >
              Enviar avaliação
            </button>
            <Link
              href={`/d/${token}`}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 font-medium text-gray-700 hover:bg-gray-50"
            >
              Voltar
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
