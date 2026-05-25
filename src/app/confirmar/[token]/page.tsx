import { prisma } from "@/lib/prisma";
import { formatBRL, formatDateWithWeekday } from "@/lib/format";
import { confirmarPorLink } from "./actions";

export const dynamic = "force-dynamic";

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 outline-none focus:border-orange-600 focus:ring-2 focus:ring-orange-100";

export default async function ConfirmarPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const escala = await prisma.escala.findUnique({
    where: { tokenConfirmacao: token },
    include: { loja: true, diarista: { select: { nome: true } } },
  });

  if (!escala) {
    return (
      <div className="mx-auto max-w-md p-6 text-center">
        <h1 className="mt-10 text-xl font-bold text-gray-900">Link inválido</h1>
        <p className="mt-2 text-gray-500">Este link de confirmação não foi encontrado.</p>
      </div>
    );
  }

  const endereco = [escala.loja.endereco, escala.loja.bairro, escala.loja.cidade]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="mx-auto max-w-md">
      <header className="bg-neutral-900 px-5 py-6 text-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/rwp-logo.svg" alt="RWP" className="mb-3 h-7 w-auto" />
        <h1 className="text-xl font-bold">Confirmar diária</h1>
      </header>

      <main className="space-y-4 p-5">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="font-medium text-gray-900">{escala.loja.nome}</p>
          {endereco && <p className="text-sm text-gray-500">{endereco}</p>}
          <p className="mt-1 text-sm capitalize text-gray-600">
            {formatDateWithWeekday(escala.data)}
            {escala.horaInicio && escala.horaFim ? ` · ${escala.horaInicio}–${escala.horaFim}` : ""}
          </p>
          <p className="mt-1 text-sm text-gray-600">
            Valor da diária: <strong>{formatBRL(escala.valor)}</strong>
          </p>
        </div>

        {escala.confirmadaEm ? (
          <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-center">
            <p className="text-lg font-semibold text-green-700">✓ Presença confirmada</p>
            <p className="mt-1 text-sm text-green-800">
              Obrigado, {escala.diarista.nome}! Sua diária está confirmada.
            </p>
          </div>
        ) : (
          <form action={confirmarPorLink} className="space-y-3">
            <input type="hidden" name="token" value={token} />
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="nome">
                Seu nome e sobrenome
              </label>
              <input id="nome" name="nome" required className={inputClass} />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-green-600 py-2.5 font-medium text-white hover:bg-green-700"
            >
              Confirmar presença
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
