import Link from "next/link";
import { Card, btnPrimary, btnSecondary, inputClass, labelClass } from "@/components/ui";
import { FUNCOES } from "@/lib/funcoes";

type DiaristaDefaults = {
  id?: string;
  nome?: string;
  cpf?: string | null;
  dataNascimento?: string | null;
  funcao?: string | null;
  telefone?: string | null;
  chavePix?: string | null;
  valorDiaria?: number; // centavos
  observacoes?: string | null;
  lojasPreferidas?: { id: string }[];
};

export default function DiaristaForm({
  action,
  diarista,
  lojas,
  submitLabel,
}: {
  action: (formData: FormData) => void;
  diarista?: DiaristaDefaults;
  lojas: { id: string; nome: string }[];
  submitLabel: string;
}) {
  const valorStr =
    diarista?.valorDiaria != null && diarista.valorDiaria > 0
      ? (diarista.valorDiaria / 100).toFixed(2).replace(".", ",")
      : "";

  const preferidas = diarista?.lojasPreferidas?.map((l) => l.id) ?? [];

  return (
    <Card>
      <form action={action} className="space-y-4">
        {diarista?.id ? <input type="hidden" name="id" value={diarista.id} /> : null}

        <div>
          <label className={labelClass} htmlFor="nome">
            Nome *
          </label>
          <input
            id="nome"
            name="nome"
            required
            defaultValue={diarista?.nome ?? ""}
            placeholder="Nome completo"
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="cpf">
              CPF
            </label>
            <input
              id="cpf"
              name="cpf"
              inputMode="numeric"
              defaultValue={diarista?.cpf ?? ""}
              placeholder="000.000.000-00"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="dataNascimento">
              Data de nascimento
            </label>
            <input
              id="dataNascimento"
              name="dataNascimento"
              type="date"
              defaultValue={diarista?.dataNascimento ?? ""}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className={labelClass} htmlFor="funcao">
            Função
          </label>
          <select
            id="funcao"
            name="funcao"
            defaultValue={diarista?.funcao ?? ""}
            className={inputClass}
          >
            <option value="">— Selecione —</option>
            {FUNCOES.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="telefone">
              Telefone / WhatsApp
            </label>
            <input
              id="telefone"
              name="telefone"
              defaultValue={diarista?.telefone ?? ""}
              placeholder="(11) 90000-0000"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="valorDiaria">
              Valor da diária (R$) *
            </label>
            <input
              id="valorDiaria"
              name="valorDiaria"
              inputMode="decimal"
              required
              defaultValue={valorStr}
              placeholder="120,00"
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className={labelClass} htmlFor="chavePix">
            Chave Pix
          </label>
          <input
            id="chavePix"
            name="chavePix"
            defaultValue={diarista?.chavePix ?? ""}
            placeholder="CPF, e-mail, telefone ou chave aleatória"
            className={inputClass}
          />
        </div>

        <div>
          <p className={labelClass}>Lojas preferidas (até 3)</p>
          <p className="mb-2 -mt-0.5 text-xs text-gray-400">
            Só um norte de onde a pessoa prefere trabalhar — não impede de ir a outras.
          </p>
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <select
                key={i}
                name={`lojaPreferida${i + 1}`}
                defaultValue={preferidas[i] ?? ""}
                className={inputClass}
              >
                <option value="">— {i + 1}ª opção (nenhuma) —</option>
                {lojas.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.nome}
                  </option>
                ))}
              </select>
            ))}
          </div>
        </div>

        <div>
          <label className={labelClass} htmlFor="observacoes">
            Observações
          </label>
          <textarea
            id="observacoes"
            name="observacoes"
            rows={3}
            defaultValue={diarista?.observacoes ?? ""}
            placeholder="Anotações, preferências, etc."
            className={inputClass}
          />
        </div>

        <div className="flex gap-2 pt-1">
          <button type="submit" className={btnPrimary}>
            {submitLabel}
          </button>
          <Link href="/diaristas" className={btnSecondary}>
            Cancelar
          </Link>
        </div>
      </form>
    </Card>
  );
}
