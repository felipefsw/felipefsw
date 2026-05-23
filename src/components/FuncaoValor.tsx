"use client";

import { useState } from "react";

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100";
const labelClass = "block text-sm font-medium text-gray-700 mb-1";

function centavosParaTexto(c: number): string {
  return (c / 100).toFixed(2).replace(".", ",");
}

export default function FuncaoValor({
  funcoes,
  valores,
  defaultFuncao = "",
  defaultValor = "",
}: {
  funcoes: readonly string[];
  valores: Record<string, number>; // função -> centavos
  defaultFuncao?: string;
  defaultValor?: string;
}) {
  const [valor, setValor] = useState(defaultValor);

  return (
    <>
      <div>
        <label className={labelClass} htmlFor="funcao">
          Função
        </label>
        <select
          id="funcao"
          name="funcao"
          defaultValue={defaultFuncao}
          className={inputClass}
          onChange={(e) => {
            const v = valores[e.target.value];
            if (v && v > 0) setValor(centavosParaTexto(v));
          }}
        >
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
          Valor da diária (R$) *
        </label>
        <input
          id="valorDiaria"
          name="valorDiaria"
          inputMode="decimal"
          required
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          placeholder="ex.: 120,00"
          className={inputClass}
        />
        <p className="mt-1 text-xs text-gray-400">
          Preenche automático pela função (você pode ajustar).
        </p>
      </div>
    </>
  );
}
