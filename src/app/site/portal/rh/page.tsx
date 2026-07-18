"use client";

import { useState } from "react";
import { useContexto } from "@/components/site/portal/contexto";
import { PainelCard, StatusPill } from "@/components/site/portal/ui";
import { LOJAS_DEMO } from "@/lib/site/portal";
import {
  RH_CARGOS,
  RH_FARDAMENTO,
  RH_FERIAS,
  RH_FUNCIONARIOS,
  RH_PROCESSOS,
  RH_VAGAS,
} from "@/lib/site/rh";

const ABAS = ["Funcionários", "Férias", "Processos seletivos", "Vagas", "Fardamento", "Cargos e salários"] as const;
type Aba = (typeof ABAS)[number];

const STATUS_FUNC: Record<string, "saudavel" | "atencao" | "critico"> = {
  Ativo: "saudavel",
  Experiência: "atencao",
  Férias: "atencao",
  Afastado: "critico",
};

export default function RhPage() {
  const { ctx } = useContexto();
  const loja = LOJAS_DEMO.find((l) => l.id === ctx.lojaId) ?? LOJAS_DEMO[0];
  const [aba, setAba] = useState<Aba>("Funcionários");

  return (
    <div>
      <header>
        <h1 className="rwp-display text-2xl">RH e DP</h1>
        <p className="mt-1 text-sm text-[var(--rwp-on-light-muted)]">{loja.nome}</p>
      </header>

      <div className="mt-5 flex flex-wrap gap-1 border-b border-[var(--rwp-line)]">
        {ABAS.map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => setAba(a)}
            aria-current={aba === a ? "page" : undefined}
            className={`rwp-tap -mb-px rounded-t-lg border-b-2 px-3 text-sm font-semibold ${
              aba === a
                ? "border-[var(--rwp-orange)] text-[var(--rwp-on-light)]"
                : "border-transparent text-[var(--rwp-on-light-muted)] hover:text-[var(--rwp-on-light)]"
            }`}
          >
            {a}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {aba === "Funcionários" && (
          <PainelCard titulo="Funcionários">
            <ul className="divide-y divide-[var(--rwp-line)]">
              {RH_FUNCIONARIOS.map((f) => (
                <li key={f.nome} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-3 first:pt-0 last:pb-0">
                  <span className="w-40 text-sm font-semibold">{f.nome}</span>
                  <span className="w-24 text-xs text-[var(--rwp-on-light-muted)]">{f.cargo}</span>
                  <span className="w-28 text-xs text-[var(--rwp-on-light-muted)]">admissão {f.admissao}</span>
                  <StatusPill faixa={STATUS_FUNC[f.status]} />
                  <span className="text-sm">{f.status}</span>
                  {f.docPendente && <span className="flex-1 text-right text-xs text-[#8a4e06]">⚠ {f.docPendente}</span>}
                </li>
              ))}
            </ul>
          </PainelCard>
        )}

        {aba === "Férias" && (
          <PainelCard titulo="Férias">
            <ul className="divide-y divide-[var(--rwp-line)]">
              {RH_FERIAS.map((f) => (
                <li key={f.nome} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0 text-sm">
                  <span className="font-semibold">{f.nome}</span>
                  <span className="text-[var(--rwp-on-light-muted)]">{f.periodo}</span>
                  <StatusPill faixa={f.situacao === "Vencendo" ? "critico" : f.situacao === "Em férias" ? "atencao" : "saudavel"} />
                  <span>{f.situacao}</span>
                </li>
              ))}
            </ul>
          </PainelCard>
        )}

        {aba === "Processos seletivos" && (
          <PainelCard titulo="Processos seletivos">
            <ul className="divide-y divide-[var(--rwp-line)]">
              {RH_PROCESSOS.map((p) => (
                <li key={p.vaga} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-3 first:pt-0 last:pb-0 text-sm">
                  <span className="w-48 font-semibold">{p.vaga}</span>
                  <span className="rounded-full bg-[var(--rwp-surface-2)] px-2 py-0.5 text-xs font-medium">{p.etapa}</span>
                  <span className="flex-1 text-xs text-[var(--rwp-on-light-muted)]">{p.candidatos} candidatos</span>
                  <span className="text-xs text-[var(--rwp-on-light-muted)]">aberta há {p.abertaDias} dias</span>
                </li>
              ))}
            </ul>
          </PainelCard>
        )}

        {aba === "Vagas" && (
          <PainelCard titulo="Vagas publicadas">
            <ul className="divide-y divide-[var(--rwp-line)]">
              {RH_VAGAS.map((v) => (
                <li key={v.titulo + v.loja} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-3 first:pt-0 last:pb-0 text-sm">
                  <span className="w-44 font-semibold">{v.titulo}</span>
                  <span className="flex-1 text-xs text-[var(--rwp-on-light-muted)]">{v.loja}</span>
                  <span className="text-xs text-[var(--rwp-on-light-muted)]">{v.publicada}</span>
                  <span className="font-semibold tabular-nums">{v.candidaturas} candidaturas</span>
                </li>
              ))}
            </ul>
          </PainelCard>
        )}

        {aba === "Fardamento" && (
          <PainelCard titulo="Protocolo de fardamento">
            <ul className="divide-y divide-[var(--rwp-line)]">
              {RH_FARDAMENTO.map((f) => (
                <li key={f.colaborador + f.item} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-3 first:pt-0 last:pb-0 text-sm">
                  <span className="w-36 font-semibold">{f.colaborador}</span>
                  <span className="flex-1">{f.item}</span>
                  <StatusPill faixa={f.situacao} />
                  <span className="text-xs text-[var(--rwp-on-light-muted)]">{f.texto}</span>
                </li>
              ))}
            </ul>
          </PainelCard>
        )}

        {aba === "Cargos e salários" && (
          <PainelCard titulo="Cargos e salários">
            <ul className="divide-y divide-[var(--rwp-line)]">
              {RH_CARGOS.map((c) => (
                <li key={c.cargo} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-3 first:pt-0 last:pb-0 text-sm">
                  <span className="w-36 font-semibold">{c.cargo}</span>
                  <span className="flex-1 text-xs text-[var(--rwp-on-light-muted)]">{c.nivel}</span>
                  <span className="font-semibold tabular-nums">{c.faixa}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-[var(--rwp-on-light-muted)]">Faixas ilustrativas — parametrizáveis por marca e região.</p>
          </PainelCard>
        )}
      </div>
    </div>
  );
}
