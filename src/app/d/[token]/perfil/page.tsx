import Link from "next/link";
import Avatar from "@/components/Avatar";
import FotoUpload from "@/components/FotoUpload";
import PushToggle from "@/components/PushToggle";
import { exigirDiarista } from "@/lib/diaristaSessao";
import { medalhasDoDiarista } from "@/lib/medalhas";
import { mudarSenhaDiarista } from "../actions";

export const dynamic = "force-dynamic";

export default async function PerfilPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ senha?: string }>;
}) {
  const { token } = await params;
  const { senha } = await searchParams;
  const diarista = await exigirDiarista(token);

  const medalhas = await medalhasDoDiarista(diarista.id);

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
        <h2 className="mb-2 font-semibold text-gray-900">Mudar senha</h2>
        {senha === "ok" && (
          <p className="mb-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-700">
            ✓ Senha alterada com sucesso.
          </p>
        )}
        {senha === "invalida" && (
          <p className="mb-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
            A nova senha precisa ter ao menos 6 caracteres e as duas devem ser iguais.
          </p>
        )}
        {senha === "atual" && (
          <p className="mb-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
            A senha atual está incorreta.
          </p>
        )}
        <form action={mudarSenhaDiarista} className="space-y-3">
          <input type="hidden" name="token" value={token} />
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="senhaAtual">
              Senha atual
            </label>
            <input
              id="senhaAtual"
              name="senhaAtual"
              type="password"
              placeholder="deixe em branco se ainda não tem senha"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 outline-none focus:border-orange-600 focus:ring-2 focus:ring-orange-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="senha">
              Nova senha
            </label>
            <input
              id="senha"
              name="senha"
              type="password"
              required
              minLength={6}
              placeholder="mínimo 6 caracteres"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 outline-none focus:border-orange-600 focus:ring-2 focus:ring-orange-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="confirmarSenha">
              Repita a nova senha
            </label>
            <input
              id="confirmarSenha"
              name="confirmarSenha"
              type="password"
              required
              minLength={6}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 outline-none focus:border-orange-600 focus:ring-2 focus:ring-orange-100"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-orange-700 py-2.5 font-medium text-white hover:bg-orange-800"
          >
            Salvar nova senha
          </button>
        </form>
      </section>

      <section className="space-y-2">
        <Link
          href={`/d/${token}/guia`}
          className="block rounded-xl border border-gray-200 bg-white px-4 py-3 text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          📖 Guia do diarista
        </Link>
        <a
          href="/entrar"
          className="block rounded-xl border border-gray-200 bg-white px-4 py-3 text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Sair da conta
        </a>
      </section>
    </div>
  );
}
