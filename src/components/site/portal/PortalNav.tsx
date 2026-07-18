"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ABAS = [
  { href: "/site/portal/cockpit", rotulo: "Cockpit Diário" },
  { href: "/site/portal/termometro", rotulo: "Termômetro Explicável" },
];

export default function PortalNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Telas da prévia" className="flex flex-wrap gap-1">
      {ABAS.map((a) => {
        const ativo = pathname === a.href;
        return (
          <Link
            key={a.href}
            href={a.href}
            aria-current={ativo ? "page" : undefined}
            className={`rwp-tap inline-flex items-center rounded-full px-4 text-sm font-semibold ${
              ativo
                ? "bg-[var(--rwp-ink)] text-white"
                : "border border-[var(--rwp-line)] text-[var(--rwp-on-light)] hover:bg-[var(--rwp-surface-2)]"
            }`}
          >
            {a.rotulo}
          </Link>
        );
      })}
    </nav>
  );
}
