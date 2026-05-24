"use client";

import { useState } from "react";

export default function ConfirmDeleteLoja({
  id,
  nome,
  action,
  className,
}: {
  id: string;
  nome: string;
  action: (formData: FormData) => void | Promise<void>;
  className?: string;
}) {
  const [aberto, setAberto] = useState(false);
  const [texto, setTexto] = useState("");
  const confere = texto.trim().toLowerCase() === nome.trim().toLowerCase();

  function fechar() {
    setAberto(false);
    setTexto("");
  }

  return (
    <>
      <button type="button" className={className} onClick={() => setAberto(true)}>
        Excluir
      </button>
      {aberto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={fechar}
        >
          <div
            className="w-full max-w-sm rounded-xl bg-white p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-gray-900">Excluir loja</h3>
            <p className="mt-1 text-sm text-gray-600">
              Isso apaga <strong>{nome}</strong> e <strong>todos os agendamentos</strong> dela.
              Não dá para desfazer.
            </p>
            <label className="mt-3 block text-xs font-medium text-gray-500">
              Para confirmar, digite o nome da loja:
            </label>
            <input
              autoFocus
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder={nome}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={fechar}
                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <form action={action}>
                <input type="hidden" name="id" value={id} />
                <button
                  type="submit"
                  disabled={!confere}
                  className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Excluir loja
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
