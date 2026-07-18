import type { Metadata } from "next";
import "./site.css";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import { SITE_URL } from "@/lib/site/url";

const DESCRICAO =
  "Rede RWP: pizzarias (Pizza Pizza, Rei da Pizza, We Love Pizza e Royal Pizza) e um ecossistema de gestão para franqueados, gerentes e consultores.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Rede RWP — Pizzarias e gestão para franqueados",
    template: "%s · Rede RWP",
  },
  description: DESCRICAO,
  applicationName: "Rede RWP",
  alternates: { canonical: "/site" },
  openGraph: {
    type: "website",
    siteName: "Rede RWP",
    locale: "pt_BR",
    url: "/site",
    title: "Rede RWP — Pizzarias e gestão para franqueados",
    description: DESCRICAO,
  },
  twitter: {
    card: "summary_large_image",
    title: "Rede RWP — Pizzarias e gestão para franqueados",
    description: DESCRICAO,
  },
};

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="rwp-site flex min-h-screen flex-col">
      <a href="#conteudo" className="rwp-skip">
        Pular para o conteúdo
      </a>
      <SiteHeader />
      <main id="conteudo" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
