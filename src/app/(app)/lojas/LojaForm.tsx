import Link from "next/link";
import { Card, btnPrimary, btnSecondary, inputClass, labelClass } from "@/components/ui";
import GeoCapture from "@/components/GeoCapture";

type LojaDefaults = {
  id?: string;
  nome?: string;
  cnpj?: string | null;
  cidade?: string | null;
  bairro?: string | null;
  endereco?: string | null;
  gestores?: { id: string }[];
  latitude?: number | null;
  longitude?: number | null;
  permiteMais2Semana?: boolean;
};

export default function LojaForm({
  action,
  loja,
  gestores,
  submitLabel,
  erro,
}: {
  action: (formData: FormData) => void;
  loja?: LojaDefaults;
  gestores: { id: string; nome: string }[];
  submitLabel: string;
  erro?: string;
}) {
  const gestoresDaLoja = new Set(loja?.gestores?.map((g) => g.id) ?? []);
  return (
    <Card>
      <form action={action} className="space-y-4">
        {loja?.id ? <input type="hidden" name="id" value={loja.id} /> : null}

        {erro === "cnpj" && (
          <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
            CNPJ inválido. Confira os números e tente novamente.
          </p>
        )}

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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="bairro">
              Bairro
            </label>
            <input
              id="bairro"
              name="bairro"
              defaultValue={loja?.bairro ?? ""}
              placeholder="Ex.: Aldeota"
              className={inputClass}
            />
          </div>
          <div className="sm:col-span-2">
            <p className={labelClass}>Gestores (sócios) — pode marcar mais de um</p>
            {gestores.length === 0 ? (
              <p className="text-xs text-gray-400">Nenhum gestor cadastrado ainda.</p>
            ) : (
              <div className="grid grid-cols-2 gap-1">
                {gestores.map((g) => (
                  <label
                    key={g.id}
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      name="gestorIds"
                      value={g.id}
                      defaultChecked={gestoresDaLoja.has(g.id)}
                      className="h-4 w-4 rounded border-gray-300 text-orange-700 focus:ring-orange-600"
                    />
                    <span className="truncate text-gray-700">{g.nome}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <label className={labelClass} htmlFor="endereco">
            Endereço (rua, número)
          </label>
          <input
            id="endereco"
            name="endereco"
            defaultValue={loja?.endereco ?? ""}
            placeholder="Rua, número"
            className={inputClass}
          />
        </div>

        <GeoCapture
          defaultLat={loja?.latitude != null ? String(loja.latitude) : ""}
          defaultLng={loja?.longitude != null ? String(loja.longitude) : ""}
        />

        <label className="flex items-start gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
          <input
            type="checkbox"
            name="permiteMais2Semana"
            defaultChecked={loja?.permiteMais2Semana ?? false}
            className="mt-0.5 h-5 w-5 rounded border-gray-300 text-orange-700 focus:ring-orange-600"
          />
          <span className="text-sm text-gray-700">
            Permitir o mesmo diarista fazer <strong>mais de 2 diárias por semana</strong> nesta loja
            (assumindo o risco de vínculo trabalhista).
          </span>
        </label>

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
