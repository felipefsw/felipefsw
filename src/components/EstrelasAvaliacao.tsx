"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { avaliarComEstrelas } from "@/app/loja/actions";

// Avaliação estilo iFood: toca numa estrela e já registra (sem abrir página).
export default function EstrelasAvaliacao({
  escalaId,
  valorInicial = 0,
  acao,
}: {
  escalaId: string;
  valorInicial?: number;
  acao?: (escalaId: string, estrelas: number) => Promise<void>;
}) {
  const router = useRouter();
  const [valor, setValor] = useState(valorInicial);
  const [hover, setHover] = useState(0);
  const [pending, start] = useTransition();

  function escolher(n: number) {
    setValor(n);
    start(async () => {
      await (acao ?? avaliarComEstrelas)(escalaId, n);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-0.5" aria-busy={pending}>
      {[1, 2, 3, 4, 5].map((n) => {
        const aceso = (hover || valor) >= n;
        return (
          <button
            key={n}
            type="button"
            disabled={pending}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => escolher(n)}
            aria-label={`${n} estrela${n > 1 ? "s" : ""}`}
            className="p-0.5 text-2xl leading-none transition-transform active:scale-90 disabled:opacity-50"
          >
            <span className={aceso ? "text-amber-500" : "text-gray-300"}>★</span>
          </button>
        );
      })}
    </div>
  );
}
