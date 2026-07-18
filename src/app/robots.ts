import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site/url";

// Só o site público (/site) deve ser indexado. O restante do domínio é o portal
// de gestão, privado e atrás de login — por isso bloqueamos a indexação geral e
// liberamos explicitamente as páginas do site.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/site",
      disallow: "/",
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
