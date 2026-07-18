"use client";

/*
  Barra de contexto global: marca/loja/período que valem para TODAS as telas do
  portal e seguem entre elas. Fica fixa abaixo do cabeçalho.
*/
import { LOJAS_DEMO } from "@/lib/site/portal";
import { PERIODOS, useContexto } from "./contexto";

export default function ContextoBar() {
  const { ctx, atualizar } = useContexto();
  const loja = LOJAS_DEMO.find((l) => l.id === ctx.lojaId) ?? LOJAS_DEMO[0];

  return (
    <div className="sticky top-0 z-20 border-b border-[var(--rwp-line)] bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-3 px-5 py-2.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--rwp-on-light-muted)]">
          Contexto
        </span>

        <label className="flex items-center gap-2 text-sm">
          <span className="sr-only">Loja</span>
          <select
            aria-label="Loja"
            value={ctx.lojaId}
            onChange={(e) => atualizar({ lojaId: e.target.value })}
            className="rwp-tap rounded-lg border border-[var(--rwp-line)] bg-white px-3 text-sm font-medium"
          >
            {LOJAS_DEMO.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nome}
              </option>
            ))}
          </select>
        </label>

        <div className="inline-flex overflow-hidden rounded-lg border border-[var(--rwp-line)]" role="group" aria-label="Período">
          {PERIODOS.map((p) => {
            const ativo = ctx.periodo === p.valor;
            return (
              <button
                key={p.valor}
                type="button"
                aria-pressed={ativo}
                onClick={() => atualizar({ periodo: p.valor })}
                className={`px-3 py-1.5 text-sm font-medium ${
                  ativo ? "bg-[var(--rwp-ink)] text-white" : "bg-white text-[var(--rwp-on-light-muted)] hover:bg-[var(--rwp-surface-2)]"
                }`}
              >
                {p.rotulo}
              </button>
            );
          })}
        </div>

        <span className="ml-auto text-xs text-[var(--rwp-on-light-muted)]">
          {loja.marca} · {loja.cidade}
        </span>
      </div>
    </div>
  );
}
