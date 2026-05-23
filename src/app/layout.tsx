import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gestão de Diaristas",
  description: "App para administrar os diaristas das lojas: cadastro, escala, presença e pagamentos.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Diaristas",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f766e",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
