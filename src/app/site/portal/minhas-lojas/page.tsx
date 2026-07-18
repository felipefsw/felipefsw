"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useContexto } from "@/components/site/portal/contexto";
import { Delta, PainelCard, StatusPill } from "@/components/site/portal/ui";
import { faixaDaNota } from "@/lib/site/portal";
import { GESTORES, nomeGestor } from "@/lib/site/ranking";
import { MINHAS_LOJAS } from "@/lib/site/minhas-lojas";

export default function MinhasLojasPage() {
  const router = useRouter();
  const { atualizar } = useContexto();
  const [gestor, setGestor] = useState<string>("todos");

  const lojas = useMemo(
    () => MINHAS_LOJAS.filter((l) => gestor === "todos" || l.gestorId === gestor).sort((a, b) => a.nota - b.nota),
    [gestor],
  );

  const totalVagas = lojas.reduce((a, l) => a + l.vagas, 0);
  const totalPend = lojas.reduce((a, l) => a + l.pendenciasCriticas, 0);

  function abrirCockpit(id: string) {
    atualizar({ lojaId: id });
    router.push("/site/portal/cockpit");
  }

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="rwp-display text-2xl">Minhas Lojas</h1>
          <p className="mt-1 text-sm text-[var(--rwp-on-light-muted)]">
            {lojas.length} lojas · {totalVagas} vagas em andamento · {totalPend} pendências críticas
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-[var(--rwp-on-light-muted)]">Gestor</span>
          <select
            value={gestor}
            onChange={(e) => setGestor(e.target.value)}
            className="rwp-tap rounded-lg border border-[var(--rwp-line)] bg-white px-3 text-sm font-medium"
          >
            <option value="todos">Todos os gestores</option>
            {GESTORES.map((g) => (
              <option key={g.id} value={g.id}>
                {g.nome}
              </option>
            ))}
          </select>
        </label>
      </header>

      <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {lojas.map((l) => (
          <PainelCard key={l.id} titulo={l.nome}>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <StatusPill faixa={faixaDaNota(l.nota)} />
                <span className="text-2xl font-bold tabular-nums">{l.nota}</span>
              </span>
              <Delta valor={l.tendencia} sufixo=" pts" />
            </div>
            <dl className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
              <div>
                <dt className="text-xs text-[var(--rwp-on-light-muted)]">Equipe</dt>
                <dd className="font-bold tabular-nums">{l.equipe}</dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--rwp-on-light-muted)]">Vagas</dt>
                <dd className="font-bold tabular-nums">{l.vagas}</dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--rwp-on-light-muted)]">Críticas</dt>
                <dd className={`font-bold tabular-nums ${l.pendenciasCriticas > 0 ? "text-[#b21f14]" : ""}`}>
                  {l.pendenciasCriticas}
                </dd>
              </div>
            </dl>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs text-[var(--rwp-on-light-muted)]">{nomeGestor(l.gestorId)}</span>
              <button
                type="button"
                onClick={() => abrirCockpit(l.id)}
                className="rwp-tap rounded-full bg-[var(--rwp-orange)] px-4 text-sm font-semibold text-white hover:bg-[var(--rwp-orange-strong)]"
              >
                Abrir cockpit
              </button>
            </div>
          </PainelCard>
        ))}
      </ul>
    </div>
  );
}
