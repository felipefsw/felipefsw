import { prisma } from "@/lib/prisma";
import { Card, PageHeader, btnPrimary, inputClass, labelClass } from "@/components/ui";
import { FUNCOES } from "@/lib/funcoes";
import { salvarValoresFuncao } from "./actions";

export const dynamic = "force-dynamic";

export default async function ValoresFuncaoPage() {
  const valores = await prisma.valorFuncao.findMany();
  const mapa = new Map(valores.map((v) => [v.funcao, v.valor]));
  const texto = (funcao: string) => {
    const v = mapa.get(funcao);
    return v && v > 0 ? (v / 100).toFixed(2).replace(".", ",") : "";
  };

  return (
    <div>
      <PageHeader
        title="Valores por função"
        subtitle="Valor padrão da diária sugerido nas requisições"
      />
      <Card>
        <form action={salvarValoresFuncao} className="space-y-4">
          {FUNCOES.map((f, i) => (
            <div key={f}>
              <label className={labelClass} htmlFor={`valor_${i}`}>
                {f} (R$)
              </label>
              <input
                id={`valor_${i}`}
                name={`valor_${i}`}
                inputMode="decimal"
                defaultValue={texto(f)}
                placeholder="ex.: 120,00"
                className={inputClass}
              />
            </div>
          ))}
          <button type="submit" className={btnPrimary}>
            Salvar valores
          </button>
        </form>
        <p className="mt-2 text-xs text-gray-400">
          Esses valores aparecem automaticamente quando a loja escolhe a função na requisição.
          A loja ainda pode ajustar caso necessário.
        </p>
      </Card>
    </div>
  );
}
