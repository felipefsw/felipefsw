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

export default function RankingPage() {
  const [gestor, setGestor] = useState<string>("todos");

  const lojas = useMemo(() => {
    const filtradas = LOJAS_RANKING.filter((l) => gestor === "todos" || l.gestorId === gestor);
    return filtradas
      .map((l) => ({ ...l, nota: notaPonderada(l) }))
      .sort((a, b) => b.nota - a.nota);
  }, [gestor]);

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="rwp-display text-2xl">Ranking de lojas</h1>
          <p className="mt-1 text-sm text-[var(--rwp-on-light-muted)]">
            Nota ponderada pelos pesos de cada indicador
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

      {/* Pesos visíveis — a nota é explicável */}
      <div className="mt-4 flex flex-wrap gap-2">
        {RANKING_INDICADORES.map((ind) => (
          <span key={ind.chave} className="rounded-full bg-[var(--rwp-surface-2)] px-3 py-1 text-xs">
            <span className="font-semibold">{ind.nome}</span>{" "}
            <span className="text-[var(--rwp-on-light-muted)]">{Math.round(ind.peso * 100)}%</span>
          </span>
        ))}
      </div>

      <PainelCard titulo={gestor === "todos" ? "Todas as lojas" : `Lojas de ${nomeGestor(gestor)}`} className="mt-5">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--rwp-line)] text-left text-xs text-[var(--rwp-on-light-muted)]">
                <th className="py-2 pr-2 font-semibold">#</th>
                <th className="py-2 pr-2 font-semibold">Loja</th>
                <th className="py-2 pr-2 font-semibold">Gestor</th>
                <th className="py-2 pr-3 font-semibold">Nota</th>
                {RANKING_INDICADORES.map((ind) => (
                  <th key={ind.chave} className="py-2 pr-2 text-right font-semibold">
                    {ind.nome}
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
          Os pesos são configuráveis: mudar a estratégia (ex.: priorizar margem) reordena o ranking
          sem trocar os dados. Cores por faixa (saudável / atenção / crítico).
        </p>
      </PainelCard>
    </div>
  );
}
