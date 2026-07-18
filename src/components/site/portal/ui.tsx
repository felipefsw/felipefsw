/*
  Componentes da prévia do portal. Interface de trabalho: tipografia neutra,
  superfícies claras, densidade calma. Cores de status SEMPRE com ícone + rótulo
  (nunca cor sozinha) — atende daltonismo e a recomendação da auditoria.
*/
import type { ReactNode } from "react";
import { FAIXA_META, type Faixa } from "@/lib/site/portal";

// Paleta de status (semântica, reservada — não é usada como "série de cor").
const STATUS: Record<Faixa, { texto: string; fundo: string; barra: string }> = {
  saudavel: { texto: "text-[#0f6b31]", fundo: "bg-[#e7f4ec] text-[#0f6b31]", barra: "bg-[#157f3c]" },
  atencao: { texto: "text-[#8a4e06]", fundo: "bg-[#fbf1df] text-[#8a4e06]", barra: "bg-[#b45309]" },
  critico: { texto: "text-[#b21f14]", fundo: "bg-[#fdeceb] text-[#b21f14]", barra: "bg-[#d92d20]" },
};

export function StatusPill({ faixa, className = "" }: { faixa: Faixa; className?: string }) {
  const s = STATUS[faixa];
  const m = FAIXA_META[faixa];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${s.fundo} ${className}`}>
      <span aria-hidden>{m.icone}</span>
      {m.rotulo}
    </span>
  );
}

// Variação (tendência): seta + sinal + cor. Nunca cor sozinha.
export function Delta({ valor, sufixo = "", inverter = false }: { valor: number; sufixo?: string; inverter?: boolean }) {
  if (valor === 0) {
    return <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--rwp-on-light-muted)]">→ 0{sufixo}</span>;
  }
  const positivo = valor > 0;
  // "bom" pode ser subir (vendas) ou descer (tempo). inverter=true trata queda como boa.
  const bom = inverter ? !positivo : positivo;
  const cor = bom ? "text-[#0f6b31]" : "text-[#b21f14]";
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${cor}`}>
      <span aria-hidden>{positivo ? "↑" : "↓"}</span>
      {positivo ? "+" : ""}
      {valor}
      {sufixo}
    </span>
  );
}

export function StatTile({
  rotulo,
  valor,
  meta,
  contexto,
  tendencia,
  inverterTendencia = false,
}: {
  rotulo: string;
  valor: string;
  meta?: string;
  contexto?: string;
  tendencia?: number;
  inverterTendencia?: boolean;
}) {
  return (
    <div className="rounded-xl border border-[var(--rwp-line)] bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-[var(--rwp-on-light-muted)]">{rotulo}</p>
        {typeof tendencia === "number" && <Delta valor={tendencia} sufixo="%" inverter={inverterTendencia} />}
      </div>
      <p className="mt-1 text-2xl font-bold tabular-nums">{valor}</p>
      <p className="mt-0.5 text-xs text-[var(--rwp-on-light-muted)]">
        {meta && <span className="tabular-nums">Meta {meta}</span>}
        {meta && contexto && " · "}
        {contexto}
      </p>
    </div>
  );
}

// Medidor 0–100 com faixa por cor + rótulo textual da nota e marca da meta.
export function MeterBar({ nota, meta, faixa }: { nota: number; meta: number; faixa: Faixa }) {
  const s = STATUS[faixa];
  return (
    <div>
      <div
        className="relative h-2.5 w-full overflow-hidden rounded-full bg-[var(--rwp-surface-2)]"
        role="img"
        aria-label={`Nota ${nota} de 100, meta ${meta}, faixa ${FAIXA_META[faixa].rotulo}`}
      >
        <div className={`h-full rounded-full ${s.barra}`} style={{ width: `${nota}%` }} />
        {/* marca da meta */}
        <div className="absolute top-0 h-full w-0.5 bg-[var(--rwp-on-light)]/50" style={{ left: `${meta}%` }} title={`Meta ${meta}`} />
      </div>
    </div>
  );
}

// Sparkbars de série única (hue único → sem questão de daltonismo).
export function Sparkbars({ valores, ariaLabel }: { valores: number[]; ariaLabel: string }) {
  const max = Math.max(...valores);
  return (
    <div className="flex h-14 items-end gap-1" role="img" aria-label={ariaLabel}>
      {valores.map((v, i) => (
        <div
          key={i}
          title={`Dia ${i + 1}: R$ ${v.toFixed(1)} mil`}
          className="flex-1 rounded-t bg-[var(--rwp-orange)]/85 transition-[height]"
          style={{ height: `${Math.max(8, (v / max) * 100)}%` }}
        />
      ))}
    </div>
  );
}

export function PainelCard({
  titulo,
  acao,
  children,
  className = "",
}: {
  titulo: string;
  acao?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-2xl border border-[var(--rwp-line)] bg-white p-5 ${className}`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--rwp-on-light-muted)]">{titulo}</h2>
        {acao}
      </div>
      {children}
    </section>
  );
}
