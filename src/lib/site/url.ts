// Base pública do site. Em produção, defina NEXT_PUBLIC_SITE_URL (ex.:
// https://rederwp.com). Sem ela, caímos no domínio atual da rede.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://rederwp.com").replace(/\/$/, "");

// Rotas públicas do site (usadas no sitemap).
export const ROTAS_PUBLICAS = [
  "/site",
  "/site/encontrar",
  "/site/marcas",
  "/site/franqueado",
  "/site/para-franqueados",
  "/site/fornecedores",
  "/site/sobre",
  "/site/contato",
  "/site/privacidade",
];
