import Link from "next/link";
import { Card, btnPrimary, btnSecondary, inputClass, labelClass } from "@/components/ui";

type LojaDefaults = {
  id?: string;
  nome?: string;
  cnpj?: string | null;
  cidade?: string | null;
  endereco?: string | null;
};

export default function LojaForm({
  action,
  loja,
  submitLabel,
}: {
  action: (formData: FormData) => void;
  loja?: LojaDefaults;
  submitLabel: string;
}) {
  return (
    <Card>
      <form action={action} className="space-y-4">
        {loja?.id ? <input type="hidden" name="id" value={loja.id} /> : null}

        <div>
          <label className={labelClass} htmlFor="nome">
            Nome da loja *
          </label>
          <input
            id="nome"
            name="nome"
            required
            defaultValue={loja?.nome ?? ""}
            placeholder="Ex.: Loja Centro"
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="cnpj">
              CNPJ
            </label>
            <input
              id="cnpj"
              name="cnpj"
              defaultValue={loja?.cnpj ?? ""}
              placeholder="00.000.000/0000-00"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="cidade">
              Cidade
            </label>
            <input
              id="cidade"
              name="cidade"
              defaultValue={loja?.cidade ?? ""}
              placeholder="Ex.: Fortaleza"
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className={labelClass} htmlFor="endereco">
            Endereço
          </label>
          <input
            id="endereco"
            name="endereco"
            defaultValue={loja?.endereco ?? ""}
            placeholder="Rua, número - bairro"
            className={inputClass}
          />
        </div>

        <div className="flex gap-2 pt-1">
          <button type="submit" className={btnPrimary}>
            {submitLabel}
          </button>
          <Link href="/lojas" className={btnSecondary}>
            Cancelar
          </Link>
        </div>
      </form>
    </Card>
  );
}
