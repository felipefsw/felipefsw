"use client";

/*
  Cabeçalho do site público.
  A navegação é enxuta e organizada por PÚBLICO/INTENÇÃO (achado central da
  auditoria: a navegação misturava consumidor, franqueado, colaborador e
  fornecedor sem hierarquia). O login ("Sou franqueado ou colaborador") fica
  claramente separado como ação à direita.
*/
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV = [
  { href: "/site/encontrar", rotulo: "Encontrar pizzaria" },
  { href: "/site/marcas", rotulo: "Nossas marcas" },
  { href: "/site/franqueado", rotulo: "Seja franqueado" },
  { href: "/site/para-franqueados", rotulo: "Para franqueados" },
  { href: "/site/fornecedores", rotulo: "Fornecedores" },
  { href: "/site/sobre", rotulo: "Sobre" },
];

export default function SiteHeader() {
  const [aberto, setAberto] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[var(--rwp-ink)] text-[var(--rwp-on-dark)]">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-3">
        <Link href="/site" className="flex shrink-0 items-center gap-2" aria-label="Rede RWP — início">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/rwp-logo.svg" alt="" className="h-9 w-auto" />
          <span className="rwp-display text-lg leading-none">
            Rede RWP
          </span>
        </Link>

        <nav aria-label="Navegação principal" className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => {
            const ativo = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={ativo ? "page" : undefined}
                className={`rwp-tap inline-flex items-center rounded-full px-3 text-sm font-medium transition-colors ${
                  ativo ? "bg-white/15 text-white" : "text-[var(--rwp-on-dark-muted)] hover:bg-white/10 hover:text-white"
                }`}
              >
                {item.rotulo}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/entrar"
            className="rwp-tap hidden items-center rounded-full bg-[var(--rwp-orange)] px-4 text-sm font-semibold text-white hover:bg-[var(--rwp-orange-strong)] sm:inline-flex"
          >
            Entrar
          </Link>
          <button
            type="button"
            onClick={() => setAberto((v) => !v)}
            aria-expanded={aberto}
            aria-controls="menu-mobile"
            className="rwp-tap inline-flex items-center justify-center rounded-full border border-white/30 px-3 text-sm font-medium lg:hidden"
          >
            {aberto ? "Fechar" : "Menu"}
          </button>
        </div>
      </div>

      {aberto && (
        <nav
          id="menu-mobile"
          aria-label="Navegação principal (mobile)"
          className="border-t border-white/10 px-5 py-3 lg:hidden"
        >
          <ul className="flex flex-col gap-1">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setAberto(false)}
                  className="rwp-tap flex items-center rounded-lg px-3 text-base font-medium text-[var(--rwp-on-dark)] hover:bg-white/10"
                >
                  {item.rotulo}
                </Link>
              </li>
            ))}
            <li className="mt-2 flex gap-2">
              <Link
                href="/entrar"
                onClick={() => setAberto(false)}
                className="rwp-tap flex flex-1 items-center justify-center rounded-full bg-[var(--rwp-orange)] px-4 text-sm font-semibold text-white"
              >
                Entrar (franqueado / colaborador)
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
