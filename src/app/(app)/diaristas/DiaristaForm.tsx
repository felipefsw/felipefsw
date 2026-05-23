import Link from "next/link";
import { Card, btnPrimary, btnSecondary, inputClass, labelClass } from "@/components/ui";
import { FUNCOES } from "@/lib/funcoes";

type DiaristaDefaults = {
  id?: string;
  nome?: string;
  funcao?: string | null;
  telefone?: string | null;
  chavePix?: string | null;
  valorDiaria?: number; // centavos
  observacoes?: string | null;
};

export default function DiaristaForm({
  action,
  diarista,
  submitLabel,
}: {
  action: (formData: FormData) => void;
  diarista?: DiaristaDefaults;
  submitLabel: string;
}) {
  const valorStr =
    diarista?.valorDiaria != null && diarista.valorDiaria > 0
      ? (diarista.valorDiaria / 100).toFixed(2).replace(".", ",")
      : "";

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
              Valor da diária (R$)
            </label>
            <input
              id="valorDiaria"
              name="valorDiaria"
              inputMode="decimal"
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
