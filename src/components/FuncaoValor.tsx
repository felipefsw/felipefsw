import { labelClass } from "@/components/ui";
import { VALORES_DIARIA } from "@/lib/valoresDiaria";

// Função e valor da diária por TOQUE (sem listas suspensas).
export default function FuncaoValor({
  funcoes,
  defaultFuncao = "",
}: {
  funcoes: readonly string[];
  defaultFuncao?: string;
}) {
  const chip =
    "block cursor-pointer rounded-full border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 peer-checked:border-orange-600 peer-checked:bg-orange-600 peer-checked:text-white";

  return (
    <>
      <div>
        <p className={labelClass}>Função (toque em uma)</p>
        <div className="flex flex-wrap gap-2">
          <label>
            <input
              type="radio"
              name="funcao"
              value=""
              defaultChecked={defaultFuncao === ""}
              className="peer sr-only"
            />
            <span className={chip}>Qualquer</span>
          </label>
          {funcoes.map((f) => (
            <label key={f}>
              <input
                type="radio"
                name="funcao"
                value={f}
                defaultChecked={defaultFuncao === f}
                className="peer sr-only"
              />
              <span className={chip}>{f}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <p className={labelClass}>Valor da diária * (toque em um)</p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {VALORES_DIARIA.map((v) => (
            <label key={v.value}>
              <input
                type="radio"
                name="valorDiaria"
                value={v.value}
                required
                className="peer sr-only"
              />
              <span className="block cursor-pointer rounded-lg border border-gray-300 bg-white px-2 py-2 text-center text-gray-700 peer-checked:border-orange-600 peer-checked:bg-orange-50 peer-checked:text-orange-800 peer-checked:ring-2 peer-checked:ring-orange-300">
                <span className="block text-sm font-bold">R$ {v.total}</span>
                <span className="block text-[10px] text-gray-500 peer-checked:text-orange-700">
                  {v.base}+10 transp.
                </span>
              </span>
            </label>
          ))}
        </div>
      </div>
    </>
  );
}
