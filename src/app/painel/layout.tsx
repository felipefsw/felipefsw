import type { Metadata } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";

// Tipografia da seção 13 do book: Barlow Condensed nos títulos, Barlow no corpo.
const corpo = Barlow({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--fonte-painel-corpo",
  display: "swap",
});

const titulo = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--fonte-painel-titulo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Painel do Gestor · RWP",
  description: "Faturamento, CMV, metas e escala das pizzarias da rede.",
};

export default function PainelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-tema="painel" className={`${corpo.variable} ${titulo.variable} min-h-screen`}>
      {children}
    </div>
  );
}
