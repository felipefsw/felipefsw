"use client";

import { useEffect, useState } from "react";
import type { PassoTrilha } from "@/lib/trilhas";

type Rect = { top: number; left: number; width: number; height: number };

// Trilha de aprendizado em holofote: escurece a tela e ilumina o elemento real
// do passo, com um balão apontando. Abre sozinho na primeira vez; depois fica
// no botão flutuante "Guia". Se o alvo não estiver na tela, mostra centralizado.
export default function TrilhaAprendizado({
  id,
  titulo,
  passos,
  posicao = "padrao",
}: {
  id: string;
  titulo: string;
  passos: PassoTrilha[];
  posicao?: "padrao" | "acimaMenu" | "esquerda";
}) {
  const chave = `trilha:${id}`;
  const [aberto, setAberto] = useState(false);
  const [visivel, setVisivel] = useState(false);
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);

  // Primeira visita: abre sozinho (e marca como visto, para não repetir).
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
    }, 400);
    return () => clearTimeout(t);
  }, [chave]);

  // Fade-in ao abrir.
  useEffect(() => {
    if (!aberto) return;
    const t = setTimeout(() => setVisivel(true), 10);
    return () => clearTimeout(t);
  }, [aberto]);

  // Mede e acompanha o elemento-alvo do passo atual.
  useEffect(() => {
    if (!aberto) return;
    const alvo = passos[i]?.alvo;
    const medir = (rolar: boolean) => {
      if (!alvo) {
        setRect(null);
        return;
      }
      const el = document.querySelector(alvo) as HTMLElement | null;
      if (!el) {
        setRect(null);
        return;
      }
      if (rolar) el.scrollIntoView({ block: "center", inline: "nearest" });
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    };
    let raf = requestAnimationFrame(() => {
      medir(true);
      raf = requestAnimationFrame(() => medir(false));
    });
    const onMove = () => medir(false);
    window.addEventListener("resize", onMove);
    window.addEventListener("scroll", onMove, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onMove);
      window.removeEventListener("scroll", onMove, true);
    };
  }, [aberto, i, passos]);

  function fechar() {
    setVisivel(false);
    setTimeout(() => setAberto(false), 200);
  }
  function abrir() {
    setI(0);
    setVisivel(false);
    setAberto(true);
  }

  const passo = passos[i];
  const ultimo = i === passos.length - 1;
  const posCls =
    posicao === "acimaMenu"
      ? "bottom-20 right-4"
      : posicao === "esquerda"
        ? "bottom-5 left-4"
        : "bottom-5 right-4";

  // Posição do balão em relação ao alvo (acima se o alvo está na metade de baixo).
  let estiloBalao: React.CSSProperties | undefined;
  if (rect && typeof window !== "undefined") {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const larg = Math.min(340, vw - 16);
    const left = Math.min(Math.max(8, rect.left), vw - larg - 8);
    const acima = rect.top > vh / 2;
    estiloBalao = acima
      ? { top: rect.top - 12, left, width: larg, transform: "translateY(-100%)" }
      : { top: rect.top + rect.height + 12, left, width: larg };
  }

  const conteudo = (
    <>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wide text-orange-700">{titulo}</span>
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

      <div className="mb-1 text-3xl">{passo.emoji ?? "✨"}</div>
      <h3 className="text-lg font-bold text-gray-900">{passo.titulo}</h3>
      <p className="mt-1 text-sm leading-relaxed text-gray-600">{passo.descricao}</p>

      <div className="mt-5 flex items-center justify-between gap-2">
        <span className="text-xs text-gray-400">
          {i + 1} de {passos.length}
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
    </>
  );

  return (
    <>
      <button
        type="button"
        onClick={abrir}
        className={`fixed ${posCls} z-30 flex items-center gap-1.5 rounded-full bg-orange-700 px-3 py-2 text-sm font-semibold text-white shadow-lg hover:bg-orange-800`}
      >
        <span>💡</span> Guia
      </button>

      {aberto && (
        <div
          className={`fixed inset-0 z-50 transition-opacity duration-200 ${
            visivel ? "opacity-100" : "opacity-0"
          }`}
        >
          {rect && estiloBalao ? (
            <>
              {/* recorte iluminado (holofote) */}
              <div
                className="pointer-events-none absolute rounded-xl transition-all duration-300"
                style={{
                  top: rect.top - 6,
                  left: rect.left - 6,
                  width: rect.width + 12,
                  height: rect.height + 12,
                  boxShadow:
                    "0 0 0 3px rgba(234,88,12,0.95), 0 0 0 9999px rgba(0,0,0,0.65)",
                }}
              />
              {/* balão apontando para o elemento */}
              <div
                className="absolute rounded-2xl bg-white p-4 shadow-2xl"
                style={estiloBalao}
              >
                {conteudo}
              </div>
            </>
          ) : (
            <>
              <div className="absolute inset-0 bg-black/65" onClick={fechar} />
              <div className="absolute inset-0 flex items-end justify-center p-4 sm:items-center">
                <div className="relative w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
                  {conteudo}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
