"use client";

import { useState } from "react";

// Mostra o link secreto de 1º acesso/senha para enviar no WhatsApp da pessoa.
export default function LinkAcesso({ token, nome }: { token: string; nome?: string }) {
  const [copiado, setCopiado] = useState(false);

  function link() {
    return `${window.location.origin}/definir-senha/${token}`;
  }
  function whatsapp() {
    const msg = `Olá${nome ? `, ${nome}` : ""}! Crie sua senha de acesso ao app das Pizzarias RWP por aqui (link pessoal, não compartilhe): ${link()}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  }
  async function copiar() {
    try {
      await navigator.clipboard.writeText(link());
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      /* navegador bloqueou a cópia */
    }
  }

  return (
    <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-2">
      <p className="text-[11px] font-medium text-amber-800">
        Link de acesso — envie no WhatsApp da pessoa (uso único):
      </p>
      <div className="mt-1 flex gap-1.5">
        <button
          type="button"
          onClick={whatsapp}
          className="rounded bg-green-600 px-2 py-1 text-xs font-semibold text-white hover:bg-green-700"
        >
          📲 WhatsApp
        </button>
        <button
          type="button"
          onClick={copiar}
          className="rounded border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700"
        >
          {copiado ? "Copiado!" : "Copiar link"}
        </button>
      </div>
    </div>
  );
}
