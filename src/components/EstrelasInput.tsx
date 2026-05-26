"use client";

import { useState } from "react";

// Seletor de estrelas (1 a 5) que vai junto no submit do formulário.
// Toque na mesma estrela limpa a nota.
export default function EstrelasInput({
  name,
  defaultValue = 0,
  label,
  size = "lg",
}: {
  name: string;
  defaultValue?: number;
  label?: string;
  size?: "sm" | "lg";
}) {
  const [valor, setValor] = useState(defaultValue);
  const texto = size === "lg" ? "text-3xl" : "text-xl";
  return (
    <div>
      {label && <p className="mb-0.5 text-sm font-medium text-gray-700">{label}</p>}
      <input type="hidden" name={name} value={valor} />
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setValor(valor === n ? 0 : n)}
            aria-label={`${n} estrela${n > 1 ? "s" : ""}`}
            className={`p-0.5 ${texto} leading-none transition-transform active:scale-90`}
          >
            <span className={n <= valor ? "text-amber-500" : "text-gray-300"}>★</span>
          </button>
        ))}
        <span className="ml-1 text-xs text-gray-400">{valor > 0 ? `${valor}/5` : ""}</span>
      </div>
    </div>
  );
}
