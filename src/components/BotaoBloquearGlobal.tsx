"use client";

import { useState } from "react";
import { bloquearGlobal } from "@/app/(app)/diaristas/actions";

// Bloqueio GLOBAL na aba Diaristas (RH): 7/14/30 dias ou para sempre, com motivo.
export default function BotaoBloquearGlobal({ id }: { id: string }) {
  const [aberto, setAberto] = useState(false);
  const [motivo, setMotivo] = useState("");

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="rounded-lg border border-red-200 bg-white px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
      >
        Bloquear
      </button>
    );
  }

  const opcoes = [
    { v: "7", txt: "7d" },
    { v: "14", txt: "14d" },
    { v: "30", txt: "30d" },
    { v: "sempre", txt: "sempre" },
  ];

  return (
    <div className="w-full rounded-lg border border-red-200 bg-red-50 p-2">
      <textarea
        value={motivo}
        onChange={(e) => setMotivo(e.target.value)}
        rows={2}
        placeholder="Motivo do bloqueio (lista negra) — ex.: faltou sem avisar, conduta inadequada..."
        className="mb-2 w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs outline-none focus:border-red-500"
      />
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-gray-500">Bloquear:</span>
        {opcoes.map((o) => (
          <form key={o.v} action={bloquearGlobal}>
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="dias" value={o.v} />
            <input type="hidden" name="motivo" value={motivo} />
            <button
              type="submit"
              className="rounded-lg border border-red-200 bg-white px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
            >
              {o.txt}
            </button>
          </form>
        ))}
        <button
          type="button"
          onClick={() => setAberto(false)}
          className="text-xs text-gray-400 underline"
        >
          cancelar
        </button>
      </div>
    </div>
  );
}
