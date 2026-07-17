import type { MetadataRoute } from "next";
import { ROTAS_PUBLICAS, SITE_URL } from "@/lib/site/url";

// Sitemap com as páginas públicas do site da Rede RWP (o portal de gestão é
// privado e não deve ser indexado).
export default function sitemap(): MetadataRoute.Sitemap {
  return ROTAS_PUBLICAS.map((rota) => ({
    url: `${SITE_URL}${rota}`,
    changeFrequency: rota === "/site" ? "weekly" : "monthly",
    priority: rota === "/site" ? 1 : 0.7,
  }));
}
