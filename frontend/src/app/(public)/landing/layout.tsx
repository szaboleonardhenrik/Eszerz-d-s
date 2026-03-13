import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Online Szerződéskezelő Platform | Legitas",
  description:
    "Készíts szerződést percek alatt, ne napok alatt. Ptk.-konform sablonok, e-aláírás, AI elemzés, digitális aláírás. Magyar KKV-knak.",
  openGraph: {
    title: "Legitas - Online Szerződéskezelő Platform",
    description: "Készíts szerződést percek alatt. 15+ jogász által ellenőrzött sablon, e-aláírás, AI elemzés.",
    type: "website",
    images: [{ url: "https://legitas.hu/icons/icon-512.png", width: 512, height: 512, alt: "Legitas" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Legitas - Online Szerződéskezelő Platform",
    description: "Készíts szerződést percek alatt. Magyar KKV-knak.",
  },
  alternates: {
    canonical: "https://legitas.hu/landing",
    languages: { "hu": "https://legitas.hu/landing", "x-default": "https://legitas.hu/landing" },
  },
};

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
