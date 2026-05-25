"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { enviarMensagemDiarista } from "@/app/d/[token]/actions";

type Msg = { id: string; autor: string; texto: string };

export default function ChatRH({ token, mensagens }: { token: string; mensagens: Msg[] }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    const t = texto.trim();
    if (!t) return;
    setEnviando(true);
    try {
      const fd = new FormData();
      fd.set("token", token);
      fd.set("texto", t);
      await enviarMensagemDiarista(fd);
      setTexto("");
      router.refresh();
    } finally {
      setEnviando(false);
    }
  }

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        aria-label="Falar com o RH"
        data-tour="diarista-chat"
        className="fixed bottom-20 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-orange-600 text-2xl text-white shadow-lg ring-4 ring-orange-600/20 hover:bg-orange-700"
      >
        💬
        {mensagens.some((m) => m.autor === "GESTAO") && (
          <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-red-500" />
        )}
      </button>
    );
  }

  return (
    <div className="fixed bottom-20 right-4 z-30 flex max-h-[70vh] w-[92vw] max-w-sm flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
      <div className="flex items-center justify-between bg-neutral-900 px-4 py-2 text-white">
        <span className="text-sm font-semibold">Falar com o RH</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setAberto(false)}
            aria-label="Minimizar"
            className="rounded px-2 text-lg leading-none hover:bg-white/10"
          >
            –
          </button>
          <button
            type="button"
            onClick={() => setAberto(false)}
            aria-label="Fechar"
            className="rounded px-2 text-base leading-none hover:bg-white/10"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        <p className="text-[11px] text-gray-400">
          Avise atraso, imprevisto ou tire dúvidas. Isso não muda sua nota nem sua presença.
        </p>
        {mensagens.length === 0 ? (
          <p className="text-sm text-gray-400">Nenhuma mensagem ainda.</p>
        ) : (
          mensagens.map((m) => (
            <div
              key={m.id}
              className={
                m.autor === "DIARISTA"
                  ? "ml-6 rounded-xl bg-orange-50 p-2 text-sm text-gray-800"
                  : "mr-6 rounded-xl bg-gray-100 p-2 text-sm text-gray-800"
              }
            >
              <span className="block text-[10px] font-medium text-gray-400">
                {m.autor === "DIARISTA" ? "Você" : "RH"}
              </span>
              {m.texto}
            </div>
          ))
        )}
      </div>

      <form onSubmit={enviar} className="flex items-center gap-2 border-t border-gray-200 p-2">
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Escreva sua mensagem…"
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-orange-600 focus:ring-2 focus:ring-orange-100"
        />
        <button
          type="submit"
          disabled={enviando}
          className="shrink-0 rounded-lg bg-orange-600 px-3 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-60"
        >
          {enviando ? "…" : "Enviar"}
        </button>
      </form>
    </div>
  );
}
