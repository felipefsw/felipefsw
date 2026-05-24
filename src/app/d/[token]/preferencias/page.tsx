import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { salvarPreferencias } from "../actions";

export const dynamic = "force-dynamic";

export default async function PreferenciasPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const diarista = await prisma.diarista.findUnique({
    where: { token },
    include: { lojasPreferidas: { select: { id: true } } },
  });

  if (!diarista) {
    return (
      <div className="mx-auto max-w-md p-6 text-center">
        <h1 className="mt-10 text-xl font-bold text-gray-900">Link inválido</h1>
      </div>
    );
  }

  const lojas = await prisma.loja.findMany({
    where: { ativo: true },
    orderBy: { nome: "asc" },
  });
  const preferidas = new Set(diarista.lojasPreferidas.map((l) => l.id));

  return (
    <div className="mx-auto max-w-md">
      <header className="bg-neutral-900 px-5 py-6 text-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/rwp-logo.svg" alt="RWP" className="mb-3 h-7 w-auto" />
        <h1 className="text-xl font-bold">Lojas de preferência</h1>
        <p className="mt-1 text-sm text-orange-100">
          Escolha até 5 lojas onde você prefere trabalhar.
        </p>
      </header>

      <main className="p-5">
        <form action={salvarPreferencias} className="space-y-3">
          <input type="hidden" name="token" value={token} />

          <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
            {lojas.map((l) => {
              const endereco = [l.endereco, l.bairro, l.cidade].filter(Boolean).join(", ");
              return (
                <li key={l.id}>
                  <label className="flex cursor-pointer items-start gap-3 px-3 py-3 hover:bg-gray-50">
                    <input
                      type="checkbox"
                      name="lojaIds"
                      value={l.id}
                      defaultChecked={preferidas.has(l.id)}
                      className="mt-0.5 h-5 w-5 rounded border-gray-300 text-orange-700 focus:ring-orange-600"
                    />
                    <span className="min-w-0">
                      <span className="block font-medium text-gray-900">{l.nome}</span>
                      {endereco && <span className="block text-sm text-gray-500">{endereco}</span>}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>

          <p className="text-xs text-gray-400">
            Marque no máximo 5 (as demais serão ignoradas). Você poderá receber aviso de diária
            disponível nessas lojas.
          </p>

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 rounded-lg bg-orange-700 py-2.5 font-medium text-white hover:bg-orange-800"
            >
              Salvar preferências
            </button>
            <Link
              href={`/d/${token}`}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 font-medium text-gray-700"
            >
              Voltar
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
