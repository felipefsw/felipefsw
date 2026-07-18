"use client";

import { useContexto, PERIODOS } from "@/components/site/portal/contexto";
import { Delta, MeterBar, PainelCard, StatusPill } from "@/components/site/portal/ui";
import {
  DIMENSOES_DEMO,
  FONTES_DEMO,
  LOJAS_DEMO,
  faixaDaNota,
  type FonteStatus,
} from "@/lib/site/portal";

const FONTE_FAIXA: Record<FonteStatus["estado"], "saudavel" | "atencao" | "critico"> = {
  ok: "saudavel",
  atrasada: "atencao",
  falha: "critico",
};

export default function TermometroPage() {
  const { ctx, atualizar } = useContexto();
  const loja = LOJAS_DEMO.find((l) => l.id === ctx.lojaId) ?? LOJAS_DEMO[0];
  const periodo = PERIODOS.find((p) => p.valor === ctx.periodo)?.rotulo ?? "7 dias";
  const lojasPorRisco = [...LOJAS_DEMO].sort((a, b) => a.nota - b.nota);

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="rwp-display text-2xl">Termômetro Explicável 2.0</h1>
          <p className="mt-1 text-sm text-[var(--rwp-on-light-muted)]">
            {loja.nome} · {periodo}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-4xl font-bold tabular-nums">{loja.nota}</span>
          <div className="flex flex-col items-start gap-1">
            <StatusPill faixa={faixaDaNota(loja.nota)} />
            <Delta valor={loja.tendencia} sufixo=" pts" />
          </div>
        </div>
      </header>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        {/* Decomposição da nota por dimensão */}
        <PainelCard titulo="Como a nota se decompõe">
          <ul className="space-y-4">
            {DIMENSOES_DEMO.map((d) => (
              <li key={d.chave} className="border-b border-[var(--rwp-line)] pb-4 last:border-0 last:pb-0">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold">{d.nome}</span>
                  <span className="flex items-center gap-3 text-xs text-[var(--rwp-on-light-muted)]">
                    <span>contribui {Math.round(d.peso * 100)}%</span>
                    <Delta valor={d.tendencia} sufixo=" pts" />
                    <span className="tabular-nums font-bold text-[var(--rwp-on-light)]">{d.nota}</span>
                  </span>
                </div>
                <div className="mt-2">
                  <MeterBar nota={d.nota} meta={d.meta} faixa={faixaDaNota(d.nota)} />
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-[var(--rwp-on-light-muted)]">
                  <span>Meta {d.meta}</span>
                  <span>· Fonte: {d.fonte} ({d.atualizado})</span>
                  <span>· Cobertura: {d.cobertura}</span>
                </div>
                <p className="mt-1 text-xs text-[var(--rwp-on-light)]">
                  <span className="font-semibold">Causa principal:</span> {d.causa}
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-[var(--rwp-on-light-muted)]">
            Decomposição ilustrativa — em produção, cada loja tem a sua, com histórico e benchmark.
          </p>
        </PainelCard>

        <div className="grid gap-5">
          {/* Confiança das fontes — resolve a tela "Consultando API... zeros" */}
          <PainelCard titulo="Confiança dos dados">
            <ul className="space-y-3">
              {FONTES_DEMO.map((f) => (
                <li key={f.nome} className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{f.nome}</p>
                    <p className="text-xs text-[var(--rwp-on-light-muted)]">{f.detalhe}</p>
                  </div>
                  <StatusPill faixa={FONTE_FAIXA[f.estado]} />
                </li>
              ))}
            </ul>
            <p className="mt-3 rounded-lg bg-[var(--rwp-surface-2)] p-3 text-xs text-[var(--rwp-on-light-muted)]">
              Enquanto uma fonte reprocessa, mantemos o <strong>último valor válido</strong> — a tela
              nunca zera durante a consulta.
            </p>
          </PainelCard>

          {/* Lojas por risco — clique troca a loja do contexto */}
          <PainelCard titulo="Lojas por risco">
            <ul className="space-y-1">
              {lojasPorRisco.map((l) => {
                const ativo = l.id === loja.id;
                return (
                  <li key={l.id}>
                    <button
                      type="button"
                      onClick={() => atualizar({ lojaId: l.id })}
                      aria-current={ativo ? "true" : undefined}
                      className={`flex w-full items-center justify-between gap-2 rounded-lg px-2 py-2 text-left text-sm ${
                        ativo ? "bg-[var(--rwp-surface-2)] font-semibold" : "hover:bg-[var(--rwp-surface-2)]"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <StatusPill faixa={faixaDaNota(l.nota)} />
                        <span className="truncate">{l.nome}</span>
                      </span>
                      <span className="flex items-center gap-2 tabular-nums">
                        <Delta valor={l.tendencia} sufixo="" />
                        <span className="font-bold">{l.nota}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </PainelCard>
        </div>
      </div>
    </div>
  );
}
