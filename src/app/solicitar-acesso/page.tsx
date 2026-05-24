import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { solicitarAcesso } from "./actions";

export const dynamic = "force-dynamic";

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 outline-none focus:border-orange-600 focus:ring-2 focus:ring-orange-100";
const labelClass = "block text-sm font-medium text-gray-700 mb-1";

export default async function SolicitarAcessoPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erro?: string }>;
}) {
  const { ok, erro } = await searchParams;

  if (ok) {
    return (
      <div className="mx-auto max-w-md p-6 text-center">
        <h1 className="mt-10 text-xl font-bold text-gray-900">Pedido enviado! ✅</h1>
        <p className="mt-2 text-gray-600">
          O RH/TI vai analisar e, ao aprovar, te enviam um <strong>link no WhatsApp</strong> para você
          criar sua senha e acessar suas lojas.
        </p>
        <Link href="/entrar" className="mt-6 inline-block font-medium text-orange-700 underline">
          Voltar para o início
        </Link>
      </div>
    );
  }

  const lojas = await prisma.loja.findMany({
    where: { ativo: true },
    orderBy: { nome: "asc" },
    select: { id: true, nome: true, bairro: true, cidade: true },
  });

  return (
    <div className="mx-auto max-w-md">
      <header className="bg-neutral-900 px-5 py-6 text-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/rwp-logo.svg" alt="RWP" className="mb-3 h-7 w-auto" />
        <h1 className="text-xl font-bold">Solicitar acesso (lojista / gestor)</h1>
        <p className="mt-1 text-sm text-orange-100">
          Cadastre-se e escolha suas lojas. O RH/TI aprova antes de liberar — você só acessa as
          lojas que administra.
        </p>
      </header>

      <main className="p-5">
        {erro === "campos" && (
          <p className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
            Informe seu nome e marque ao menos uma loja.
          </p>
        )}
        {erro === "limite" && (
          <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-medium text-amber-800">
            Muitas tentativas deste local. Aguarde um pouco e tente de novo.
          </p>
        )}
        {lojas.length === 0 ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            Nenhuma loja cadastrada ainda. Fale com o RH/TI.
          </p>
        ) : (
          <form action={solicitarAcesso} className="space-y-4">
            {/* honeypot anti-bot: invisível para pessoas */}
            <input
              type="text"
              name="confirmacao"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="hidden"
            />
            <div>
              <label className={labelClass} htmlFor="nome">
                Seu nome *
              </label>
              <input id="nome" name="nome" required className={inputClass} />
            </div>
            <div>
              <label className={labelClass} htmlFor="telefone">
                WhatsApp *
              </label>
              <input
                id="telefone"
                name="telefone"
                required
                inputMode="numeric"
                placeholder="(00) 90000-0000"
                className={inputClass}
              />
            </div>
            <div>
              <p className={labelClass}>Suas lojas * (marque as que você administra)</p>
              <div className="max-h-[40vh] space-y-1 overflow-y-auto rounded-lg border border-gray-200 p-2">
                {lojas.map((l) => (
                  <label
                    key={l.id}
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      name="lojaIds"
                      value={l.id}
                      className="h-4 w-4 rounded border-gray-300 text-orange-700 focus:ring-orange-600"
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-gray-800">{l.nome}</span>
                      {(l.bairro || l.cidade) && (
                        <span className="block truncate text-xs text-gray-400">
                          {[l.bairro, l.cidade].filter(Boolean).join(" · ")}
                        </span>
                      )}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-orange-700 py-2.5 font-medium text-white hover:bg-orange-800"
            >
              Enviar pedido de acesso
            </button>
          </form>
        )}
        <p className="mt-4 text-center text-sm text-gray-500">
          <Link href="/entrar" className="font-medium text-orange-700 underline">
            Já tenho acesso
          </Link>
        </p>
      </main>
    </div>
  );
}
