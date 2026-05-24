import { inputClass, labelClass } from "@/components/ui";
import { VALORES_DIARIA } from "@/lib/valoresDiaria";

export default function FuncaoValor({
  funcoes,
  defaultFuncao = "",
}: {
  funcoes: readonly string[];
  defaultFuncao?: string;
}) {
  return (
    <>
      <div>
        <label className={labelClass} htmlFor="funcao">
          Função
        </label>
        <select id="funcao" name="funcao" defaultValue={defaultFuncao} className={inputClass}>
          <option value="">— Qualquer —</option>
          {funcoes.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass} htmlFor="valorDiaria">
          Valor da diária *
        </label>
        <select id="valorDiaria" name="valorDiaria" required defaultValue="" className={inputClass}>
          <option value="" disabled>
            — Escolha —
          </option>
          {VALORES_DIARIA.map((v) => (
            <option key={v.value} value={v.value}>
              {v.label}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
