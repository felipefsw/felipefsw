import { FUNCOES } from "@/lib/funcoes";
import DataNascimentoInput from "@/components/DataNascimentoInput";
import { cadastrarDiarista } from "./actions";

export const dynamic = "force-dynamic";

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 outline-none focus:border-orange-600 focus:ring-2 focus:ring-orange-100";
const labelClass = "block text-sm font-medium text-gray-700 mb-1";

export default async function SouDiaristaPage({
  searchParams,
}: {
  searchParams: Promise<{ vaga?: string; erro?: string }>;
}) {
  const { vaga, erro } = await searchParams;
  return (
    <div className="mx-auto max-w-md">
      <header className="bg-neutral-900 px-5 py-6 text-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/rwp-logo.svg" alt="RWP" className="mb-3 h-7 w-auto" />
        <h1 className="text-xl font-bold">Quero me inscrever para diárias</h1>
        <p className="mt-1 text-sm text-orange-100">
          {vaga
            ? "Você foi convidado para uma diária! Cadastre-se e ela já fica na sua agenda."
            : "Preencha seus dados. Depois você acompanha e escolhe as diárias por aqui."}
        </p>
      </header>

      <main className="p-5">
        {erro === "cpf" && (
          <p className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
            CPF inválido. Confira os números e tente novamente.
          </p>
        )}
        {erro === "cpfdup" && (
          <p className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
            Esse CPF já está cadastrado. Entre com o seu acesso em vez de criar outro cadastro.
          </p>
        )}
        {erro === "campos" && (
          <p className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
            Preencha nome, sobrenome, CPF, data de nascimento (DD/MM/AAAA) e função.
          </p>
        )}
        {erro === "senha" && (
          <p className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
            As senhas não conferem ou têm menos de 6 caracteres.
          </p>
        )}
        {erro === "limite" && (
          <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-medium text-amber-800">
            Muitas tentativas deste local. Aguarde um pouco e tente de novo.
          </p>
        )}
        <form action={cadastrarDiarista} className="space-y-4">
          {vaga ? <input type="hidden" name="vaga" value={vaga} /> : null}
          {/* honeypot anti-bot: invisível para pessoas */}
          <input
            type="text"
            name="confirmacao"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="hidden"
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="nome">
                Nome *
              </label>
              <input id="nome" name="nome" required className={inputClass} />
            </div>
            <div>
              <label className={labelClass} htmlFor="sobrenome">
                Sobrenome *
              </label>
              <input id="sobrenome" name="sobrenome" required className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="cpf">
                CPF *
              </label>
              <input
                id="cpf"
                name="cpf"
                inputMode="numeric"
                required
                placeholder="000.000.000-00"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="dataNascimento">
                Data de nascimento *
              </label>
              <DataNascimentoInput className={inputClass} />
            </div>
          </div>

          <div>
            <label className={labelClass} htmlFor="telefone">
              Telefone / WhatsApp (opcional)
            </label>
            <input
              id="telefone"
              name="telefone"
              placeholder="(00) 90000-0000"
              className={inputClass}
            />
          </div>

          <div>
            <p className={labelClass}>Função * (escolha uma)</p>
            <div className="grid grid-cols-2 gap-2">
              {FUNCOES.map((f) => (
                <label key={f}>
                  <input type="radio" name="funcao" value={f} required className="peer sr-only" />
                  <span className="block cursor-pointer rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-center text-sm font-medium text-gray-700 peer-checked:border-orange-600 peer-checked:bg-orange-50 peer-checked:text-orange-800 peer-checked:ring-2 peer-checked:ring-orange-300">
                    {f}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className={labelClass} htmlFor="chavePix">
              Chave Pix (opcional)
            </label>
            <input
              id="chavePix"
              name="chavePix"
              placeholder="CPF, e-mail, telefone ou chave aleatória"
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="senha">
                Crie uma senha *
              </label>
              <input
                id="senha"
                name="senha"
                type="password"
                required
                minLength={6}
                placeholder="mínimo 6 caracteres"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="confirmarSenha">
                Repita a senha *
              </label>
              <input
                id="confirmarSenha"
                name="confirmarSenha"
                type="password"
                required
                minLength={6}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass} htmlFor="observacoes">
              Observação (opcional)
            </label>
            <textarea
              id="observacoes"
              name="observacoes"
              rows={3}
              placeholder="Algo que queira informar"
              className={inputClass}
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-orange-700 py-2.5 font-medium text-white hover:bg-orange-800"
          >
            Cadastrar
          </button>
        </form>
      </main>
    </div>
  );
}
