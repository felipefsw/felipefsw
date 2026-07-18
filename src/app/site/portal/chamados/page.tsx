"use client";

import { useContexto } from "@/components/site/portal/contexto";
import ChamadoAssistente from "@/components/site/portal/ChamadoAssistente";
import { PainelCard, StatTile, StatusPill } from "@/components/site/portal/ui";
import { LOJAS_DEMO } from "@/lib/site/portal";
import { CHAMADOS_KPIS, CHAMADOS_RECENTES } from "@/lib/site/chamados";

export default function ChamadosPage() {
  const { ctx } = useContexto();
  const loja = LOJAS_DEMO.find((l) => l.id === ctx.lojaId) ?? LOJAS_DEMO[0];

  return (
    <div>
      <header>
        <h1 className="rwp-display text-2xl">TI — Chamados</h1>
        <p className="mt-1 text-sm text-[var(--rwp-on-light-muted)]">
          {loja.nome} · o assistente resolve o que dá; o técnico entra só no que precisa
        </p>
      </header>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile rotulo="Resolvidos pelo assistente" valor={String(CHAMADOS_KPIS.resolvidosAssistente)} contexto={`deflection ${CHAMADOS_KPIS.deflection}`} />
        <StatTile rotulo="Escalados à TI" valor={String(CHAMADOS_KPIS.escalados)} contexto="hoje" />
        <StatTile rotulo="Tempo médio (escalado)" valor={CHAMADOS_KPIS.tmr} contexto="da abertura à solução" />
        <StatTile rotulo="SLA em dia" valor={CHAMADOS_KPIS.slaEmDia} contexto="dentro do prazo" />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.1fr_1fr]">
        <PainelCard titulo="Abrir chamado — fale com o assistente">
          <ChamadoAssistente />
        </PainelCard>

        <PainelCard titulo="Chamados recentes">
          <ul className="divide-y divide-[var(--rwp-line)]">
            {CHAMADOS_RECENTES.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-3 first:pt-0 last:pb-0">
                <span className="w-16 font-bold tabular-nums">{c.id}</span>
                <span className="flex-1 text-sm font-medium">{c.assunto}</span>
                <StatusPill faixa={c.faixa} />
                <span className="w-full pl-16 text-xs text-[var(--rwp-on-light-muted)]">
                  {c.loja} · {c.status} · {c.quando}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-[var(--rwp-on-light-muted)]">
            O que o assistente resolve não vira fila para a TI — o técnico foca no que é técnico mesmo.
          </p>
        </PainelCard>
      </div>
    </div>
  );
}
