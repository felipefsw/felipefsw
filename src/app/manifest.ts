import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Gestão de Diaristas · Pizzarias RWP",
    short_name: "Diaristas RWP",
    description: "Cadastro, escala, presença e pagamentos dos diaristas das lojas.",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f5f7",
    theme_color: "#0f766e",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
