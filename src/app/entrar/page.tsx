import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, btnPrimary, inputClass } from "@/components/ui";
import MarcaBadge from "@/components/MarcaBadge";
import { EQUIPE } from "@/lib/equipe";
import { entrarComoGestao, entrarComoGestor, entrarComoLoja, entrarDiarista } from "./actions";

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

function Voltar() {
  return (
    <Link href="/entrar" className="mb-3 inline-block text-sm font-medium text-orange-700">
      ← Voltar
    </Link>
  );
}

export default async function EntrarPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; perfil?: string }>;
}) {
  const { erro, perfil } = await searchParams;
  const sel = (PERFIS as readonly string[]).includes(perfil ?? "") ? (perfil as Perfil) : null;

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
        <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-center text-xs font-medium text-amber-800">
          Modo de testes: entra só clicando, sem senha.
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

  const lojas =
    sel === "lojista"
      ? await prisma.loja.findMany({
          where: { ativo: true },
          orderBy: { nome: "asc" },
          select: { id: true, nome: true, bairro: true, cidade: true },
        })
      : [];
  const gestores =
    sel === "gestor"
      ? await prisma.gestor.findMany({
          where: { ativo: true },
          orderBy: { nome: "asc" },
          select: { id: true, nome: true },
        })
      : [];

  return (
    <div className="mx-auto max-w-md px-5 py-8">
      <Cabecalho />
      <Voltar />

      {sel === "diarista" && (
        <Card>
          <h2 className="font-semibold text-gray-900">Sou diarista</h2>
          <p className="mb-3 mt-1 text-sm text-gray-500">Informe seu CPF para entrar.</p>
          {erro === "diarista" && <p className="mb-2 text-sm text-red-600">Informe um CPF válido.</p>}
          <form action={entrarDiarista} className="space-y-3">
            <input name="cpf" inputMode="numeric" required placeholder="Seu CPF" className={inputClass} />
            <button type="submit" className={`${btnPrimary} w-full`}>
              Entrar
            </button>
          </form>
          <p className="mt-2 text-center text-sm text-gray-500">
            Primeira vez?{" "}
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
          <div className="max-h-[60vh] space-y-1 overflow-y-auto">
            {lojas.map((l) => (
              <form key={l.id} action={entrarComoLoja.bind(null, l.id)}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-left hover:border-orange-300"
                >
                  <MarcaBadge nome={l.nome} className="h-6 w-6 shrink-0 rounded" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-gray-900">{l.nome}</span>
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
                <form key={g.id} action={entrarComoGestor.bind(null, g.id)}>
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
        </Card>
      )}

      {sel === "gestao" && (
        <Card>
          <h2 className="font-semibold text-gray-900">RH / TI (gestão)</h2>
          <p className="mb-3 mt-1 text-sm text-gray-500">Toque no seu nome para entrar.</p>
          {(["rh", "ti"] as const).map((p) => (
            <div key={p} className="mb-3 last:mb-0">
              <p className="mb-1 text-xs font-bold uppercase tracking-wide text-gray-400">
                {p === "rh" ? "RH" : "TI"}
              </p>
              <div className="space-y-1">
                {EQUIPE.filter((m) => m.perfil === p).map((m) => (
                  <form key={m.id} action={entrarComoGestao.bind(null, m.id)}>
                    <button
                      type="submit"
                      className="flex w-full items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 py-3 text-left hover:border-orange-300"
                    >
                      <span className="font-medium text-gray-900">🛠️ {m.nome}</span>
                      {m.papel && <span className="text-xs text-gray-400">{m.papel}</span>}
                    </button>
                  </form>
                ))}
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
