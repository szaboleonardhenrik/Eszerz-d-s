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
    name: "Ingyenes",
    subtitle: "Free",
    price: "0",
    period: "Ft / hó",
    desc: "Egyéni vállalkozóknak, kipróbáláshoz.",
    features: [
      "5 szerződés / hó",
      "1 felhasználó",
      "100 MB tárolás",
      "Email értesítők",
      "Alap sablonok",
    ],
    limitations: [
      "Nincs API hozzáférés",
      "Nincs csapatkezelés",
      "Nincs analitika",
      "Nincs egyéni branding",
    ],
    cta: "Regisztráció ingyen",
    href: "/register",
    popular: false,
    iconPath: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  {
    name: "Alap",
    subtitle: "Basic",
    price: "4 990",
    period: "Ft / hó",
    desc: "Kis csapatoknak, akik komolyan veszik.",
    features: [
      "30 szerződés / hó",
      "3 felhasználó",
      "1 GB tárolás",
      "API hozzáférés (100 kérés/nap)",
      "Analitika dashboard",
      "Csapatkezelés",
      "Egyéni branding",
    ],
    limitations: [
      "Nincs AI elemzés",
      "Nincs webhook",
    ],
    cta: "Alap csomag választása",
    href: "/register",
    popular: true,
    iconPath: "M13 10V3L4 14h7v7l9-11h-7z",
  },
  {
    name: "Profi",
    subtitle: "Pro",
    price: "14 990",
    period: "Ft / hó",
    desc: "Növekvő cégeknek, korlátok nélkül.",
    features: [
      "Korlátlan szerződés",
      "10 felhasználó",
      "5 GB tárolás",
      "Korlátlan API hozzáférés",
      "Webhookok",
      "Prioritásos támogatás",
      "AI szerződéselemzés",
      "Egyéni arculat",
      "Speciális sablonok",
    ],
    limitations: [],
    cta: "Profi csomag választása",
    href: "/register",
    popular: false,
    iconPath: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z",
  },
];

/* -- Comparison table data ----------------------------------------------- */
const comparisonFeatures = [
  { name: "Szerződések / hó", free: "5", basic: "30", pro: "Korlátlan" },
  { name: "Felhasználók", free: "1", basic: "3", pro: "10" },
  { name: "Tárolás", free: "100 MB", basic: "1 GB", pro: "5 GB" },
  { name: "Alap sablonok", free: true, basic: true, pro: true },
  { name: "Egyéni sablonok", free: false, basic: true, pro: true },
  { name: "Digitális aláírás", free: true, basic: true, pro: true },
  { name: "PDF generálás", free: true, basic: true, pro: true },
  { name: "Email értesítők", free: true, basic: true, pro: true },
  { name: "Csapatkezelés", free: false, basic: true, pro: true },
  { name: "Analitika dashboard", free: false, basic: true, pro: true },
  { name: "Egyéni branding", free: false, basic: true, pro: true },
  { name: "API hozzáférés", free: false, basic: "100/nap", pro: "Korlátlan" },
  { name: "Webhookok", free: false, basic: false, pro: true },
  { name: "AI elemzés", free: false, basic: false, pro: true },
  { name: "Prioritásos támogatás", free: false, basic: false, pro: true },
  { name: "Támogatás", free: "Email", basic: "Email", pro: "Prioritásos" },
];

/* -- FAQ data ------------------------------------------------------------ */
const faqs = [
  {
    q: "Bármikor válthatom a csomagot?",
    a: "Igen! Bármikor frissíthetsz magasabb csomagra, és a különbözetet arányosan számoljuk. Visszaváltás esetén a következő számlázási ciklustól érvényes a változás.",
  },
  {
    q: "Mi történik, ha elfogy a havi keretem?",
    a: "Az ingyenes és Alap csomagoknál a havi limit elérésekor nem hozhatsz létre új szerződést, de a meglévőidet továbbra is kezelheted. A Profi csomagban nincs limit.",
  },
  {
    q: "Van-e próbaidő a fizetős csomagokhoz?",
    a: "Igen! Az Alap és Profi csomagokhoz 14 napos ingyenes próbaidő jár, bankkártya megadása nélkül. Ha nem tetszik, egyszerűen visszaváltasz az ingyenes csomagra.",
  },
  {
    q: "Milyen fizetési módokat fogadtok el?",
    a: "Bankkártyás fizetést (Visa, Mastercard) Stripe-on keresztül, valamint banki átutalást éves fizetés esetén. Minden fizetésről automatikus e-számlát állítunk ki.",
  },
  {
    q: "Jogilag érvényes az elektronikus aláírás?",
    a: "Igen. Az eIDAS rendelet és a magyar Ptk. szerint az elektronikus aláírás jogilag egyenértékű a kézzel írott aláírással a legtöbb szerződéstípusnál. A rendszer teljes audit naplót vezet.",
  },
];

