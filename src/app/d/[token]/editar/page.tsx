import { prisma } from "@/lib/prisma";
import { FUNCOES } from "@/lib/funcoes";
import { exigirDiarista } from "@/lib/diaristaSessao";
import { editarDadosDiarista, mudarSenhaDiarista } from "../actions";

export const dynamic = "force-dynamic";

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 outline-none focus:border-orange-600 focus:ring-2 focus:ring-orange-100";
const labelClass = "mb-1 block text-sm font-medium text-gray-700";

export default async function EditarPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ dados?: string; senha?: string }>;
}) {
  const { token } = await params;
  const { dados, senha } = await searchParams;
  await exigirDiarista(token);

  const diarista = await prisma.diarista.findUnique({
    where: { token },
    select: {
      nome: true,
      telefone: true,
      cpf: true,
      dataNascimento: true,
      funcao: true,
      chavePix: true,
    },
  });
  if (!diarista) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Editar dados</h1>
        <p className="text-sm text-gray-500">Mantenha seus dados sempre atualizados</p>
      </div>

      <section id="dados">
        {dados === "ok" && (
          <p className="mb-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-700">
            ✓ Dados salvos.
          </p>
        )}
        {dados === "invalido" && (
          <p className="mb-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
            Informe ao menos o nome.
          </p>
        )}
        <form action={editarDadosDiarista} className="space-y-3">
          <input type="hidden" name="token" value={token} />
          <div>
            <label className={labelClass} htmlFor="nome">
              Nome
            </label>
            <input id="nome" name="nome" required defaultValue={diarista.nome} className={inputClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="telefone">
              WhatsApp / telefone
            </label>
            <input
              id="telefone"
              name="telefone"
              inputMode="numeric"
              defaultValue={diarista.telefone ?? ""}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="dataNascimento">
              Nascimento
            </label>
            <input
              id="dataNascimento"
              name="dataNascimento"
              type="date"
              defaultValue={diarista.dataNascimento ?? ""}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="funcao">
              Função
            </label>
            <select
              id="funcao"
              name="funcao"
              defaultValue={diarista.funcao ?? ""}
              className={inputClass}
            >
              <option value="">—</option>
              {FUNCOES.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="chavePix">
              Chave Pix (para receber)
            </label>
            <input
              id="chavePix"
              name="chavePix"
              defaultValue={diarista.chavePix ?? ""}
              placeholder="CPF, e-mail, telefone ou chave aleatória"
              className={inputClass}
            />
            <p className="mt-1 rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
              ⚠️ O pagamento é feito para a chave Pix que você informar aqui. Confira com atenção — a
              loja <strong>não se responsabiliza</strong> por valores enviados a uma chave incorreta.
            </p>
          </div>
          {diarista.cpf && (
            <p className="text-xs text-gray-400">
              CPF de acesso: {diarista.cpf}. Para alterar o CPF, fale com o RH.
            </p>
          )}
          <button
            type="submit"
            className="w-full rounded-lg bg-orange-700 py-2.5 font-medium text-white hover:bg-orange-800"
          >
            Salvar dados
          </button>
        </form>
      </section>

      <section id="senha" className="scroll-mt-16">
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
            <label className={labelClass} htmlFor="senhaAtual">
              Senha atual
            </label>
            <input
              id="senhaAtual"
              name="senhaAtual"
              type="password"
              placeholder="deixe em branco se ainda não tem senha"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="novaSenha">
              Nova senha
            </label>
            <input
              id="novaSenha"
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
              Repita a nova senha
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
          <button
            type="submit"
            className="w-full rounded-lg bg-orange-700 py-2.5 font-medium text-white hover:bg-orange-800"
          >
            Salvar nova senha
          </button>
        </form>
      </section>
    </div>
  );
}
