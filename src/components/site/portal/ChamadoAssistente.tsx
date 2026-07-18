"use client";

/*
  Assistente de chamados (robô). Fluxo demonstrativo:
  descreve o problema → o assistente responde pela base de conhecimento →
  "resolveu?" → se não, escala para um técnico da TI.
*/
import { useState } from "react";
import { buscarKB, PROBLEMAS_SUGERIDOS, type ArtigoKB } from "@/lib/site/chamados";

type Fase = "inicio" | "resposta" | "semResposta" | "resolvido" | "escalado";

export default function ChamadoAssistente() {
  const [texto, setTexto] = useState("");
  const [fase, setFase] = useState<Fase>("inicio");
  const [artigo, setArtigo] = useState<ArtigoKB | null>(null);
  const [protocolo, setProtocolo] = useState(4822);

  function perguntar(valor: string) {
    const termo = valor.trim();
    if (!termo) return;
    const achado = buscarKB(termo);
    setArtigo(achado);
    setFase(achado ? "resposta" : "semResposta");
  }

  function escalar() {
    setFase("escalado");
  }

  function reiniciar() {
    setTexto("");
    setArtigo(null);
    setProtocolo((p) => p + 1);
    setFase("inicio");
  }

  return (
    <div>
      {(fase === "inicio" || fase === "resposta" || fase === "semResposta") && (
        <>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              perguntar(texto);
            }}
            className="flex flex-col gap-2"
          >
            <label htmlFor="chamado-texto" className="text-sm font-medium">
              Descreva o problema
            </label>
            <div className="flex gap-2">
              <input
                id="chamado-texto"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Ex.: a impressora parou de imprimir"
                className="rwp-tap flex-1 rounded-lg border border-[var(--rwp-line)] bg-white px-3 text-base"
              />
              <button
                type="submit"
                className="rwp-tap rounded-full bg-[var(--rwp-orange)] px-4 text-sm font-semibold text-white hover:bg-[var(--rwp-orange-strong)]"
              >
                Perguntar
              </button>
            </div>
          </form>

          <div className="mt-3 flex flex-wrap gap-2">
            {PROBLEMAS_SUGERIDOS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => {
                  setTexto(p);
                  perguntar(p);
                }}
                className="rounded-full border border-[var(--rwp-line)] px-3 py-1 text-xs font-medium hover:bg-[var(--rwp-surface-2)]"
              >
                {p}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Resposta do robô a partir da base de conhecimento */}
      {fase === "resposta" && artigo && (
        <div className="mt-4 rounded-xl border border-[var(--rwp-line)] bg-[var(--rwp-surface-2)] p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--rwp-orange-strong)]">
            🤖 Assistente
          </p>
          <p className="mt-1 font-semibold">{artigo.titulo} — tente estes passos:</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
            {artigo.passos.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ol>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setFase("resolvido")}
              className="rwp-tap rounded-full bg-[var(--rwp-orange)] px-4 text-sm font-semibold text-white hover:bg-[var(--rwp-orange-strong)]"
            >
              Resolveu, obrigado
            </button>
            <button
              type="button"
              onClick={escalar}
              className="rwp-tap rounded-full border border-[var(--rwp-line)] px-4 text-sm font-semibold hover:bg-white"
            >
              Não resolveu — abrir chamado para a TI
            </button>
          </div>
        </div>
      )}

      {/* Sem resposta pronta */}
      {fase === "semResposta" && (
        <div className="mt-4 rounded-xl border border-[var(--rwp-line)] bg-[var(--rwp-surface-2)] p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--rwp-orange-strong)]">🤖 Assistente</p>
          <p className="mt-1 text-sm">
            Não tenho uma resposta pronta para isso. Posso abrir um chamado para um técnico da TI.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={escalar}
              className="rwp-tap rounded-full bg-[var(--rwp-orange)] px-4 text-sm font-semibold text-white hover:bg-[var(--rwp-orange-strong)]"
            >
              Abrir chamado para a TI
            </button>
            <button
              type="button"
              onClick={reiniciar}
              className="rwp-tap rounded-full border border-[var(--rwp-line)] px-4 text-sm font-semibold hover:bg-white"
            >
              Tentar de novo
            </button>
          </div>
        </div>
      )}

      {/* Resolvido pelo robô */}
      {fase === "resolvido" && (
        <div className="mt-4 rounded-xl bg-[#e7f4ec] p-4">
          <p className="font-semibold text-[#0f6b31]">✓ Resolvido sem abrir chamado</p>
          <p className="mt-1 text-sm text-[#0f6b31]">
            O assistente resolveu — isso conta para a taxa de resolução automática (deflection).
          </p>
          <button
            type="button"
            onClick={reiniciar}
            className="rwp-tap mt-3 rounded-full border border-[#bfe3cd] px-4 text-sm font-semibold text-[#0f6b31] hover:bg-white"
          >
            Nova pergunta
          </button>
        </div>
      )}

      {/* Escalado para a TI */}
      {fase === "escalado" && (
        <div className="mt-4 rounded-xl bg-[#fbf1df] p-4">
          <p className="font-semibold text-[#8a4e06]">Chamado #{protocolo} aberto e escalado à TI</p>
          <p className="mt-1 text-sm text-[#8a4e06]">
            Um técnico assume a partir daqui. Tempo médio de resposta: 1h20. Você acompanha o status
            na lista ao lado.
          </p>
          <button
            type="button"
            onClick={reiniciar}
            className="rwp-tap mt-3 rounded-full border border-[#eBd9b3] px-4 text-sm font-semibold text-[#8a4e06] hover:bg-white"
          >
            Novo chamado
          </button>
        </div>
      )}
    </div>
  );
}
