"use client";

import { useState } from "react";
import { addDias, inicioDaSemana, semana } from "@/lib/dates";
import { formatDateShort } from "@/lib/format";

export type EventoCalendario = {
  data: string; // "AAAA-MM-DD"
  horaInicio: string | null;
  horaFim: string | null;
  loja: string;
  tipo: "confirmada" | "pendente";
};

const LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

// Calendário semanal (Seg–Dom) do diarista: verde = confirmada, azul = pendente,
// vazio = livre. Navegação de semana instantânea (sem recarregar a página).
export default function CalendarioSemana({
  eventos,
  hoje,
}: {
  eventos: EventoCalendario[];
  hoje: string;
}) {
  const [inicio, setInicio] = useState(() => inicioDaSemana(hoje));
  const dias = semana(inicio);
  const naSemanaAtual = inicio === inicioDaSemana(hoje);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setInicio(addDias(inicio, -7))}
          aria-label="Semana anterior"
          className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-gray-500 transition hover:bg-gray-100"
        >
          ‹
        </button>
        <button
          type="button"
          onClick={() => setInicio(inicioDaSemana(hoje))}
          className="text-sm font-semibold text-gray-800"
        >
          {formatDateShort(dias[0])} – {formatDateShort(dias[6])}
          {!naSemanaAtual && <span className="ml-1 text-xs text-orange-600">• hoje</span>}
        </button>
        <button
          type="button"
          onClick={() => setInicio(addDias(inicio, 7))}
          aria-label="Próxima semana"
          className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-gray-500 transition hover:bg-gray-100"
        >
          ›
        </button>
      </div>

      <ul className="space-y-1">
        {dias.map((d, i) => {
          const evs = eventos.filter((e) => e.data === d);
          const ehHoje = d === hoje;
          return (
            <li
              key={d}
              className={`flex gap-2 rounded-xl px-2 py-1.5 transition ${
                ehHoje ? "bg-orange-50" : ""
              }`}
            >
              <div className="w-9 shrink-0 text-center">
                <div
                  className={`text-[11px] font-medium ${
                    ehHoje ? "text-orange-700" : "text-gray-400"
                  }`}
                >
                  {LABELS[i]}
                </div>
                <div
                  className={`text-base font-bold leading-tight ${
                    ehHoje ? "text-orange-700" : "text-gray-800"
                  }`}
                >
                  {d.slice(8, 10)}
                </div>
              </div>
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1 py-0.5">
                {evs.length === 0 ? (
                  <span className="text-xs text-gray-300">livre</span>
                ) : (
                  evs.map((e, idx) => (
                    <span
                      key={idx}
                      className={`max-w-full truncate rounded-lg px-2 py-1 text-[11px] font-medium ${
                        e.tipo === "confirmada"
                          ? "bg-green-100 text-green-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {e.horaInicio && e.horaFim ? `${e.horaInicio}–${e.horaFim} · ` : ""}
                      {e.loja}
                    </span>
                  ))
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-2 flex items-center gap-3 px-1 text-[10px] text-gray-400">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-green-500" /> confirmada
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-blue-500" /> pendente
        </span>
      </div>
    </div>
  );
}