/* ======================================================================== */
/*  PRICING PAGE                                                            */
/* ======================================================================== */
export default function PricingPage() {
  const [showComparison, setShowComparison] = useState(false);

  return (
    <div>
      {/* Hero */}
      <section className="pt-20 pb-12 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Reveal>
            <p className="text-blue-600 dark:text-cyan-400 font-semibold text-sm uppercase tracking-wider mb-3">Árazás</p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 dark:text-white mb-4">
              Árak és csomagok
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-lg max-w-2xl mx-auto mb-4">
              Átlátható árak, rejtett költségek nélkül. Kezdd ingyen, fizess akkor, amikor a céged nő.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Plans */}
      <section className="pb-20 -mt-2">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan, i) => (
              <Reveal key={i} delay={i * 100}>
                <div className={`relative rounded-2xl p-8 flex flex-col h-full transition-all duration-300 ${
                  plan.popular
                    ? "bg-gradient-to-br from-blue-700 to-cyan-600 dark:from-blue-600 dark:to-cyan-500 text-white shadow-2xl shadow-blue-500/25 scale-[1.04] ring-2 ring-cyan-300/50"
                    : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-700 hover:shadow-lg"
                }`}>
                  {plan.popular && (
                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-cyan-300 text-blue-900 text-xs font-bold px-4 py-1 rounded-full shadow-sm">
                      Legnépszerűbb
                    </span>
                  )}

                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                    plan.popular ? "bg-white/15" : "bg-blue-100 dark:bg-blue-900/30"
                  }`}>
                    <svg className={`w-6 h-6 ${plan.popular ? "text-cyan-300" : "text-blue-700 dark:text-cyan-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={plan.iconPath} />
                    </svg>
                  </div>

                  {/* Name */}
                  <div className="mb-1">
                    <h3 className={`font-bold text-xl ${plan.popular ? "text-white" : "text-gray-900 dark:text-white"}`}>
                      {plan.name}
                    </h3>
                    <p className={`text-xs font-medium ${plan.popular ? "text-white/50" : "text-gray-400"}`}>{plan.subtitle}</p>
                  </div>

                  {/* Price */}
                  <div className="mt-4 mb-2">
                    <span className={`text-4xl font-extrabold ${plan.popular ? "text-white" : "text-gray-900 dark:text-white"}`}>
                      {plan.price}
                    </span>
                    <span className={`text-sm ml-1.5 ${plan.popular ? "text-white/70" : "text-gray-400"}`}>{plan.period}</span>
                  </div>
                  <p className={`text-sm mb-6 ${plan.popular ? "text-white/70" : "text-gray-500 dark:text-gray-400"}`}>{plan.desc}</p>

                  {/* Features */}
                  <ul className="space-y-2.5 mb-4 flex-1">
                    {plan.features.map((f, j) => (
                      <li key={j} className="flex items-start gap-2.5 text-sm">
                        <svg className={`w-4 h-4 mt-0.5 shrink-0 ${plan.popular ? "text-cyan-300" : "text-blue-600 dark:text-cyan-400"}`} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className={plan.popular ? "text-white/90" : "text-gray-600 dark:text-gray-300"}>{f}</span>
                      </li>
                    ))}
                    {plan.limitations.map((l, j) => (
                      <li key={`lim-${j}`} className="flex items-start gap-2.5 text-sm">
                        <svg className={`w-4 h-4 mt-0.5 shrink-0 ${plan.popular ? "text-white/30" : "text-gray-300 dark:text-gray-600"}`} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        <span className={plan.popular ? "text-white/40" : "text-gray-400 dark:text-gray-500"}>{l}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <Link
                    href={plan.href}
                    className={`block text-center py-3.5 rounded-xl font-semibold text-sm transition mt-2 ${
                      plan.popular
                        ? "bg-white text-blue-700 hover:bg-gray-100 shadow-lg"
                        : "bg-blue-700 dark:bg-blue-600 hover:bg-blue-800 dark:hover:bg-blue-700 text-white"
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table Toggle */}
      <section className="pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <button
              onClick={() => setShowComparison(!showComparison)}
              className="inline-flex items-center gap-2 text-blue-700 dark:text-cyan-400 font-semibold text-sm hover:underline"
            >
              {showComparison ? "Összehasonlítás elrejtése" : "Részletes összehasonlítás megtekintése"}
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
                      <th className="text-left px-6 py-4 font-semibold text-gray-900 dark:text-white min-w-[200px]">Funkció</th>
                      <th className="px-4 py-4 font-semibold text-gray-900 dark:text-white text-center">Ingyenes</th>
                      <th className="px-4 py-4 font-semibold text-blue-700 dark:text-cyan-400 text-center bg-blue-50/50 dark:bg-blue-900/20">Alap</th>
                      <th className="px-4 py-4 font-semibold text-gray-900 dark:text-white text-center">Profi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonFeatures.map((f, i) => (
                      <tr key={i} className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50/50 dark:hover:bg-gray-700/30">
                        <td className="px-6 py-3 text-gray-700 dark:text-gray-300 font-medium">{f.name}</td>
                        {(["free", "basic", "pro"] as const).map((tier) => (
                          <td key={tier} className={`px-4 py-3 text-center ${tier === "basic" ? "bg-blue-50/50 dark:bg-blue-900/20" : ""}`}>
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
              <p className="text-blue-600 dark:text-cyan-400 font-semibold text-sm uppercase tracking-wider mb-3">GYIK</p>
              <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">Gyakran ismételt kérdések</h2>
            </div>
          </Reveal>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <Reveal key={i} delay={i * 60}>
                <details className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                  <summary className="flex items-center justify-between px-6 py-5 cursor-pointer list-none font-semibold text-gray-900 dark:text-white hover:text-blue-700 dark:hover:text-cyan-400 transition">
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
      <section className="py-20 bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-600 dark:from-blue-900 dark:via-blue-800 dark:to-cyan-800 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-20 w-72 h-72 bg-cyan-300 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-20 w-64 h-64 bg-white rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-3xl mx-auto px-4 text-center">
          <Reveal>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
              Kezdd el ingyen, kockázat nélkül
            </h2>
            <p className="text-white/70 text-lg mb-8">
              14 napos ingyenes próba a fizetős csomagokhoz. Bankkártya nem szükséges.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 bg-white text-blue-700 font-bold px-10 py-4 rounded-xl transition shadow-lg hover:bg-gray-100 text-lg"
              >
                Ingyenes regisztráció
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
