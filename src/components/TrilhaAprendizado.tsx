"use client";

import { useEffect, useState } from "react";
import type { PassoTrilha } from "@/lib/trilhas";

// Trilha de aprendizado: guia passo a passo em overlay escurecido (afuscação),
// com fade. Abre sozinho na primeira vez; depois fica no botão flutuante "Guia".
export default function TrilhaAprendizado({
  id,
  titulo,
  passos,
  posicao = "padrao",
}: {
  id: string;
  titulo: string;
  passos: PassoTrilha[];
  posicao?: "padrao" | "acimaMenu";
}) {
  const chave = `trilha:${id}`;
  const [aberto, setAberto] = useState(false);
  const [visivel, setVisivel] = useState(false);
  const [i, setI] = useState(0);

  // Primeira visita: abre sozinho (e já marca como visto, para não repetir).
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        if (localStorage.getItem(chave) !== "1") {
          localStorage.setItem(chave, "1");
          setI(0);
          setAberto(true);
        }
      } catch {
        /* localStorage indisponível */
      }
    }, 350);
    return () => clearTimeout(t);
  }, [chave]);

  // Fade-in ao abrir.
  useEffect(() => {
    if (!aberto) return;
    const t = setTimeout(() => setVisivel(true), 10);
    return () => clearTimeout(t);
  }, [aberto]);

  function fechar() {
    setVisivel(false);
    setTimeout(() => setAberto(false), 200);
  }
  function abrir() {
    setI(0);
    setVisivel(false);
    setAberto(true);
  }

  const ultimo = i === passos.length - 1;
  const passo = passos[i];
  const baixo = posicao === "acimaMenu" ? "bottom-20" : "bottom-5";

  return (
    <>
      <button
        type="button"
        onClick={abrir}
        className={`fixed ${baixo} right-4 z-30 flex items-center gap-1.5 rounded-full bg-orange-700 px-3 py-2 text-sm font-semibold text-white shadow-lg hover:bg-orange-800`}
      >
        <span>💡</span> Guia
      </button>

      {aberto && (
        <div
          className={`fixed inset-0 z-50 flex items-end justify-center p-4 transition-opacity duration-200 sm:items-center ${
            visivel ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="absolute inset-0 bg-black/60" onClick={fechar} />

          <div
            className={`relative w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl transition-all duration-200 ${
              visivel ? "translate-y-0 scale-100 opacity-100" : "translate-y-4 scale-95 opacity-0"
            }`}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wide text-orange-700">
                {titulo}
              </span>
              <button
                type="button"
                onClick={fechar}
                className="text-sm font-medium text-gray-400 hover:text-gray-600"
              >
                Pular ✕
              </button>
            </div>

            <div className="mb-4 flex gap-1">
              {passos.map((_, idx) => (
                <span
                  key={idx}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    idx <= i ? "bg-orange-600" : "bg-gray-200"
                  }`}
                />
              ))}
            </div>

            <div className="min-h-[140px]">
              <div className="mb-2 text-4xl">{passo.emoji ?? "✨"}</div>
              <h3 className="text-lg font-bold text-gray-900">{passo.titulo}</h3>
              <p className="mt-1 text-sm leading-relaxed text-gray-600">{passo.descricao}</p>
              {passo.href && (
                <a
                  href={passo.href}
                  className="mt-3 inline-block rounded-lg border border-orange-200 bg-orange-50 px-3 py-1.5 text-sm font-semibold text-orange-800 hover:bg-orange-100"
                >
                  {passo.hrefLabel ?? "Abrir esta tela"} →
                </a>
              )}
            </div>

            <div className="mt-5 flex items-center justify-between gap-2">
              <span className="text-xs text-gray-400">
                Passo {i + 1} de {passos.length}
              </span>
              <div className="flex gap-2">
                {i > 0 && (
                  <button
                    type="button"
                    onClick={() => setI((v) => Math.max(0, v - 1))}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Voltar
                  </button>
                )}
                {ultimo ? (
                  <button
                    type="button"
                    onClick={fechar}
                    className="rounded-lg bg-orange-700 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-800"
                  >
                    Concluir ✓
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setI((v) => Math.min(passos.length - 1, v + 1))}
                    className="rounded-lg bg-orange-700 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-800"
                  >
                    Próximo →
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
