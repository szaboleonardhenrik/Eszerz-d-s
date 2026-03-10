import type { MetadataRoute } from "next";

const BASE_URL = "https://legitas.hu";

const blogSlugs = [
  "elektronikus-alairas-magyarorszagon-2026",
  "szerzodeskezeles-kkv-digitalizacio",
  "ptk-szerzodeskotes-alapjai",
  "nda-titoktartasi-szerzodes-minta",
  "gdpr-szerzodes-adatvedelem",
  "munkaszerodes-2026-valtozasok",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = [
    { url: `${BASE_URL}/landing`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 1.0 },
    { url: `${BASE_URL}/blog`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.8 },
    { url: `${BASE_URL}/aszf`, lastModified: new Date("2026-03-01"), changeFrequency: "monthly" as const, priority: 0.5 },
    { url: `${BASE_URL}/adatvedelem`, lastModified: new Date("2026-03-01"), changeFrequency: "monthly" as const, priority: 0.5 },
    { url: `${BASE_URL}/cookie`, lastModified: new Date("2026-03-01"), changeFrequency: "monthly" as const, priority: 0.3 },
    { url: `${BASE_URL}/impresszum`, lastModified: new Date("2026-03-01"), changeFrequency: "monthly" as const, priority: 0.4 },
    { url: `${BASE_URL}/pricing`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.8 },
    { url: `${BASE_URL}/dpa`, lastModified: new Date("2026-03-01"), changeFrequency: "monthly" as const, priority: 0.3 },
    { url: `${BASE_URL}/dpia`, lastModified: new Date("2026-03-07"), changeFrequency: "yearly" as const, priority: 0.3 },
    { url: `${BASE_URL}/scc`, lastModified: new Date("2026-03-07"), changeFrequency: "yearly" as const, priority: 0.3 },
    { url: `${BASE_URL}/login`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.4 },
    { url: `${BASE_URL}/register`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.6 },
  ];

  const blogPages = blogSlugs.map((slug) => ({
    url: `${BASE_URL}/blog/${slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...blogPages];
}
