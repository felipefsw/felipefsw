import Link from "next/link";
import { Card, btnPrimary, inputClass, labelClass } from "@/components/ui";
import { entrarDiarista, loginGestao, loginGestor, loginLoja } from "./actions";

export const dynamic = "force-dynamic";

export default async function EntrarPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;

  return (
    <div className="mx-auto max-w-md px-5 py-8">
      <div className="mb-6 flex flex-col items-center text-center">
        <div className="rounded-2xl bg-black p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/rwp-logo.svg" alt="RWP" className="h-10 w-auto" />
        </div>
        <h1 className="mt-3 text-xl font-bold text-gray-900">Gestão de Diaristas</h1>
        <p className="text-sm text-gray-500">Pizzarias RWP</p>
      </div>

      <div className="space-y-4">
        <Card>
          <h2 className="font-semibold text-gray-900">Sou diarista</h2>
          <p className="mb-3 mt-1 text-sm text-gray-500">
            Quero me inscrever para diárias. Informe seu CPF.
          </p>
          {erro === "diarista" && (
            <p className="mb-2 text-sm text-red-600">Informe um CPF válido.</p>
          )}
          <form action={entrarDiarista} className="space-y-3">
            <input
              name="cpf"
              inputMode="numeric"
              required
              placeholder="Seu CPF"
              className={inputClass}
            />
            <button type="submit" className={`${btnPrimary} w-full`}>
              Entrar
            </button>
          </form>
          <p className="mt-2 text-center text-sm text-gray-500">
            Primeira vez?{" "}
            <Link href="/sou-diarista" className="font-medium text-teal-700 underline">
              Cadastre-se
            </Link>
          </p>
        </Card>

        <Card>
          <h2 className="font-semibold text-gray-900">Sou lojista</h2>
          <p className="mb-3 mt-1 text-sm text-gray-500">
            Quero solicitar diaristas para minha loja.
          </p>
          {erro === "loja" && (
            <p className="mb-2 text-sm text-red-600">CNPJ ou senha incorretos.</p>
          )}
          <form action={loginLoja} className="space-y-3">
            <div>
              <label className={labelClass} htmlFor="cnpj">
                CNPJ da loja
              </label>
              <input id="cnpj" name="cnpj" inputMode="numeric" required className={inputClass} />
            </div>
            <div>
              <label className={labelClass} htmlFor="senha-loja">
                Senha
              </label>
              <input id="senha-loja" name="senha" type="password" required className={inputClass} />
            </div>
            <button type="submit" className={`${btnPrimary} w-full`}>
              Entrar
            </button>
          </form>
        </Card>

        <Card>
          <h2 className="font-semibold text-gray-900">Sou gestor</h2>
          <p className="mb-3 mt-1 text-sm text-gray-500">
            Administro uma ou mais lojas. Entro com usuário e senha.
          </p>
          {erro === "gestor" && (
            <p className="mb-2 text-sm text-red-600">Usuário ou senha incorretos.</p>
          )}
          <form action={loginGestor} className="space-y-3">
            <div>
              <label className={labelClass} htmlFor="usuario">
                Usuário
              </label>
              <input id="usuario" name="usuario" required className={inputClass} />
            </div>
            <div>
              <label className={labelClass} htmlFor="senha-gestor">
                Senha
              </label>
              <input id="senha-gestor" name="senha" type="password" required className={inputClass} />
            </div>
            <button type="submit" className={`${btnPrimary} w-full`}>
              Entrar
            </button>
          </form>
        </Card>

        <Card>
          <h2 className="font-semibold text-gray-900">RH / TI (gestão)</h2>
          {erro === "gestao" && (
            <p className="mb-2 mt-1 text-sm text-red-600">Senha incorreta.</p>
          )}
          <form action={loginGestao} className="mt-2 space-y-3">
            <div>
              <label className={labelClass} htmlFor="perfil">
                Perfil
              </label>
              <select id="perfil" name="perfil" className={inputClass} defaultValue="rh">
                <option value="rh">RH</option>
                <option value="ti">TI</option>
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="senha-gestao">
                Senha
              </label>
              <input id="senha-gestao" name="senha" type="password" required className={inputClass} />
            </div>
            <button type="submit" className={`${btnPrimary} w-full`}>
              Entrar
            </button>
          </form>
        </Card>

        <p className="text-center text-sm">
          <Link href="/recuperar-senha" className="text-gray-500 underline">
            Recuperar senha
          </Link>
        </p>
      </div>
    </div>
  );
}
