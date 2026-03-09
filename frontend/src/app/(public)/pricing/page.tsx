"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";

/* -- Reveal on scroll --------------------------------------------------- */
function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => el.classList.add("animate-fadeUp"), delay);
          observer.unobserve(el);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);
  return <div ref={ref} className={`opacity-0 translate-y-6 ${className}`}>{children}</div>;
}

/* -- Plan data ----------------------------------------------------------- */
const plans = [
  {
    name: "Kezd\u0151",
    monthlyPrice: 975,
    yearlyPrice: 11700,
    desc: "Egy\u00e9ni v\u00e1llalkoz\u00f3kra tervezve",
    contracts: "2 szerz\u0151d\u00e9s / h\u00f3",
    subAccounts: "0 t\u00e1rsfi\u00f3k",
    signers: "2 f\u0151 / szerz\u0151d\u00e9s",
    features: [
      "AI asszisztens",
      "AI elemz\u0151",
      "K\u00e9zi e-al\u00e1\u00edr\u00e1s",
      "Tev\u00e9kenys\u00e9gi napl\u00f3",
      "Adatv\u00e9delmi pajzs",
    ],
    timestamps: "24 id\u0151b\u00e9lyeg / \u00e9v",
    support: "72 \u00f3ra support",
    cta: "Kezd\u0151 csomag v\u00e1laszt\u00e1sa",
    href: "/register",
    popular: false,
    iconPath: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  {
    name: "K\u00f6z\u00e9pes",
    monthlyPrice: 14950,
    yearlyPrice: 179400,
    desc: "Mikro-v\u00e1llalkoz\u00e1soknak",
    contracts: "12 szerz\u0151d\u00e9s / h\u00f3",
    subAccounts: "2 t\u00e1rsfi\u00f3k",
    signers: "10 f\u0151 / szerz\u0151d\u00e9s",
    features: [
      "Sablont\u00e1r",
      "CRM",
      "Email k\u00f6vet\u00e9s",
      "Sablon verzi\u00f3k\u00f6vet\u00e9s",
      "CSV export",
    ],
    timestamps: "144 id\u0151b\u00e9lyeg / \u00e9v",
    support: "Email support (36 \u00f3ra)",
    cta: "K\u00f6z\u00e9pes csomag v\u00e1laszt\u00e1sa",
    href: "/register",
    popular: false,
    iconPath: "M13 10V3L4 14h7v7l9-11h-7z",
  },
  {
    name: "Pr\u00e9mium",
    monthlyPrice: 26000,
    yearlyPrice: 312000,
    desc: "KKV-knak",
    contracts: "35 szerz\u0151d\u00e9s / h\u00f3",
    subAccounts: "5 t\u00e1rsfi\u00f3k",
    signers: "10 f\u0151 / szerz\u0151d\u00e9s",
    features: [
      "T\u00f6meges m\u0171veletek",
      "Branding",
      "Statisztika",
      "K\u00e9tfaktoros hiteles\u00edt\u00e9s",
      "API hozz\u00e1f\u00e9r\u00e9s",
      "Automatiz\u00e1ci\u00f3",
    ],
    timestamps: "420 id\u0151b\u00e9lyeg / \u00e9v",
    support: "Direkt email support (24 \u00f3ra)",
    cta: "Pr\u00e9mium csomag v\u00e1laszt\u00e1sa",
    href: "/register",
    popular: true,
    iconPath: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z",
  },
  {
    name: "Nagyv\u00e1llalati",
    monthlyPrice: 149500,
    yearlyPrice: 1794000,
    desc: "Nagyv\u00e1llalatoknak",
    contracts: "500 szerz\u0151d\u00e9s / h\u00f3",
    subAccounts: "20 t\u00e1rsfi\u00f3k",
    signers: "10 f\u0151 / szerz\u0151d\u00e9s",
    features: [
      "VIP support",
      "Onboarding",
      "V\u00e9dett h\u00e1l\u00f3zat",
      "Halad\u00f3 jogosults\u00e1gkezel\u0151",
    ],
    timestamps: "6 000 id\u0151b\u00e9lyeg / \u00e9v",
    support: "VIP Telefon+Email (12 \u00f3ra)",
    cta: "Aj\u00e1nlatk\u00e9r\u00e9s",
    href: "/register",
    popular: false,
    iconPath: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
  },
];

/* -- Helper: format price ------------------------------------------------ */
function formatPrice(n: number): string {
  return n.toLocaleString("hu-HU");
}

/* -- Comparison table data ----------------------------------------------- */
type ComparisonValue = boolean | string;

interface ComparisonRow {
  name: string;
  kezdo: ComparisonValue;
  kozepes: ComparisonValue;
  premium: ComparisonValue;
  nagyvallalati: ComparisonValue;
}

const comparisonFeatures: ComparisonRow[] = [
  { name: "Szerz\u0151d\u00e9sek / h\u00f3", kezdo: "2", kozepes: "12", premium: "35", nagyvallalati: "500" },
  { name: "T\u00e1rsfi\u00f3kok", kezdo: "0", kozepes: "2", premium: "5", nagyvallalati: "20" },
  { name: "F\u0151 / szerz\u0151d\u00e9s", kezdo: "2", kozepes: "10", premium: "10", nagyvallalati: "10" },
  { name: "Id\u0151b\u00e9lyeg / \u00e9v", kezdo: "24", kozepes: "144", premium: "420", nagyvallalati: "6 000" },
  { name: "AI asszisztens", kezdo: true, kozepes: true, premium: true, nagyvallalati: true },
  { name: "AI elemz\u0151", kezdo: true, kozepes: true, premium: true, nagyvallalati: true },
  { name: "K\u00e9zi e-al\u00e1\u00edr\u00e1s", kezdo: true, kozepes: true, premium: true, nagyvallalati: true },
  { name: "Tev\u00e9kenys\u00e9gi napl\u00f3", kezdo: true, kozepes: true, premium: true, nagyvallalati: true },
  { name: "Adatv\u00e9delmi pajzs", kezdo: true, kozepes: true, premium: true, nagyvallalati: true },
  { name: "Sablont\u00e1r", kezdo: false, kozepes: true, premium: true, nagyvallalati: true },
  { name: "CRM", kezdo: false, kozepes: true, premium: true, nagyvallalati: true },
  { name: "Email k\u00f6vet\u00e9s", kezdo: false, kozepes: true, premium: true, nagyvallalati: true },
  { name: "Sablon verzi\u00f3k\u00f6vet\u00e9s", kezdo: false, kozepes: true, premium: true, nagyvallalati: true },
  { name: "CSV export", kezdo: false, kozepes: true, premium: true, nagyvallalati: true },
  { name: "T\u00f6meges m\u0171veletek", kezdo: false, kozepes: false, premium: true, nagyvallalati: true },
  { name: "Branding", kezdo: false, kozepes: false, premium: true, nagyvallalati: true },
  { name: "Statisztika", kezdo: false, kozepes: false, premium: true, nagyvallalati: true },
  { name: "K\u00e9tfaktoros hiteles\u00edt\u00e9s", kezdo: false, kozepes: false, premium: true, nagyvallalati: true },
  { name: "API hozz\u00e1f\u00e9r\u00e9s", kezdo: false, kozepes: false, premium: true, nagyvallalati: true },
  { name: "Automatiz\u00e1ci\u00f3", kezdo: false, kozepes: false, premium: true, nagyvallalati: true },
  { name: "VIP support", kezdo: false, kozepes: false, premium: false, nagyvallalati: true },
  { name: "Onboarding", kezdo: false, kozepes: false, premium: false, nagyvallalati: true },
  { name: "V\u00e9dett h\u00e1l\u00f3zat", kezdo: false, kozepes: false, premium: false, nagyvallalati: true },
  { name: "Halad\u00f3 jogosults\u00e1gkezel\u0151", kezdo: false, kozepes: false, premium: false, nagyvallalati: true },
  { name: "Support v\u00e1laszid\u0151", kezdo: "72 \u00f3ra", kozepes: "36 \u00f3ra", premium: "24 \u00f3ra", nagyvallalati: "12 \u00f3ra" },
];

/* -- FAQ data ------------------------------------------------------------ */
const faqs = [
  {
    q: "B\u00e1rmikor v\u00e1lthatom a csomagot?",
    a: "Igen! B\u00e1rmikor friss\u00edthetsz magasabb csomagra, \u00e9s a k\u00fcl\u00f6nb\u00f6zetet ar\u00e1nyosan sz\u00e1moljuk. Visszav\u00e1lt\u00e1s eset\u00e9n a k\u00f6vetkez\u0151 sz\u00e1ml\u00e1z\u00e1si ciklust\u00f3l \u00e9rv\u00e9nyes a v\u00e1ltoz\u00e1s.",
  },
  {
    q: "Mi t\u00f6rt\u00e9nik, ha elfogy a havi keretem?",
    a: "A havi limit el\u00e9r\u00e9sekor nem hozhatsz l\u00e9tre \u00faj szerz\u0151d\u00e9st, de a megl\u00e9v\u0151idet tov\u00e1bbra is kezelheted. Friss\u00edts magasabb csomagra, ha t\u00f6bb szerz\u0151d\u00e9sre van sz\u00fcks\u00e9ged.",
  },
  {
    q: "Az \u00e1rak tartalmaznak \u00c1F\u00c1t?",
    a: "A felt\u00fcntetett \u00e1rak nett\u00f3 \u00e1rak, azaz nem tartalmazz\u00e1k a 27% \u00c1F\u00c1t. A v\u00e9gleges \u00f6sszeg a p\u00e9nzt\u00e1rn\u00e1l l\u00e1tszik \u00c1F\u00c1val egy\u00fctt. Minden fizet\u00e9sr\u0151l automatikus e-sz\u00e1ml\u00e1t \u00e1ll\u00edtunk ki.",
  },
  {
    q: "Van-e pr\u00f3baid\u0151szak?",
    a: "Igen! Minden fizet\u0151s csomaghoz 14 napos ingyenes pr\u00f3baid\u0151 j\u00e1r, bankk\u00e1rtya megad\u00e1sa n\u00e9lk\u00fcl. Ha nem tetszik, egyszer\u0171en nem fizetsz el\u0151.",
  },
  {
    q: "Milyen fizet\u00e9si m\u00f3dokat fogadtok el?",
    a: "Bankk\u00e1rty\u00e1s fizet\u00e9st (Visa, Mastercard) Stripe-on kereszt\u00fcl, valamint banki \u00e1tutal\u00e1st \u00e9ves fizet\u00e9s eset\u00e9n. Minden fizet\u00e9sr\u0151l automatikus e-sz\u00e1ml\u00e1t \u00e1ll\u00edtunk ki.",
  },
  {
    q: "Jogilag \u00e9rv\u00e9nyes az elektronikus al\u00e1\u00edr\u00e1s?",
    a: "Igen. Az eIDAS rendelet \u00e9s a magyar Ptk. szerint az elektronikus al\u00e1\u00edr\u00e1s jogilag egyenl\u0151 \u00e9rt\u00e9k\u0171 a k\u00e9zzel \u00edrott al\u00e1\u00edr\u00e1ssal a legt\u00f6bb szerz\u0151d\u00e9st\u00edpusn\u00e1l. A rendszer teljes audit napl\u00f3t vezet.",
  },
  {
    q: "Mi az id\u0151b\u00e9lyeg?",
    a: "Az id\u0151b\u00e9lyeg egy kriptogr\u00e1fiai pecs\u00e9t, ami igazolja, hogy a szerz\u0151d\u00e9s egy adott id\u0151pontban l\u00e9tezett. Jogi vit\u00e1kn\u00e1l fontos bizony\u00edt\u00e9k lehet. A csomagok \u00e9ves kerettel rendelkeznek.",
  },
  {
    q: "Mennyit spor\u00f3lok \u00e9ves el\u0151fizet\u00e9ssel?",
    a: "Az \u00e9ves el\u0151fizet\u00e9s v\u00e1laszt\u00e1s\u00e1val 23%-ot spor\u00f3lsz a havi \u00e1rakhoz k\u00e9pest. Az \u00e9ves d\u00edjat egyben sz\u00e1ml\u00e1zzuk.",
  },
];

/* ======================================================================== */
/*  PRICING PAGE                                                            */
/* ======================================================================== */
export default function PricingPage() {
  const [yearly, setYearly] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  return (
    <div>
      {/* Hero */}
      <section className="pt-20 pb-12 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Reveal>
            <p className="text-brand-teal-dark dark:text-brand-teal font-semibold text-sm uppercase tracking-wider mb-3">{"\u00c1raz\u00e1s"}</p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 dark:text-white mb-4">
              {"\u00c1rak \u00e9s csomagok"}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-lg max-w-2xl mx-auto mb-8">
              {"\u00c1tl\u00e1that\u00f3 \u00e1rak, rejtett k\u00f6lts\u00e9gek n\u00e9lk\u00fcl. V\u00e1laszd ki a c\u00e9gednek megfelel\u0151 csomagot."}
            </p>
          </Reveal>

          {/* Monthly / Yearly toggle */}
          <Reveal delay={100}>
            <div className="inline-flex items-center gap-3 bg-white dark:bg-gray-800 rounded-full p-1.5 border border-gray-200 dark:border-gray-700 shadow-sm">
              <button
                onClick={() => setYearly(false)}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition ${
                  !yearly
                    ? "bg-brand-teal-dark text-white shadow-md"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                }`}
              >
                Havi
              </button>
              <button
                onClick={() => setYearly(true)}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition flex items-center gap-2 ${
                  yearly
                    ? "bg-brand-teal-dark text-white shadow-md"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                }`}
              >
                {"\u00c9ves"}
                <span className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {"23% kedvezm\u00e9ny"}
                </span>
              </button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Plans */}
      <section className="pb-20 -mt-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan, i) => {
              const displayPrice = yearly
                ? Math.round(plan.yearlyPrice / 12)
                : plan.monthlyPrice;
              const periodLabel = yearly ? "+ \u00e1fa / h\u00f3 (\u00e9ves)" : "+ \u00e1fa / h\u00f3";

              return (
                <Reveal key={i} delay={i * 100}>
                  <div className={`relative rounded-2xl p-8 flex flex-col h-full transition-all duration-300 ${
                    plan.popular
                      ? "bg-gradient-to-br from-brand-teal-dark to-brand-teal dark:from-brand-teal dark:to-brand-teal-light text-white shadow-2xl shadow-brand-teal/25 scale-[1.04] ring-2 ring-brand-teal/50"
                      : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-brand-teal/30 dark:hover:border-brand-teal/40 hover:shadow-lg"
                  }`}>
                    {plan.popular && (
                      <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-brand-teal-light text-white text-xs font-bold px-4 py-1 rounded-full shadow-sm">
                        {"Legn\u00e9pszer\u0171bb"}
                      </span>
                    )}

                    {/* Icon */}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                      plan.popular ? "bg-white/15" : "bg-brand-teal/10 dark:bg-brand-teal/20"
                    }`}>
                      <svg className={`w-6 h-6 ${plan.popular ? "text-brand-teal-light" : "text-brand-teal-dark dark:text-brand-teal"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={plan.iconPath} />
                      </svg>
                    </div>

                    {/* Name */}
                    <h3 className={`font-bold text-xl mb-1 ${plan.popular ? "text-white" : "text-gray-900 dark:text-white"}`}>
                      {plan.name}
                    </h3>
                    <p className={`text-xs font-medium mb-4 ${plan.popular ? "text-white/60" : "text-gray-400"}`}>
                      {plan.desc}
                    </p>

                    {/* Price */}
                    <div className="mb-1">
                      <span className={`text-3xl font-extrabold ${plan.popular ? "text-white" : "text-gray-900 dark:text-white"}`}>
                        {formatPrice(displayPrice)}
                      </span>
                      <span className={`text-xs ml-1.5 ${plan.popular ? "text-white/70" : "text-gray-400"}`}>
                        Ft {periodLabel}
                      </span>
                    </div>
                    {yearly ? (
                      <p className={`text-xs mb-4 ${plan.popular ? "text-white/50" : "text-gray-400"}`}>
                        {formatPrice(plan.yearlyPrice)} Ft + {"\u00e1fa / \u00e9v"}
                      </p>
                    ) : (
                      <p className={`text-xs mb-4 ${plan.popular ? "text-white/50" : "text-gray-400"}`}>
                        vagy {formatPrice(plan.yearlyPrice)} Ft + {"\u00e1fa / \u00e9v"}
                      </p>
                    )}

                    {/* Limits */}
                    <div className={`text-xs space-y-1 mb-5 pb-5 border-b ${
                      plan.popular ? "border-white/20" : "border-gray-100 dark:border-gray-700"
                    }`}>
                      <p className={plan.popular ? "text-white/80" : "text-gray-600 dark:text-gray-300"}>{plan.contracts}</p>
                      <p className={plan.popular ? "text-white/80" : "text-gray-600 dark:text-gray-300"}>{plan.subAccounts}</p>
                      <p className={plan.popular ? "text-white/80" : "text-gray-600 dark:text-gray-300"}>{plan.signers}</p>
                      <p className={plan.popular ? "text-white/80" : "text-gray-600 dark:text-gray-300"}>{plan.timestamps}</p>
                    </div>

                    {/* Features */}
                    <ul className="space-y-2.5 mb-4 flex-1">
                      {plan.features.map((f, j) => (
                        <li key={j} className="flex items-start gap-2.5 text-sm">
                          <svg className={`w-4 h-4 mt-0.5 shrink-0 ${plan.popular ? "text-brand-teal-light" : "text-brand-teal-dark dark:text-brand-teal"}`} fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span className={plan.popular ? "text-white/90" : "text-gray-600 dark:text-gray-300"}>{f}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Support badge */}
                    <p className={`text-xs font-medium mb-5 ${plan.popular ? "text-white/60" : "text-gray-400"}`}>
                      {plan.support}
                    </p>

                    {/* CTA */}
                    <Link
                      href={plan.href}
                      className={`block text-center py-3.5 rounded-xl font-semibold text-sm transition mt-auto ${
                        plan.popular
                          ? "bg-white text-brand-teal-dark hover:bg-gray-100 shadow-lg"
                          : "bg-brand-teal-dark dark:bg-brand-teal hover:bg-brand-teal-dark/90 dark:hover:bg-brand-teal/90 text-white"
                      }`}
                    >
                      {plan.cta}
                    </Link>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Comparison Table Toggle */}
      <section className="pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <button
              onClick={() => setShowComparison(!showComparison)}
              className="inline-flex items-center gap-2 text-brand-teal-dark dark:text-brand-teal font-semibold text-sm hover:underline"
            >
              {showComparison ? "\u00d6sszehasonl\u00edt\u00e1s elrejt\u00e9se" : "R\u00e9szletes \u00f6sszehasonl\u00edt\u00e1s megtekint\u00e9se"}
              <svg className={`w-4 h-4 transition-transform ${showComparison ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {showComparison && (
            <Reveal>
              <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-700">
                      <th className="text-left px-6 py-4 font-semibold text-gray-900 dark:text-white min-w-[200px]">{`Funkci\u00f3`}</th>
                      <th className="px-4 py-4 font-semibold text-gray-900 dark:text-white text-center">{`Kezd\u0151`}</th>
                      <th className="px-4 py-4 font-semibold text-gray-900 dark:text-white text-center">{`K\u00f6z\u00e9pes`}</th>
                      <th className="px-4 py-4 font-semibold text-brand-teal-dark dark:text-brand-teal text-center bg-brand-teal/5 dark:bg-brand-teal/10">{`Pr\u00e9mium`}</th>
                      <th className="px-4 py-4 font-semibold text-gray-900 dark:text-white text-center">{`Nagyv\u00e1llalati`}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonFeatures.map((f, i) => (
                      <tr key={i} className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50/50 dark:hover:bg-gray-700/30">
                        <td className="px-6 py-3 text-gray-700 dark:text-gray-300 font-medium">{f.name}</td>
                        {(["kezdo", "kozepes", "premium", "nagyvallalati"] as const).map((tier) => (
                          <td key={tier} className={`px-4 py-3 text-center ${tier === "premium" ? "bg-brand-teal/5 dark:bg-brand-teal/10" : ""}`}>
                            {typeof f[tier] === "boolean" ? (
                              f[tier] ? (
                                <svg className="w-5 h-5 text-green-500 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              ) : (
                                <svg className="w-5 h-5 text-gray-300 dark:text-gray-600 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              )
                            ) : (
                              <span className="text-gray-600 dark:text-gray-300 text-xs font-medium">{f[tier]}</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Reveal>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center mb-12">
              <p className="text-brand-teal-dark dark:text-brand-teal font-semibold text-sm uppercase tracking-wider mb-3">GYIK</p>
              <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">{"Gyakran ism\u00e9telt k\u00e9rd\u00e9sek"}</h2>
            </div>
          </Reveal>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <Reveal key={i} delay={i * 60}>
                <details className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                  <summary className="flex items-center justify-between px-6 py-5 cursor-pointer list-none font-semibold text-gray-900 dark:text-white hover:text-brand-teal-dark dark:hover:text-brand-teal transition">
                    {faq.q}
                    <svg className="w-5 h-5 text-gray-400 group-open:rotate-45 transition-transform shrink-0 ml-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </summary>
                  <div className="px-6 pb-5 text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                    {faq.a}
                  </div>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20 bg-gradient-to-br from-brand-teal-dark via-brand-teal to-brand-teal-light dark:from-brand-teal-dark dark:via-brand-teal-dark/80 dark:to-brand-teal relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-20 w-72 h-72 bg-brand-teal-light rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-20 w-64 h-64 bg-white rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-3xl mx-auto px-4 text-center">
          <Reveal>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
              {"Pr\u00f3b\u00e1ld ki 14 napig ingyen"}
            </h2>
            <p className="text-white/70 text-lg mb-8">
              {"Bankk\u00e1rty\u00e1t nem k\u00e9r\u00fcnk. Ha megtetszik, fizess el\u0151 a c\u00e9gednek megfelel\u0151 csomagra."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 bg-white text-brand-teal-dark font-bold px-10 py-4 rounded-xl transition shadow-lg hover:bg-gray-100 text-lg"
              >
                {"Ingyenes regisztr\u00e1ci\u00f3"}
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
