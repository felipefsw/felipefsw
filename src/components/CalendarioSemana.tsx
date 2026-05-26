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
const MAX_VISIVEIS = 4;

// Calendário semanal HORIZONTAL (Seg–Dom em colunas), tipo Google Agenda em
// versão compacta. Verde = confirmada, azul = pendente, vazio = livre.
// Navegação de semana instantânea (sem recarregar).
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
    <div className="rounded-2xl border border-gray-200 bg-white p-2 shadow-sm">
      <div className="mb-2 flex items-center justify-between px-1">
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

      <div className="grid grid-cols-7 gap-0.5">
        {dias.map((d, i) => {
          const evs = eventos
            .filter((e) => e.data === d)
            .sort((a, b) => (a.horaInicio ?? "").localeCompare(b.horaInicio ?? ""));
          const ehHoje = d === hoje;
          const visiveis = evs.slice(0, MAX_VISIVEIS);
          const ocultos = evs.length - visiveis.length;
          return (
            <div
              key={d}
              className={`flex min-h-[5.5rem] flex-col rounded-lg border p-1 ${
                ehHoje ? "border-orange-300 bg-orange-50" : "border-gray-100"
              }`}
            >
              <div className="text-center">
                <div
                  className={`text-[10px] font-medium ${
                    ehHoje ? "text-orange-700" : "text-gray-400"
                  }`}
                >
                  {LABELS[i]}
                </div>
                <div
                  className={`text-sm font-bold leading-tight ${
                    ehHoje ? "text-orange-700" : "text-gray-800"
                  }`}
                >
                  {d.slice(8, 10)}
                </div>
              </div>
              <div className="mt-1 flex-1 space-y-0.5">
                {visiveis.map((e, idx) => (
                  <div
                    key={idx}
                    title={`${e.loja}${
                      e.horaInicio && e.horaFim ? ` (${e.horaInicio}–${e.horaFim})` : ""
                    }`}
                    className={`truncate rounded px-1 py-0.5 text-center text-[9px] font-medium leading-tight ${
                      e.tipo === "confirmada"
                        ? "bg-green-100 text-green-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {e.horaInicio ?? "•"}
                  </div>
                ))}
                {ocultos > 0 && (
                  <div className="text-center text-[9px] text-gray-400">+{ocultos}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex items-center justify-end gap-3 px-1 text-[10px] text-gray-400">
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
