"use client";

import { useMemo, useState } from "react";
import { PainelCard, StatusPill } from "@/components/site/portal/ui";
import { faixaDaNota } from "@/lib/site/portal";
import {
  GESTORES,
  LOJAS_RANKING,
  RANKING_INDICADORES,
  nomeGestor,
  notaPonderada,
} from "@/lib/site/ranking";

const COR_FAIXA: Record<string, string> = {
  saudavel: "text-[#0f6b31]",
  atencao: "text-[#8a4e06]",
  critico: "text-[#b21f14]",
};

// Pesos padrão (em pontos), alinhados por índice a RANKING_INDICADORES.
const PADRAO = RANKING_INDICADORES.map((i) => Math.round(i.peso * 100));

export default function RankingPage() {
  const [gestor, setGestor] = useState<string>("todos");
  const [raw, setRaw] = useState<number[]>(PADRAO);

  const soma = raw.reduce((a, b) => a + b, 0);
  // Pesos normalizados (somam 1). Se tudo zerar, cai em pesos iguais.
  const pesos = RANKING_INDICADORES.map((ind, i) => ({
    ...ind,
    peso: soma > 0 ? raw[i] / soma : 1 / RANKING_INDICADORES.length,
  }));

  const lojas = useMemo(() => {
    return LOJAS_RANKING.filter((l) => gestor === "todos" || l.gestorId === gestor)
      .map((l) => ({ ...l, nota: notaPonderada(l, pesos) }))
      .sort((a, b) => b.nota - a.nota);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gestor, raw]);

  const alterado = raw.some((v, i) => v !== PADRAO[i]);

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="rwp-display text-2xl">Ranking de lojas</h1>
          <p className="mt-1 text-sm text-[var(--rwp-on-light-muted)]">
            Nota ponderada pelos pesos de cada indicador — ajuste os pesos e o ranking reordena ao vivo
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-[var(--rwp-on-light-muted)]">Gestor</span>
          <select
            value={gestor}
            onChange={(e) => setGestor(e.target.value)}
            className="rwp-tap rounded-lg border border-[var(--rwp-line)] bg-white px-3 text-sm font-medium"
          >
            <option value="todos">Todos os gestores</option>
            {GESTORES.map((g) => (
              <option key={g.id} value={g.id}>
                {g.nome}
              </option>
            ))}
          </select>
        </label>
      </header>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1.8fr] lg:items-start">
        {/* Painel de pesos ajustáveis */}
        <PainelCard
          titulo="Pesos dos indicadores"
          acao={
            alterado ? (
              <button
                type="button"
                onClick={() => setRaw(PADRAO)}
                className="text-xs font-semibold text-[var(--rwp-orange-strong)] underline"
              >
                Restaurar padrão
              </button>
            ) : undefined
          }
        >
          <ul className="space-y-3">
            {RANKING_INDICADORES.map((ind, i) => {
              const pct = Math.round(pesos[i].peso * 100);
              return (
                <li key={ind.chave}>
                  <div className="flex items-center justify-between text-sm">
                    <label htmlFor={`peso-${ind.chave}`} className="font-medium">
                      {ind.nome}
                    </label>
                    <span className="tabular-nums font-semibold">{pct}%</span>
                  </div>
                  <input
                    id={`peso-${ind.chave}`}
                    type="range"
                    min={0}
                    max={50}
                    step={1}
                    value={raw[i]}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setRaw((prev) => prev.map((x, j) => (j === i ? v : x)));
                    }}
                    className="mt-1 w-full accent-[var(--rwp-orange)]"
                    aria-valuetext={`${pct}%`}
                  />
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-xs text-[var(--rwp-on-light-muted)]">
            Os pesos são normalizados para somar 100%. Priorize margem, por exemplo, e veja quais
            lojas sobem ou caem — sem trocar nenhum dado.
          </p>
        </PainelCard>

        <PainelCard titulo={gestor === "todos" ? "Todas as lojas" : `Lojas de ${nomeGestor(gestor)}`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-[var(--rwp-line)] text-left text-xs text-[var(--rwp-on-light-muted)]">
                  <th className="py-2 pr-2 font-semibold">#</th>
                  <th className="py-2 pr-2 font-semibold">Loja</th>
                  <th className="py-2 pr-2 font-semibold">Gestor</th>
                  <th className="py-2 pr-3 font-semibold">Nota</th>
                  {RANKING_INDICADORES.map((ind, i) => (
                    <th key={ind.chave} className="py-2 pr-2 text-right font-semibold">
                      {ind.nome}
                      <span className="block font-normal text-[10px] text-[var(--rwp-on-light-muted)]">
                        {Math.round(pesos[i].peso * 100)}%
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lojas.map((l, i) => (
                  <tr key={l.id} className="border-b border-[var(--rwp-line)] last:border-0">
                    <td className="py-2.5 pr-2 font-bold tabular-nums">{i + 1}º</td>
                    <td className="py-2.5 pr-2 font-medium">{l.nome}</td>
                    <td className="py-2.5 pr-2 text-xs text-[var(--rwp-on-light-muted)]">{nomeGestor(l.gestorId)}</td>
                    <td className="py-2.5 pr-3">
                      <span className="flex items-center gap-2">
                        <StatusPill faixa={faixaDaNota(l.nota)} />
                        <span className="font-bold tabular-nums">{l.nota}</span>
                      </span>
                    </td>
                    {RANKING_INDICADORES.map((ind) => {
                      const v = l.scores[ind.chave];
                      return (
                        <td key={ind.chave} className={`py-2.5 pr-2 text-right tabular-nums font-medium ${COR_FAIXA[faixaDaNota(v)]}`}>
                          {v}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-[var(--rwp-on-light-muted)]">
            Cores por faixa (saudável / atenção / crítico). A coluna “Nota” usa os pesos ao lado.
          </p>
        </PainelCard>
      </div>
    </div>
  );
}
