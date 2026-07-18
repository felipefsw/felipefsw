"use client";

/*
  Localizador de pizzarias. Filtro por marca e por cidade/bairro, com estado
  vazio explícito (achado da auditoria: distinguir "sem resultado" de erro).
  O "Como chegar" abre uma busca no mapa pelo nome da unidade — não dependemos
  de endereço exato enquanto os dados reais não são integrados.
*/
import { useMemo, useState } from "react";
import { MARCAS, UNIDADES, type Unidade } from "@/lib/site/dados";

const NOME_MARCA = Object.fromEntries(MARCAS.map((m) => [m.slug, m.nome]));

export default function Localizador({ marcaInicial = "" }: { marcaInicial?: string }) {
  const [marca, setMarca] = useState(marcaInicial);
  const [busca, setBusca] = useState("");

  const resultados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return UNIDADES.filter((u) => {
      const okMarca = !marca || u.marca === marca;
      const okBusca =
        !termo ||
        u.cidade.toLowerCase().includes(termo) ||
        u.bairro.toLowerCase().includes(termo) ||
        u.nome.toLowerCase().includes(termo);
      return okMarca && okBusca;
    });
  }, [marca, busca]);

  return (
    <div>
      <form
        className="grid gap-4 rounded-2xl border border-[var(--rwp-line)] bg-[var(--rwp-surface)] p-5 shadow-sm sm:grid-cols-2"
        onSubmit={(e) => e.preventDefault()}
      >
        <div className="flex flex-col gap-1">
          <label htmlFor="filtro-marca" className="text-sm font-semibold">
            Marca
          </label>
          <select
            id="filtro-marca"
            value={marca}
            onChange={(e) => setMarca(e.target.value)}
            className="rwp-tap rounded-lg border border-[var(--rwp-line)] bg-white px-3 text-base"
          >
            <option value="">Todas as marcas</option>
            {MARCAS.map((m) => (
              <option key={m.slug} value={m.slug}>
                {m.nome}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="filtro-busca" className="text-sm font-semibold">
            Cidade ou bairro
          </label>
          <input
            id="filtro-busca"
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Ex.: Fortaleza, Aldeota…"
            className="rwp-tap rounded-lg border border-[var(--rwp-line)] bg-white px-3 text-base"
          />
        </div>
      </form>

      <p className="mt-4 text-sm text-[var(--rwp-on-light-muted)]" aria-live="polite">
        {resultados.length === 0
          ? "Nenhuma unidade encontrada com esses filtros."
          : `${resultados.length} unidade${resultados.length > 1 ? "s" : ""} encontrada${
              resultados.length > 1 ? "s" : ""
            }.`}
      </p>

      {resultados.length > 0 && (
        <ul className="mt-4 grid gap-4 sm:grid-cols-2">
          {resultados.map((u, i) => (
            <UnidadeCard key={`${u.nome}-${i}`} u={u} />
          ))}
        </ul>
      )}
    </div>
  );
}

function UnidadeCard({ u }: { u: Unidade }) {
  const mapa = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${u.nome} ${u.bairro} ${u.cidade} ${u.uf}`,
  )}`;
  return (
    <li className="flex flex-col rounded-2xl border border-[var(--rwp-line)] bg-[var(--rwp-surface)] p-5 shadow-sm">
      <span className="text-xs font-semibold uppercase tracking-wide text-[var(--rwp-orange-strong)]">
        {NOME_MARCA[u.marca] ?? u.marca}
      </span>
      <h3 className="rwp-display mt-1 text-lg">{u.nome}</h3>
      <p className="mt-1 flex-1 text-sm text-[var(--rwp-on-light-muted)]">
        {u.bairro} · {u.cidade} — {u.uf}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href={mapa}
          target="_blank"
          rel="noopener noreferrer"
          className="rwp-tap inline-flex items-center rounded-full bg-[var(--rwp-orange)] px-4 text-sm font-semibold text-white hover:bg-[var(--rwp-orange-strong)]"
        >
          Como chegar
        </a>
      </div>
    </li>
  );
}
