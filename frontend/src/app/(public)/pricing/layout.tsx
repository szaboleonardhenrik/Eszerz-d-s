import type { Metadata } from "next";
import Script from "next/script";

const faqItems = [
  { q: "Tényleg ingyenes a Kezdő csomag?", a: "Igen, a Kezdő csomag tartósan ingyenes, havi 5 szerződéssel és alapfunkciókkal." },
  { q: "Mikor kell bankkártyát megadni?", a: "Csak fizetős csomaghoz. Az ingyenes regisztrációhoz nem kell bankkártya." },
  { q: "Lehet-e csomagot váltani?", a: "Igen, bármikor up- vagy downgrade-elhetsz a beállításoknál." },
  { q: "Van-e szerződéses kötöttség?", a: "Nincs. Havi fizetésnél bármikor lemondható, éves fizetésnél az időszak végéig érvényes." },
  { q: "Milyen fizetési módokat fogadtok el?", a: "Bankkártyás fizetés (Visa, Mastercard) Stripe-on keresztül." },
  { q: "Kapok-e számlát?", a: "Igen, minden fizetésről automatikus számlát küldünk e-mailben." },
  { q: "Mi történik, ha elfogynak a havi szerződéseim?", a: "A limit felett nem hozhatsz létre újat, de a meglévőket kezelheted. Válts magasabb csomagra, vagy várj a következő hónapra." },
  { q: "Van-e visszatérítési garancia?", a: "Az éves csomagoknál 14 napos pénzvisszafizetési garanciát adunk." },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqItems.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export const metadata: Metadata = {
  title: "Árak - Csomagok és előfizetések",
  description:
    "Legitas árak: ingyenes Kezdő csomag, Alap (975 Ft/hó), Profi (2 475 Ft/hó), Vállalati (egyedi). Nincs rejtett költség, nincs kötöttség.",
  openGraph: {
    title: "Legitas Árak - Válaszd ki a neked való csomagot",
    description: "Ingyenes indulás, havi 975 Ft-tól korlátlan szerződéskezelés. Nincs kötöttség.",
    type: "website",
  },
  alternates: { canonical: "https://legitas.hu/pricing" },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Script
        id="faq-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      {children}
    </>
  );
}
