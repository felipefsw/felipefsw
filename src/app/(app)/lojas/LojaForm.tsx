import Link from "next/link";
import { Card, btnPrimary, btnSecondary, inputClass, labelClass } from "@/components/ui";

type LojaDefaults = {
  id?: string;
  nome?: string;
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
