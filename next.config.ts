import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Fotos de celular passam de 1MB (limite padrão). O upload já comprime no
    // navegador, mas deixamos folga para o caso de imagens grandes/HEIC.
    // O Painel do Gestor sobe relatórios do Saipos e do iFood, que chegam a
    // alguns MB cada e podem ir vários de uma vez.
    serverActions: { bodySizeLimit: "25mb" },
  },
};

export default nextConfig;
