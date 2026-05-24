"use client";

import { useState } from "react";
import { bloquearDiaristaLoja } from "@/app/loja/actions";

// Botão pequeno "Bloquear"; só depois de clicar aparecem 7/14/21 dias.
export default function BotaoBloquear({ diaristaId }: { diaristaId: string }) {
  const [aberto, setAberto] = useState(false);

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

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-gray-500">Bloquear por:</span>
      {[7, 14, 21].map((dias) => (
        <form key={dias} action={bloquearDiaristaLoja}>
          <input type="hidden" name="diaristaId" value={diaristaId} />
          <input type="hidden" name="dias" value={dias} />
          <button
            type="submit"
            className="rounded-lg border border-red-200 bg-white px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
          >
            {dias}d
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
  );
}
