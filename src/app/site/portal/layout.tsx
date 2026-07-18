import type { Metadata } from "next";
import Link from "next/link";
import ContextoBar from "@/components/site/portal/ContextoBar";
import PortalNav from "@/components/site/portal/PortalNav";

export const metadata: Metadata = {
  title: "Prévia do portal",
  description:
    "Demonstração navegável da direção de produto da Rede RWP: Cockpit Diário e Termômetro Explicável 2.0. Dados fictícios.",
  robots: { index: false, follow: false },
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[var(--rwp-surface-2)]">
      {/* Selo persistente de DEMONSTRAÇÃO — segrega o que é prévia do que é produção
          (a auditoria apontou conteúdo de teste convivendo com telas operacionais). */}
      <div className="bg-[var(--rwp-ink)] text-[var(--rwp-on-dark)]">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-3 gap-y-1 px-5 py-2 text-xs">
          <span className="rounded-full bg-[var(--rwp-orange)] px-2 py-0.5 font-bold uppercase tracking-wide text-white">
            Demonstração
          </span>
          <span className="text-[var(--rwp-on-dark-muted)]">
            Prévia de produto com dados fictícios — não é o portal em produção.
          </span>
          <Link href="/site/para-franqueados" className="ml-auto font-semibold underline hover:text-white">
            ← Voltar para a consultoria
          </Link>
        </div>
      </div>

      <ContextoBar />

      <div className="mx-auto w-full max-w-6xl px-5 py-6">
        <PortalNav />
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
