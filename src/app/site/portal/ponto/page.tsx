"use client";

import { useContexto } from "@/components/site/portal/contexto";
import { PainelCard, StatTile, StatusPill } from "@/components/site/portal/ui";
import { LOJAS_DEMO } from "@/lib/site/portal";
import { PONTO_HOJE, PONTO_RESUMO } from "@/lib/site/ponto";

export default function PontoPage() {
  const { ctx } = useContexto();
  const loja = LOJAS_DEMO.find((l) => l.id === ctx.lojaId) ?? LOJAS_DEMO[0];

  return (
    <div>
      <header>
        <h1 className="rwp-display text-2xl">Ponto Eletrônico — Hoje</h1>
        <p className="mt-1 text-sm text-[var(--rwp-on-light-muted)]">{loja.nome} · atualizado agora</p>
      </header>

      <div className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatTile rotulo="Trabalhando agora" valor={String(PONTO_RESUMO.trabalhando)} contexto="+ 1 no almoço" />
        <StatTile rotulo="Ainda vão entrar" valor={String(PONTO_RESUMO.aEntrar)} contexto="no turno da noite" />
        <StatTile rotulo="Atrasos" valor={String(PONTO_RESUMO.atrasos)} contexto="acima de 15 min" />
        <StatTile rotulo="Faltas" valor={String(PONTO_RESUMO.faltas)} contexto="sem justificativa" />
        <StatTile rotulo="Banco de horas" valor={PONTO_RESUMO.bancoHorasSaldo} contexto="saldo da loja" />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <PainelCard titulo="Quadro de hoje">
          <ul className="divide-y divide-[var(--rwp-line)]">
            {PONTO_HOJE.map((c) => (
              <li key={c.nome} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-3 first:pt-0 last:pb-0">
                <span className="w-40 text-sm font-semibold">{c.nome}</span>
                <span className="w-24 text-xs text-[var(--rwp-on-light-muted)]">{c.cargo}</span>
                <StatusPill faixa={c.faixa} />
                <span className="w-24 text-sm font-medium">{c.status}</span>
                <span className="flex-1 text-xs text-[var(--rwp-on-light-muted)]">previsto {c.previsto}</span>
                <span className="text-sm tabular-nums">
                  {c.entrada === "—" ? <span className="text-[var(--rwp-on-light-muted)]">sem marcação</span> : `entrou ${c.entrada}`}
                </span>
              </li>
            ))}
          </ul>
        </PainelCard>

        <div className="grid gap-5">
          <PainelCard titulo="Pendências de ponto">
            <div className="flex items-center justify-between">
              <span className="text-sm">Justificativas a aprovar</span>
              <span className="flex items-center gap-2">
                <StatusPill faixa="atencao" />
                <span className="font-bold tabular-nums">{PONTO_RESUMO.justificativasPendentes}</span>
              </span>
            </div>
            <p className="mt-3 text-xs text-[var(--rwp-on-light-muted)]">
              Falta sem justificativa vira ação: repor pelo pool de diaristas ou remanejar a escala.
            </p>
          </PainelCard>

          <PainelCard titulo="Cobertura do turno da noite">
            <p className="text-sm text-[var(--rwp-on-light-muted)]">
              2 colaboradores a entrar às 17:00 e 18:00. Sem faltas previstas — cobertura completa.
            </p>
          </PainelCard>
        </div>
      </div>
    </div>
  );
}
