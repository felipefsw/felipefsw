"use client";

import { useContexto } from "@/components/site/portal/contexto";
import { MeterBar, PainelCard, StatTile, StatusPill } from "@/components/site/portal/ui";
import { LOJAS_DEMO } from "@/lib/site/portal";
import {
  QUALIDADE_INDICADORES,
  QUALIDADE_KPIS,
  QUALIDADE_NCS,
  QUALIDADE_PLANOS,
} from "@/lib/site/qualidade";

export default function QualidadePage() {
  const { ctx } = useContexto();
  const loja = LOJAS_DEMO.find((l) => l.id === ctx.lojaId) ?? LOJAS_DEMO[0];
  const k = QUALIDADE_KPIS;

  return (
    <div>
      <header>
        <h1 className="rwp-display text-2xl">Dashboard de Qualidade</h1>
        <p className="mt-1 text-sm text-[var(--rwp-on-light-muted)]">{loja.nome} · mês atual</p>
      </header>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile rotulo="Faturamento (mês)" valor={k.faturamentoMes} tendencia={k.faturamentoTend} contexto="todos os canais" />
        <StatTile rotulo="Vendas no PDV" valor={k.vendasPdv} tendencia={k.vendasPdvTend} contexto="salão + balcão" />
        <StatTile rotulo="Ticket médio" valor={k.ticketMedio} tendencia={k.ticketTend} contexto="meta R$ 52,00" />
        <StatTile rotulo="Nota iFood" valor={k.notaIfood} tendencia={k.notaIfoodTend} contexto="218 avaliações" />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        <PainelCard titulo="Indicadores de qualidade">
          <ul className="space-y-4">
            {QUALIDADE_INDICADORES.map((ind) => (
              <li key={ind.nome} className="border-b border-[var(--rwp-line)] pb-4 last:border-0 last:pb-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold">{ind.nome}</span>
                  <span className="flex items-center gap-2">
                    <StatusPill faixa={ind.faixa} />
                    <span className="font-bold tabular-nums">{ind.nota}</span>
                  </span>
                </div>
                <div className="mt-2">
                  <MeterBar nota={ind.nota} meta={ind.meta} faixa={ind.faixa} />
                </div>
                <p className="mt-1.5 text-xs text-[var(--rwp-on-light-muted)]">Meta {ind.meta} · {ind.detalhe}</p>
              </li>
            ))}
          </ul>
        </PainelCard>

        <div className="grid gap-5">
          <PainelCard titulo="Segurança alimentar — não conformidades">
            <ul className="space-y-2">
              {QUALIDADE_NCS.map((nc) => (
                <li key={nc.item} className="flex items-center justify-between gap-2 text-sm">
                  <span className="flex items-center gap-2">
                    <StatusPill faixa={nc.severidade} />
                    <span className="font-medium">{nc.item}</span>
                  </span>
                  <span className="text-xs text-[var(--rwp-on-light-muted)]">prazo {nc.prazo}</span>
                </li>
              ))}
            </ul>
          </PainelCard>

          <PainelCard titulo="Planos de ação">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-[#fdeceb] p-3">
                <p className="text-2xl font-bold text-[#b21f14] tabular-nums">{QUALIDADE_PLANOS.vencidos}</p>
                <p className="text-xs text-[#b21f14]">vencidos</p>
              </div>
              <div className="rounded-lg bg-[#fbf1df] p-3">
                <p className="text-2xl font-bold text-[#8a4e06] tabular-nums">{QUALIDADE_PLANOS.criticos + QUALIDADE_PLANOS.atencao}</p>
                <p className="text-xs text-[#8a4e06]">abertos</p>
              </div>
              <div className="rounded-lg bg-[#e7f4ec] p-3">
                <p className="text-2xl font-bold text-[#0f6b31] tabular-nums">{QUALIDADE_PLANOS.noPrazo}</p>
                <p className="text-xs text-[#0f6b31]">no prazo</p>
              </div>
              <div className="rounded-lg bg-[var(--rwp-surface-2)] p-3">
                <p className="text-2xl font-bold tabular-nums">
                  {QUALIDADE_PLANOS.criticos + QUALIDADE_PLANOS.atencao + QUALIDADE_PLANOS.noPrazo}
                </p>
                <p className="text-xs text-[var(--rwp-on-light-muted)]">total</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-[var(--rwp-on-light-muted)]">
              Cada não conformidade abre um plano com dono, prazo e evidência (Planos e CAPA).
            </p>
          </PainelCard>
        </div>
      </div>
    </div>
  );
}
