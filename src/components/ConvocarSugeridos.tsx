"use client";

import { useState } from "react";
import Avatar from "@/components/Avatar";
import SubmitButton from "@/components/SubmitButton";

type Pessoa = { id: string; nome: string; fotoUrl: string | null; diarias: number };
type Grupo = { funcao: string; lista: Pessoa[] };

// Convocar direto os sugeridos: uma ÚNICA data no topo (libera espaço para o
// nome de cada pessoa) e um botão "Convocar" por pessoa.
export default function ConvocarSugeridos({
  grupos,
  hoje,
  max,
  acao,
}: {
  grupos: Grupo[];
  hoje: string;
  max: string;
  acao: (formData: FormData) => void;
}) {
  const [data, setData] = useState(hoje);

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <label htmlFor="convocar-data" className="text-xs font-medium text-gray-600">
          Convocar para o dia:
        </label>
        <input
          id="convocar-data"
          type="date"
          value={data}
          min={hoje}
          max={max}
          onChange={(e) => setData(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-sm"
        />
      </div>
      <div className="space-y-2">
        {grupos.map((g) => (
          <details key={g.funcao} className="rounded-lg border border-gray-200">
            <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-gray-800">
              {g.funcao} ({g.lista.length})
            </summary>
            <ul className="divide-y divide-gray-100 px-3 pb-2">
              {g.lista.map((d, i) => (
                <li key={d.id} className="flex items-center justify-between gap-2 py-2">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="w-4 shrink-0 text-center text-xs font-bold text-gray-400">
                      {i + 1}
                    </span>
                    <Avatar nome={d.nome} fotoUrl={d.fotoUrl} className="h-8 w-8" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-gray-900">
                        {d.nome}
                      </span>
                      <span className="block text-[11px] text-gray-500">{d.diarias} diária(s)</span>
                    </span>
                  </span>
                  <form action={acao} className="shrink-0">
                    <input type="hidden" name="diaristaId" value={d.id} />
                    <input type="hidden" name="data" value={data} />
                    <SubmitButton className="rounded-lg bg-orange-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-800">
                      Convocar
                    </SubmitButton>
                  </form>
                </li>
              ))}
            </ul>
          </details>
        ))}
      </div>
    </div>
  );
}
