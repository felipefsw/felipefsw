"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { clickMagico, type ResultadoMagico } from "@/app/(app)/requisicoes/actions";
import { formatDateShort } from "@/lib/format";

export default function ClickMagicoBotao() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [res, setRes] = useState<ResultadoMagico | null>(null);

  async function rodar() {
    setPending(true);
    try {
      const r = await clickMagico();
      setRes(r);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={rodar}
        disabled={pending}
        className="w-full rounded-xl bg-orange-600 px-4 py-3 text-center text-base font-bold text-white shadow-sm hover:bg-orange-700 disabled:opacity-60"
      >
        {pending ? "Convocando…" : "✨ Click mágico — convocar os melhores para cada vaga"}
      </button>

      {res && (
        <div className="mt-3 rounded-xl border border-green-200 bg-green-50 p-3">
          <p className="text-sm font-semibold text-green-800">
            ✨ {res.total} convocação(ões) enviada(s) em {res.itens.length} vaga(s).
          </p>
          {res.total === 0 ? (
            <p className="mt-1 text-xs text-green-800">
              Nenhuma vaga aberta para preencher (ou ninguém livre/elegível no dia).
            </p>
          ) : (
            <ul className="mt-2 space-y-1.5">
              {res.itens.map((it, i) => (
                <li key={i} className="rounded-lg bg-white/70 p-2 text-sm">
                  <p className="font-medium text-gray-900">
                    {it.loja}
                    <span className="font-normal text-gray-500">
                      {" · "}
                      {it.funcao ?? "qualquer"} · {formatDateShort(it.data)} · {it.horaInicio}–
                      {it.horaFim} · {it.nomes.length} pessoa(s)
                    </span>
                  </p>
                  <p className="text-xs text-gray-600">Convocados: {it.nomes.join(", ")}</p>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-2 text-[11px] text-green-700">
            Os diaristas vão aceitar pelo app. Acompanhe em cada requisição.
          </p>
        </div>
      )}
    </div>
  );
}
