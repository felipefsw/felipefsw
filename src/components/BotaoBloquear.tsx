"use client";

import { useState } from "react";
import { bloquearDiaristaLoja } from "@/app/loja/actions";
import SubmitButton from "@/components/SubmitButton";

// Botão "Bloquear" (lado loja/gestor) com motivo. Para gestor com várias lojas,
// permite escolher as lojas; para loja avulsa, bloqueia a própria.
export default function BotaoBloquear({
  diaristaId,
  lojas,
}: {
  diaristaId: string;
  lojas?: { id: string; nome: string }[];
}) {
  const [aberto, setAberto] = useState(false);
  const [motivo, setMotivo] = useState("");
  const multi = (lojas?.length ?? 0) > 1;

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

  const campoMotivo = (
    <textarea
      value={motivo}
      onChange={(e) => setMotivo(e.target.value)}
      rows={2}
      placeholder="Motivo (ex.: faltou sem avisar, conduta inadequada…)"
      className="w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs outline-none focus:border-red-500"
    />
  );

  if (multi) {
    return (
      <form
        action={bloquearDiaristaLoja}
        className="space-y-1.5 rounded-lg border border-red-200 bg-red-50 p-2"
      >
        <input type="hidden" name="diaristaId" value={diaristaId} />
        <input type="hidden" name="motivo" value={motivo} />
        {campoMotivo}
        <p className="text-xs font-medium text-gray-600">Bloquear nas lojas:</p>
        <div className="max-h-32 space-y-1 overflow-y-auto">
          {lojas!.map((l) => (
            <label key={l.id} className="flex items-center gap-1.5 text-xs text-gray-800">
              <input
                type="checkbox"
                name="lojaIds"
                value={l.id}
                defaultChecked
                className="h-3.5 w-3.5 rounded border-gray-300 text-red-600"
              />
              {l.nome}
            </label>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <select
            name="dias"
            defaultValue="7"
            className="rounded border border-gray-300 px-1.5 py-1 text-xs"
          >
            <option value="7">7 dias</option>
            <option value="14">14 dias</option>
            <option value="21">21 dias</option>
          </select>
          <SubmitButton className="rounded-lg border border-red-200 bg-white px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50">
            Bloquear
          </SubmitButton>
          <button
            type="button"
            onClick={() => setAberto(false)}
            className="text-xs text-gray-400 underline"
          >
            cancelar
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="w-full space-y-1.5 rounded-lg border border-red-200 bg-red-50 p-2">
      {campoMotivo}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-gray-500">Bloquear por:</span>
        {[7, 14, 21].map((dias) => (
          <form key={dias} action={bloquearDiaristaLoja}>
            <input type="hidden" name="diaristaId" value={diaristaId} />
            <input type="hidden" name="dias" value={dias} />
            <input type="hidden" name="motivo" value={motivo} />
            <SubmitButton className="rounded-lg border border-red-200 bg-white px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50">
              {dias}d
            </SubmitButton>
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
