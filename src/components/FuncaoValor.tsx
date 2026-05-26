import { inputClass, labelClass } from "@/components/ui";
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
        <label className={labelClass} htmlFor="valorDiaria">
          Valor da diária *
        </label>
        <select id="valorDiaria" name="valorDiaria" required defaultValue="" className={inputClass}>
          <option value="" disabled>
            Escolha o valor
          </option>
          {VALORES_DIARIA.map((v) => (
            <option key={v.value} value={v.value}>
              R$ {v.total} ({v.base}+10 transp.)
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
