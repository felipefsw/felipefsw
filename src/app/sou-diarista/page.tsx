import { FUNCOES } from "@/lib/funcoes";
import { cadastrarDiarista } from "./actions";

export const dynamic = "force-dynamic";

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100";
const labelClass = "block text-sm font-medium text-gray-700 mb-1";

export default function SouDiaristaPage() {
  return (
    <div className="mx-auto max-w-md">
      <header className="bg-teal-700 px-5 py-6 text-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/rwp-logo.svg" alt="RWP" className="mb-3 h-7 w-auto" />
        <h1 className="text-xl font-bold">Quero me inscrever para diárias</h1>
        <p className="mt-1 text-sm text-teal-100">
          Preencha seus dados. Depois você acompanha e escolhe as diárias por aqui.
        </p>
      </header>

      <main className="p-5">
        <form action={cadastrarDiarista} className="space-y-4">
          <div>
            <label className={labelClass} htmlFor="nome">
              Nome e sobrenome *
            </label>
            <input id="nome" name="nome" required className={inputClass} />
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
              <input
                id="dataNascimento"
                name="dataNascimento"
                type="date"
                required
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass} htmlFor="telefone">
              Telefone / WhatsApp *
            </label>
            <input
              id="telefone"
              name="telefone"
              required
              placeholder="(00) 90000-0000"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="funcao">
              Função *
            </label>
            <select id="funcao" name="funcao" required defaultValue="" className={inputClass}>
              <option value="" disabled>
                — Selecione —
              </option>
              {FUNCOES.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass} htmlFor="chavePix">
              Chave Pix *
            </label>
            <input
              id="chavePix"
              name="chavePix"
              required
              placeholder="CPF, e-mail, telefone ou chave aleatória"
              className={inputClass}
            />
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
            className="w-full rounded-lg bg-teal-700 py-2.5 font-medium text-white hover:bg-teal-800"
          >
            Cadastrar
          </button>
        </form>
      </main>
    </div>
  );
}
