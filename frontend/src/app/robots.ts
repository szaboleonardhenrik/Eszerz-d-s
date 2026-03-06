import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/landing", "/blog", "/aszf", "/adatvedelem", "/cookie", "/register"],
        disallow: ["/dashboard", "/contracts", "/settings", "/analytics", "/create", "/templates", "/sign", "/api"],
      },
    ],
    sitemap: "https://szerzodes.cegverzum.hu/sitemap.xml",
  };
}
