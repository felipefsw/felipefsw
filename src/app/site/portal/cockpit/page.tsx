"use client";

import { useContexto, PERIODOS } from "@/components/site/portal/contexto";
import { Delta, PainelCard, Sparkbars, StatTile, StatusPill } from "@/components/site/portal/ui";
import {
  EQUIPE_DEMO,
  KPIS_HOJE_DEMO,
  LOJAS_DEMO,
  PENDENCIAS_DEMO,
  RUPTURA_DEMO,
  VENDAS_14D_DEMO,
  faixaDaNota,
} from "@/lib/site/portal";

export default function CockpitPage() {
  const { ctx } = useContexto();
  const loja = LOJAS_DEMO.find((l) => l.id === ctx.lojaId) ?? LOJAS_DEMO[0];
  const periodo = PERIODOS.find((p) => p.valor === ctx.periodo)?.rotulo ?? "7 dias";

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="rwp-display text-2xl">Cockpit Diário</h1>
          <p className="mt-1 text-sm text-[var(--rwp-on-light-muted)]">
            {loja.nome} · {periodo} · atualizado há 8 min
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-[var(--rwp-on-light-muted)]">Saúde da loja</span>
          <StatusPill faixa={faixaDaNota(loja.nota)} />
          <span className="font-bold tabular-nums">{loja.nota}</span>
        </div>
      </header>

      {/* KPIs do dia */}
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {KPIS_HOJE_DEMO.map((k) => (
          <StatTile
            key={k.chave}
            rotulo={k.rotulo}
            valor={k.valor}
            meta={k.meta}
            contexto={k.contexto}
            tendencia={k.tendencia}
            inverterTendencia={k.chave === "producao"}
          />
        ))}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        {/* Ações prioritárias */}
        <PainelCard
          titulo="Ações prioritárias hoje"
          acao={<span className="text-xs text-[var(--rwp-on-light-muted)]">{PENDENCIAS_DEMO.length} pendências</span>}
        >
          <ul className="divide-y divide-[var(--rwp-line)]">
            {PENDENCIAS_DEMO.map((p, i) => (
              <li key={i} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-3 first:pt-0 last:pb-0">
                <StatusPill faixa={p.severidade} />
                <span className="flex-1 text-sm font-medium">{p.titulo}</span>
                <span className="text-xs text-[var(--rwp-on-light-muted)]">
                  {p.dono} · prazo {p.prazo}
                </span>
                <span className="w-full pl-1 text-xs text-[var(--rwp-on-light-muted)]">↳ {p.origem}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-[var(--rwp-on-light-muted)]">
            Cada item abre a causa e vira um plano com dono, prazo e evidência (Planos e CAPA).
          </p>
        </PainelCard>

        <div className="grid gap-5">
          <PainelCard titulo="Vendas — últimos 14 dias" acao={<Delta valor={8} sufixo="%" />}>
            <Sparkbars valores={VENDAS_14D_DEMO} ariaLabel="Vendas dos últimos 14 dias, em milhares de reais" />
            <p className="mt-2 text-xs text-[var(--rwp-on-light-muted)]">Fonte: Saipos · em R$ mil por dia</p>
          </PainelCard>

          <PainelCard titulo="Equipe de hoje">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-2xl font-bold tabular-nums">
                  {EQUIPE_DEMO.presentes}/{EQUIPE_DEMO.escalados}
                </p>
                <p className="text-xs text-[var(--rwp-on-light-muted)]">presentes / escalados</p>
              </div>
              {EQUIPE_DEMO.faltas > 0 && (
                <div className="flex items-center gap-2">
                  <StatusPill faixa="atencao" />
                  <span className="text-sm">{EQUIPE_DEMO.faltas} falta — repor pelo pool de diaristas</span>
                </div>
              )}
            </div>
          </PainelCard>

          <PainelCard titulo="Risco de ruptura">
            <ul className="space-y-2">
              {RUPTURA_DEMO.map((r) => (
                <li key={r.item} className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium">{r.item}</span>
                  <span className="flex items-center gap-2">
                    <span className="tabular-nums text-[var(--rwp-on-light-muted)]">{r.diasEstoque} dia(s)</span>
                    <StatusPill faixa={r.faixa} />
                  </span>
                </li>
              ))}
            </ul>
          </PainelCard>
        </div>
      </div>
    </div>
  );
}
