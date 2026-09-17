// Peças de tela do Painel do Gestor.
// Padrão da seção 7: primeiro card com o número principal, semáforo por régua,
// estado vazio dizendo o que enviar.

import Link from "next/link";
import type { Semaforo } from "@/lib/painel/parametros";

export const superficie = "rounded-xl border border-[var(--painel-borda)] bg-[var(--painel-superficie)]";

export const inputPainel =
  "w-full rounded-lg border border-[var(--painel-borda)] bg-[var(--painel-fundo)] px-3 py-2 text-[var(--painel-texto)] outline-none focus:border-[var(--painel-laranja)]";

export const labelPainel = "mb-1 block text-sm font-medium text-[var(--painel-texto-fraco)]";

export const botaoPrimario =
  "inline-flex items-center justify-center gap-1 rounded-lg bg-[var(--painel-laranja)] px-4 py-2 font-semibold text-white hover:opacity-90 disabled:opacity-50";

export const botaoSecundario =
  "inline-flex items-center justify-center gap-1 rounded-lg border border-[var(--painel-borda)] px-4 py-2 font-medium text-[var(--painel-texto)] hover:bg-white/5";

export function CardPainel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`${superficie} p-4 ${className}`}>{children}</div>;
}

/** Cabeçalho de tela: título, período e uma ação. */
export function CabecalhoPainel({
  titulo,
  subtitulo,
  acao,
}: {
  titulo: string;
  subtitulo?: string;
  acao?: { href: string; label: string };
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="truncate text-2xl font-bold">{titulo}</h1>
        {subtitulo ? (
          <p className="text-sm text-[var(--painel-texto-fraco)]">{subtitulo}</p>
        ) : null}
      </div>
      {acao ? (
        <Link href={acao.href} className={botaoPrimario}>
          {acao.label}
        </Link>
      ) : null}
    </div>
  );
}

const COR_DO_SEMAFORO: Record<Semaforo, string> = {
  verde: "var(--painel-verde)",
  amarelo: "var(--painel-amarelo)",
  vermelho: "var(--painel-vermelho)",
};

/**
 * O card do número principal: número grande em cima, explicação embaixo
 * (princípio da seção 1 do book).
 */
export function NumeroPrincipal({
  valor,
  rotulo,
  detalhe,
  semaforo,
}: {
  valor: string;
  rotulo: string;
  detalhe?: string;
  semaforo?: Semaforo;
}) {
  return (
    <div className={`${superficie} p-5`}>
      <div className="flex items-center gap-2">
        {semaforo ? (
          <span
            aria-label={`situação: ${semaforo}`}
            className="h-3 w-3 shrink-0 rounded-full"
            style={{ background: COR_DO_SEMAFORO[semaforo] }}
          />
        ) : null}
        <span className="text-sm uppercase tracking-wide text-[var(--painel-texto-fraco)]">
          {rotulo}
        </span>
      </div>
      <p className="painel-numero mt-1 text-4xl font-bold leading-none">{valor}</p>
      {detalhe ? (
        <p className="mt-2 text-sm text-[var(--painel-texto-fraco)]">{detalhe}</p>
      ) : null}
    </div>
  );
}

/** Estado vazio: sempre diz o que a pessoa precisa enviar (seção 7). */
export function NadaAindaPainel({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--painel-borda)] p-8 text-center text-[var(--painel-texto-fraco)]">
      {children}
    </div>
  );
}

/** Aviso de pendência: campo que falta, nunca valor estimado (seção 1). */
export function Pendencia({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-[var(--painel-dourado)]/40 bg-[var(--painel-dourado)]/10 px-3 py-2 text-sm text-[var(--painel-dourado)]">
      {children}
    </div>
  );
}

export function ErroPainel({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-[var(--painel-vermelho)]/40 bg-[var(--painel-vermelho)]/10 px-3 py-2 text-sm text-[var(--painel-vermelho)]">
      {children}
    </div>
  );
}
