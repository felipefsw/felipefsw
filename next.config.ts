import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Fotos de celular passam de 1MB (limite padrão). O upload já comprime no
    // navegador, mas deixamos folga para o caso de imagens grandes/HEIC.
    serverActions: { bodySizeLimit: "8mb" },
  },
};

export default nextConfig;
