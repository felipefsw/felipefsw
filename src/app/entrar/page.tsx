import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui";
import MarcaBadge from "@/components/MarcaBadge";
import {
  entrarComoGestao,
  entrarComoGestor,
  entrarComoLoja,
  entrarDiarista,
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

function Erro({ codigo }: { codigo?: string }) {
  if (!codigo) return null;
  const msg: Record<string, string> = {
    login: "Senha incorreta.",
    senha: "Senha incorreta.",
    diarista: "Informe o CPF.",
    semsenha: "Primeiro acesso: use o link secreto enviado no WhatsApp para definir a senha.",
  };
  return (
    <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
      {msg[codigo] ?? "Não foi possível entrar."}
    </p>
  );
}

export default async function EntrarPage({
  searchParams,
}: {
  searchParams: Promise<{ perfil?: string; id?: string; erro?: string; q?: string }>;
}) {
  const { perfil, id, erro, q } = await searchParams;
  const busca = (q ?? "").trim();
  const sel = (PERFIS as readonly string[]).includes(perfil ?? "") ? (perfil as Perfil) : null;

  if (!sel) {
    const opcoes: { perfil: Perfil; titulo: string; desc: string; emoji: string }[] = [
      { perfil: "diarista", titulo: "Sou diarista", desc: "Entrar com CPF e senha", emoji: "🧑‍🍳" },
      { perfil: "lojista", titulo: "Sou lojista", desc: "Entrar com senha da loja", emoji: "🏪" },
      { perfil: "gestor", titulo: "Sou gestor", desc: "Administro lojas", emoji: "🧑‍💼" },
      { perfil: "gestao", titulo: "RH / TI", desc: "Gestão completa", emoji: "🛠️" },
    ];
    return (
      <div className="mx-auto max-w-md px-5 py-8">
        <Cabecalho />
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

  const [membros, lojas, gestores] = await Promise.all([
    sel === "gestao"
      ? prisma.membro.findMany({
          where: { ativo: true },
          orderBy: { nome: "asc" },
          select: { id: true, nome: true, perfil: true, papel: true },
        })
      : Promise.resolve([]),
    sel === "lojista"
      ? prisma.loja.findMany({
          where: {
            ativo: true,
            ...(busca ? { nome: { contains: busca, mode: "insensitive" as const } } : {}),
          },
          orderBy: { nome: "asc" },
          select: { id: true, nome: true, bairro: true, cidade: true },
        })
      : Promise.resolve([]),
    sel === "gestor"
      ? prisma.gestor.findMany({
          where: { ativo: true, aprovado: true },
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
      <Erro codigo={erro} />

      {sel === "diarista" && (
        <Card>
          <h2 className="font-semibold text-gray-900">Entrar como diarista</h2>
          <p className="mb-3 mt-1 text-sm text-gray-500">Use CPF e a senha definidas no link pessoal.</p>
          <form action={entrarDiarista} className="space-y-3">
            <input
              name="cpf"
              inputMode="numeric"
              placeholder="CPF"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <input
              name="senha"
              type="password"
              placeholder="Senha"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="w-full rounded-lg bg-orange-700 px-3 py-3 text-sm font-semibold text-white"
            >
              Entrar
            </button>
          </form>
          <p className="mt-3 text-center text-sm text-gray-500">
            Ainda não tem cadastro?{" "}
            <Link href="/sou-diarista" className="font-medium text-orange-700 underline">
              Cadastre-se
            </Link>
          </p>
        </Card>
      )}

      {sel === "lojista" && (
        <Card>
          <h2 className="font-semibold text-gray-900">Entrar como loja</h2>
          <p className="mb-3 mt-1 text-sm text-gray-500">Escolha a loja e digite a senha.</p>
          <form method="get" className="mb-3 flex gap-2">
            <input type="hidden" name="perfil" value="lojista" />
            <input
              type="search"
              name="q"
              defaultValue={busca}
              placeholder="Buscar loja…"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <button type="submit" className="rounded-lg border px-3 text-sm">
              Buscar
            </button>
          </form>
          {lojas.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhuma loja encontrada.</p>
          ) : (
            <div className="max-h-[50vh] space-y-2 overflow-y-auto">
              {lojas.map((l) => (
                <form key={l.id} action={entrarComoLoja} className="rounded-lg border border-gray-200 p-3">
                  <input type="hidden" name="id" value={l.id} />
                  <div className="mb-2 flex items-center gap-2">
                    <MarcaBadge nome={l.nome} className="h-6 w-6 shrink-0 rounded" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900">{l.nome}</p>
                      {(l.bairro || l.cidade) && (
                        <p className="truncate text-xs text-gray-500">
                          {[l.bairro, l.cidade].filter(Boolean).join(" · ")}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <input
                      name="senha"
                      type="password"
                      placeholder="Senha"
                      required
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                    <button
                      type="submit"
                      className="shrink-0 rounded-lg bg-orange-700 px-3 py-2 text-sm font-semibold text-white"
                    >
                      Entrar
                    </button>
                  </div>
                </form>
              ))}
            </div>
          )}
        </Card>
      )}

      {sel === "gestor" && (
        <Card>
          <h2 className="font-semibold text-gray-900">Entrar como gestor</h2>
          <p className="mb-3 mt-1 text-sm text-gray-500">Escolha seu nome e digite a senha.</p>
          {gestores.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhum gestor cadastrado.</p>
          ) : (
            <div className="space-y-2">
              {gestores.map((g) => (
                <form key={g.id} action={entrarComoGestor} className="rounded-lg border border-gray-200 p-3">
                  <input type="hidden" name="id" value={g.id} />
                  <p className="mb-2 text-sm font-medium text-gray-900">🧑‍💼 {g.nome}</p>
                  <div className="flex gap-2">
                    <input
                      name="senha"
                      type="password"
                      placeholder="Senha"
                      required
                      defaultValue={id === g.id ? undefined : undefined}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                    <button
                      type="submit"
                      className="shrink-0 rounded-lg bg-orange-700 px-3 py-2 text-sm font-semibold text-white"
                    >
                      Entrar
                    </button>
                  </div>
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
          <h2 className="font-semibold text-gray-900">RH / TI</h2>
          <p className="mb-3 mt-1 text-sm text-gray-500">Escolha o membro e digite a senha.</p>
          {membros.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhum membro RH/TI cadastrado.</p>
          ) : (
            <div className="space-y-2">
              {membros.map((m) => (
                <form key={m.id} action={entrarComoGestao} className="rounded-lg border border-gray-200 p-3">
                  <input type="hidden" name="id" value={m.id} />
                  <p className="mb-2 text-sm font-medium text-gray-900">
                    {m.nome}{" "}
                    <span className="text-xs uppercase text-gray-500">
                      · {m.perfil}
                      {m.papel ? ` · ${m.papel}` : ""}
                    </span>
                  </p>
                  <div className="flex gap-2">
                    <input
                      name="senha"
                      type="password"
                      placeholder="Senha"
                      required
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                    <button
                      type="submit"
                      className="shrink-0 rounded-lg bg-neutral-900 px-3 py-2 text-sm font-semibold text-white"
                    >
                      Entrar
                    </button>
                  </div>
                </form>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
