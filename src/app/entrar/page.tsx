import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui";
import MarcaBadge from "@/components/MarcaBadge";
import Avatar from "@/components/Avatar";
import {
  entrarDiaristaDireto,
  entrarGestaoDireto,
  entrarGestorDireto,
  entrarLojaDireto,
} from "./actions";

export const dynamic = "force-dynamic";

const PERFIS = ["diarista", "lojista", "gestor", "gestao"] as const;
type Perfil = (typeof PERFIS)[number];

function Cabecalho() {
  return (
    <div className="mb-6 flex flex-col items-center text-center">
      <div className="rounded-2xl bg-black p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/rwp-logo.svg" alt="RWP" className="h-10 w-auto" />
      </div>
      <h1 className="mt-3 text-xl font-bold text-gray-900">Gestão de Diaristas</h1>
      <p className="text-sm text-gray-500">Pizzarias RWP</p>
    </div>
  );
}

export default async function EntrarPage({
  searchParams,
}: {
  searchParams: Promise<{ perfil?: string; q?: string }>;
}) {
  const { perfil, q } = await searchParams;
  const busca = (q ?? "").trim();
  const sel = (PERFIS as readonly string[]).includes(perfil ?? "") ? (perfil as Perfil) : null;

  // Tela inicial: escolher o perfil (sem senha).
  if (!sel) {
    const opcoes: { perfil: Perfil; titulo: string; desc: string; emoji: string }[] = [
      { perfil: "diarista", titulo: "Sou diarista", desc: "Quero pegar diárias", emoji: "🧑‍🍳" },
      { perfil: "lojista", titulo: "Sou lojista", desc: "Solicitar diaristas", emoji: "🏪" },
      { perfil: "gestor", titulo: "Sou gestor", desc: "Administro lojas", emoji: "🧑‍💼" },
      { perfil: "gestao", titulo: "RH / TI", desc: "Gestão completa", emoji: "🛠️" },
    ];
    return (
      <div className="mx-auto max-w-md px-5 py-8">
        <Cabecalho />
        <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-2 text-center text-xs font-medium text-amber-800">
          Acesso temporário sem senha — escolha como quer entrar.
        </p>
        <div className="space-y-3">
          {opcoes.map((o) => (
            <Link
              key={o.perfil}
              href={`/entrar?perfil=${o.perfil}`}
              className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-4 shadow-sm hover:border-orange-300"
            >
              <span className="text-2xl">{o.emoji}</span>
              <span>
                <span className="block font-semibold text-gray-900">{o.titulo}</span>
                <span className="block text-sm text-gray-500">{o.desc}</span>
              </span>
              <span className="ml-auto text-gray-400">›</span>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  const [diaristas, lojas, gestores] = await Promise.all([
    sel === "diarista"
      ? prisma.diarista.findMany({
          where: {
            ativo: true,
            ...(busca ? { nome: { contains: busca, mode: "insensitive" as const } } : {}),
          },
          orderBy: { nome: "asc" },
          select: { id: true, nome: true, fotoUrl: true, funcao: true },
        })
      : Promise.resolve([]),
    sel === "lojista"
      ? prisma.loja.findMany({
          where: { ativo: true },
          orderBy: { nome: "asc" },
          select: { id: true, nome: true, bairro: true, cidade: true },
        })
      : Promise.resolve([]),
    sel === "gestor"
      ? prisma.gestor.findMany({
          where: { ativo: true },
          orderBy: { nome: "asc" },
          select: { id: true, nome: true },
        })
      : Promise.resolve([]),
  ]);

  return (
    <div className="mx-auto max-w-md px-5 py-8">
      <Cabecalho />
      <Link href="/entrar" className="mb-3 inline-block text-sm font-medium text-orange-700">
        ← Voltar
      </Link>

      {sel === "diarista" && (
        <Card>
          <h2 className="font-semibold text-gray-900">Entrar como diarista</h2>
          <p className="mb-3 mt-1 text-sm text-gray-500">Toque no seu nome para entrar.</p>
          <form method="get" className="mb-3 flex gap-2">
            <input type="hidden" name="perfil" value="diarista" />
            <input
              type="search"
              name="q"
              defaultValue={busca}
              placeholder="🔍 Buscar seu nome…"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-orange-600 focus:ring-2 focus:ring-orange-100"
            />
            <button
              type="submit"
              className="shrink-0 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700"
            >
              Buscar
            </button>
          </form>
          {diaristas.length === 0 ? (
            <p className="text-sm text-gray-500">
              {busca ? (
                <>
                  Nenhuma diarista encontrada para “{busca}”.{" "}
                  <Link href="/entrar?perfil=diarista" className="font-medium text-orange-700 underline">
                    Limpar busca
                  </Link>
                </>
              ) : (
                <>
                  Nenhuma diarista cadastrada.{" "}
                  <Link href="/sou-diarista" className="font-medium text-orange-700 underline">
                    Cadastre-se
                  </Link>
                </>
              )}
            </p>
          ) : (
            <div className="max-h-[60vh] space-y-1 overflow-y-auto">
              {diaristas.map((d) => (
                <form key={d.id} action={entrarDiaristaDireto}>
                  <input type="hidden" name="id" value={d.id} />
                  <button
                    type="submit"
                    className="flex w-full items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-left hover:border-orange-300"
                  >
                    <Avatar nome={d.nome} fotoUrl={d.fotoUrl} className="h-8 w-8" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-gray-900">
                        {d.nome}
                      </span>
                      {d.funcao && (
                        <span className="block truncate text-xs text-gray-500">{d.funcao}</span>
                      )}
                    </span>
                  </button>
                </form>
              ))}
            </div>
          )}
          <p className="mt-3 text-center text-sm text-gray-500">
            Não está na lista?{" "}
            <Link href="/sou-diarista" className="font-medium text-orange-700 underline">
              Cadastre-se
            </Link>
          </p>
        </Card>
      )}

      {sel === "lojista" && (
        <Card>
          <h2 className="font-semibold text-gray-900">Entrar como loja</h2>
          <p className="mb-3 mt-1 text-sm text-gray-500">Toque na sua loja para entrar.</p>
          {lojas.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhuma loja cadastrada ainda.</p>
          ) : (
            <div className="max-h-[60vh] space-y-1 overflow-y-auto">
              {lojas.map((l) => (
                <form key={l.id} action={entrarLojaDireto}>
                  <input type="hidden" name="id" value={l.id} />
                  <button
                    type="submit"
                    className="flex w-full items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-left hover:border-orange-300"
                  >
                    <MarcaBadge nome={l.nome} className="h-6 w-6 shrink-0 rounded" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-gray-900">
                        {l.nome}
                      </span>
                      {(l.bairro || l.cidade) && (
                        <span className="block truncate text-xs text-gray-500">
                          {[l.bairro, l.cidade].filter(Boolean).join(" · ")}
                        </span>
                      )}
                    </span>
                  </button>
                </form>
              ))}
            </div>
          )}
          <p className="mt-3 text-center text-sm text-gray-500">
            Sua loja não está aqui?{" "}
            <Link href="/solicitar-acesso" className="font-medium text-orange-700 underline">
              Solicitar acesso
            </Link>
          </p>
        </Card>
      )}

      {sel === "gestor" && (
        <Card>
          <h2 className="font-semibold text-gray-900">Entrar como gestor</h2>
          <p className="mb-3 mt-1 text-sm text-gray-500">Toque no seu nome para entrar.</p>
          {gestores.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhum gestor cadastrado ainda.</p>
          ) : (
            <div className="space-y-1">
              {gestores.map((g) => (
                <form key={g.id} action={entrarGestorDireto}>
                  <input type="hidden" name="id" value={g.id} />
                  <button
                    type="submit"
                    className="flex w-full items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-3 text-left font-medium text-gray-900 hover:border-orange-300"
                  >
                    🧑‍💼 {g.nome}
                  </button>
                </form>
              ))}
            </div>
          )}
          <p className="mt-3 text-center text-sm text-gray-500">
            Não tem cadastro?{" "}
            <Link href="/solicitar-acesso" className="font-medium text-orange-700 underline">
              Solicitar acesso
            </Link>
          </p>
        </Card>
      )}

      {sel === "gestao" && (
        <Card>
          <h2 className="font-semibold text-gray-900">RH / TI (gestão)</h2>
          <p className="mb-3 mt-1 text-sm text-gray-500">Entre como RH ou TI.</p>
          <div className="space-y-2">
            <form action={entrarGestaoDireto}>
              <input type="hidden" name="perfil" value="rh" />
              <button
                type="submit"
                className="w-full rounded-lg bg-orange-700 px-3 py-3 text-sm font-semibold text-white hover:bg-orange-800"
              >
                🛠️ Entrar como RH
              </button>
            </form>
            <form action={entrarGestaoDireto}>
              <input type="hidden" name="perfil" value="ti" />
              <button
                type="submit"
                className="w-full rounded-lg bg-neutral-900 px-3 py-3 text-sm font-semibold text-white hover:bg-neutral-800"
              >
                🛠️ Entrar como TI
              </button>
            </form>
          </div>
        </Card>
      )}
    </div>
  );
}
