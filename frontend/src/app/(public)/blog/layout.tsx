import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog - Jogi útmutatók és cikkek",
  description:
    "Szerződésjogi útmutatók, cikkek és tippek magyar vállalkozásoknak. Ptk., GDPR, munkajog, e-aláírás, digitalizáció.",
  openGraph: {
    title: "Legitas Blog - Jogi útmutatók vállalkozásoknak",
    description: "Szerződésjogi cikkek, útmutatók és gyakorlati tippek magyar KKV-knak.",
    type: "website",
  },
  alternates: {
    canonical: "https://legitas.hu/blog",
    languages: { "hu": "https://legitas.hu/blog", "x-default": "https://legitas.hu/blog" },
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
