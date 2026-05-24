import Link from "next/link";
import { Card, btnPrimary, btnSecondary, inputClass, labelClass } from "@/components/ui";
import { FUNCOES } from "@/lib/funcoes";

type DiaristaDefaults = {
  id?: string;
  nome?: string;
  cpf?: string | null;
  fotoUrl?: string | null;
  funcao?: string | null;
  telefone?: string | null;
  chavePix?: string | null;
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
              CPF *
            </label>
            <input
              id="cpf"
              name="cpf"
              inputMode="numeric"
              required
              defaultValue={diarista?.cpf ?? ""}
              placeholder="000.000.000-00"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="telefone">
              WhatsApp *
            </label>
            <input
              id="telefone"
              name="telefone"
              required
              defaultValue={diarista?.telefone ?? ""}
              placeholder="(85) 90000-0000"
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className={labelClass} htmlFor="funcao">
            Função *
          </label>
          <select
            id="funcao"
            name="funcao"
            required
            defaultValue={diarista?.funcao ?? ""}
            className={inputClass}
          >
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
            defaultValue={diarista?.chavePix ?? ""}
            placeholder="CPF, e-mail, telefone ou chave aleatória"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="fotoUrl">
            Foto (link da imagem) — opcional
          </label>
          <input
            id="fotoUrl"
            name="fotoUrl"
            defaultValue={diarista?.fotoUrl ?? ""}
            placeholder="https://… (a diarista também envia pelo app)"
            className={inputClass}
          />
        </div>

        <div>
          <p className={labelClass}>Lojas preferidas (até 5) — opcional</p>
          <div className="space-y-2">
            {[0, 1, 2, 3, 4].map((i) => (
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
