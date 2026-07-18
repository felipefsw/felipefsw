"use client";

import { useContexto } from "@/components/site/portal/contexto";
import { PainelCard, StatTile, StatusPill } from "@/components/site/portal/ui";
import { LOJAS_DEMO } from "@/lib/site/portal";
import { DIARISTAS_ESCALA_HOJE, DIARISTAS_POOL, DIARISTAS_RESUMO } from "@/lib/site/diaristas";

function Estrelas({ nota }: { nota: number }) {
  return (
    <span className="tabular-nums" aria-label={`Avaliação ${nota.toFixed(1)} de 5`}>
      <span aria-hidden className="text-[var(--rwp-orange)]">★</span> {nota.toFixed(1)}
    </span>
  );
}

export default function DiaristasPage() {
  const { ctx } = useContexto();
  const loja = LOJAS_DEMO.find((l) => l.id === ctx.lojaId) ?? LOJAS_DEMO[0];

  return (
    <div>
      <header>
        <h1 className="rwp-display text-2xl">Diaristas</h1>
        <p className="mt-1 text-sm text-[var(--rwp-on-light-muted)]">{loja.nome} · pool e escala do dia</p>
      </header>

      <div className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatTile rotulo="No pool (ativos)" valor={String(DIARISTAS_RESUMO.ativos)} contexto="cadastrados e aptos" />
        <StatTile rotulo="Escalados hoje" valor={String(DIARISTAS_RESUMO.escaladosHoje)} contexto="turno da noite" />
        <StatTile rotulo="Taxa de preenchimento" valor={DIARISTAS_RESUMO.taxaPreenchimento} contexto="últimos 30 dias" />
        <StatTile rotulo="No-show (30d)" valor={DIARISTAS_RESUMO.noShow30d} contexto="meta abaixo de 5%" />
        <StatTile rotulo="Na blocklist" valor={String(DIARISTAS_RESUMO.blocklist)} contexto="bloqueados" />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <PainelCard titulo="Escala de hoje">
          <ul className="divide-y divide-[var(--rwp-line)]">
            {DIARISTAS_ESCALA_HOJE.map((d) => (
              <li key={d.nome} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-3 first:pt-0 last:pb-0 text-sm">
                <span className="w-36 font-semibold">{d.nome}</span>
                <span className="w-32 text-xs text-[var(--rwp-on-light-muted)]">{d.funcao}</span>
                <StatusPill faixa={d.faixa} />
                <span className="flex-1">{d.status}</span>
                <span className="text-xs text-[var(--rwp-on-light-muted)] tabular-nums">{d.horario}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-[var(--rwp-on-light-muted)]">
            No-show dispara reposição automática pelo pool, priorizando avaliação e proximidade.
          </p>
        </PainelCard>

        <PainelCard titulo="Pool disponível">
          <ul className="divide-y divide-[var(--rwp-line)]">
            {DIARISTAS_POOL.map((d) => (
              <li key={d.nome} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-3 first:pt-0 last:pb-0 text-sm">
                <span className="w-36 font-semibold">{d.nome}</span>
                <span className="w-32 text-xs text-[var(--rwp-on-light-muted)]">{d.funcao}</span>
                <Estrelas nota={d.avaliacao} />
                <span className="flex-1" />
                <StatusPill faixa={d.disponivel ? "saudavel" : "atencao"} />
                <span className="text-xs">{d.disponivel ? "Disponível" : "Indisponível"}</span>
                {!d.docsOk && <span className="w-full text-right text-xs text-[#8a4e06]">⚠ documentação pendente</span>}
              </li>
            ))}
          </ul>
        </PainelCard>
      </div>
    </div>
  );
}
