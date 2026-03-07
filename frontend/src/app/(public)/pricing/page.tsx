"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";

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

const plans = [
  {
    name: "Ingyenes",
    price: { monthly: "0", yearly: "0" },
    period: "Ft / hó",
    desc: "Egyéni vállalkozóknak, kipróbáláshoz.",
    features: [
      "5 szerződés / hó",
      "1 felhasználó",
      "Alap sablonok",
      "Egyszerű e-aláírás",
      "Email értesítések",
    ],
    limitations: [
      "Nincs egyéni sablon",
      "Nincs csapatkezelés",
      "Nincs API hozzáférés",
    ],
    cta: "Regisztráció ingyen",
    popular: false,
    icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  {
    name: "Kezdő",
    price: { monthly: "2 990", yearly: "2 490" },
    period: "Ft / hó",
    desc: "Kis csapatoknak, akik komolyan veszik.",
    features: [
      "30 szerződés / hó",
      "3 felhasználó",
      "Összes sablon",
      "Egyéni sablonok",
      "Emlékeztetők",
      "Számlázz.hu integráció",
      "Email + in-app értesítések",
    ],
    limitations: [
      "Nincs AI elemzés",
      "Nincs webhook",
    ],
    cta: "Kezdés 14 napos triallal",
    popular: false,
    icon: "M13 10V3L4 14h7v7l9-11h-7z",
  },
  {
    name: "Profi",
    price: { monthly: "9 990", yearly: "7 990" },
    period: "Ft / hó",
    desc: "Növekvő cégeknek, korlátok nélkül.",
    features: [
      "Korlátlan szerződés",
      "10 felhasználó",
      "Minősített aláírás (QES)",
      "AI szerződéselemzés",
      "Analytics dashboard",
      "Webhook integráció",
      "Dedikált támogatás",
      "Prioritásos ügyfélszolgálat",
      "Egyéni arculat (branding)",
    ],
    limitations: [],
    cta: "Profi csomag választása",
    popular: true,
    icon: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z",
  },
  {
    name: "Nagyvállalati",
    price: { monthly: "Egyedi", yearly: "Egyedi" },
    period: "",
    desc: "Enterprise igényekre szabva.",
    features: [
      "Korlátlan minden",
      "SSO (SAML/OIDC)",
      "Dedikált account manager",
      "SLA garancia (99.9%)",
      "White-label megoldás",
      "On-premise lehetőség",
      "Custom integrációk",
      "GDPR audit támogatás",
      "Oktatás és bevezetés",
    ],
    limitations: [],
    cta: "Kapcsolatfelvétel",
    popular: false,
    icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
  },
];

const comparisonFeatures = [
  { name: "Szerződések / hó", free: "5", starter: "30", pro: "Korlátlan", enterprise: "Korlátlan" },
  { name: "Felhasználók", free: "1", starter: "3", pro: "10", enterprise: "Korlátlan" },
  { name: "Alap sablonok", free: true, starter: true, pro: true, enterprise: true },
  { name: "Egyéni sablonok", free: false, starter: true, pro: true, enterprise: true },
  { name: "Digitális aláírás", free: true, starter: true, pro: true, enterprise: true },
  { name: "Minősített aláírás (QES)", free: false, starter: false, pro: true, enterprise: true },
  { name: "PDF generálás", free: true, starter: true, pro: true, enterprise: true },
  { name: "Email értesítések", free: true, starter: true, pro: true, enterprise: true },
  { name: "In-app értesítések", free: false, starter: true, pro: true, enterprise: true },
  { name: "Emlékeztetők", free: false, starter: true, pro: true, enterprise: true },
  { name: "Csapatkezelés", free: false, starter: true, pro: true, enterprise: true },
  { name: "AI elemzés", free: false, starter: false, pro: true, enterprise: true },
  { name: "Analytics dashboard", free: false, starter: false, pro: true, enterprise: true },
  { name: "Webhook integráció", free: false, starter: false, pro: true, enterprise: true },
  { name: "API hozzáférés", free: false, starter: false, pro: true, enterprise: true },
  { name: "Egyéni arculat", free: false, starter: false, pro: true, enterprise: true },
  { name: "SSO (SAML/OIDC)", free: false, starter: false, pro: false, enterprise: true },
  { name: "SLA garancia", free: false, starter: false, pro: false, enterprise: true },
  { name: "White-label", free: false, starter: false, pro: false, enterprise: true },
  { name: "On-premise", free: false, starter: false, pro: false, enterprise: true },
  { name: "Támogatás", free: "Email", starter: "Email", pro: "Prioritásos", enterprise: "Dedikált AM" },
];

const faqs = [
  { q: "Bármikor válthatom a csomagot?", a: "Igen! Bármikor frissíthetsz magasabb csomagra, és a különbözetet arányosan számoljuk. Visszaváltás esetén a következő számlázási ciklustól érvényes a változás." },
  { q: "Mi történik, ha elfogy a havi keretem?", a: "Az ingyenes és Kezdő csomagoknál a havi limit elérésekor nem hozhatsz létre új szerződést, de a meglévőidet továbbra is kezelheted. A Profi csomagban nincs limit." },
  { q: "Van-e próbaidő?", a: "Igen! A Kezdő és Profi csomagokhoz 14 napos ingyenes próbaidő jár, bankkártya megadása nélkül." },
  { q: "Milyen fizetési módokat fogadtok el?", a: "Bankkártyás fizetést (Visa, Mastercard) Stripe-on keresztül, valamint banki átutalást éves fizetés esetén." },
  { q: "Kaphatok számlát?", a: "Igen, minden fizetésről automatikus e-számlát állítunk ki a Számlázz.hu rendszeren keresztül." },
  { q: "Mi a visszatérítési politika?", a: "Ha nem vagy elégedett, az első 30 napon belül teljes visszatérítést biztosítunk, kérdés nélkül." },
];

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  return (
    <div>
      {/* Hero */}
      <section className="pt-20 pb-12 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Reveal>
            <p className="text-brand-teal font-semibold text-sm uppercase tracking-wider mb-3">Árazás</p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4">
              Átlátható árak,<br />
              <span className="text-brand-teal-dark">rejtett költségek nélkül</span>
            </h1>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto mb-8">
              Kezdd ingyen, fizess akkor, amikor a céged nő. Éves fizetésnél akár 20%-ot spórolhatsz.
            </p>
          </Reveal>

          {/* Billing toggle */}
          <Reveal delay={100}>
            <div className="inline-flex items-center gap-3 bg-gray-100 rounded-full p-1 mb-12">
              <button
                onClick={() => setAnnual(false)}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition ${
                  !annual ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
                }`}
              >
                Havi
              </button>
              <button
                onClick={() => setAnnual(true)}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition ${
                  annual ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
                }`}
              >
                Éves
                <span className="ml-1.5 text-xs text-green-600 font-bold">-20%</span>
              </button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Plans */}
      <section className="pb-20 -mt-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {plans.map((plan, i) => (
              <Reveal key={i} delay={i * 80}>
                <div className={`relative rounded-2xl p-7 flex flex-col h-full transition-all duration-300 ${
                  plan.popular
                    ? "bg-brand-teal-dark text-white shadow-2xl shadow-brand-teal-dark/30 scale-[1.03] ring-2 ring-brand-gold"
                    : "bg-white border border-gray-200 hover:border-brand-teal/30 hover:shadow-lg"
                }`}>
                  {plan.popular && (
                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-brand-gold text-white text-xs font-bold px-4 py-1 rounded-full shadow-sm">
                      Legnépszerűbb
                    </span>
                  )}

                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                    plan.popular ? "bg-white/15" : "bg-brand-teal/10"
                  }`}>
                    <svg className={`w-6 h-6 ${plan.popular ? "text-brand-gold" : "text-brand-teal-dark"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={plan.icon} />
                    </svg>
                  </div>

                  <h3 className={`font-bold text-lg ${plan.popular ? "text-white" : "text-gray-900"}`}>{plan.name}</h3>
                  <div className="mt-3 mb-2">
                    <span className={`text-3xl font-extrabold ${plan.popular ? "text-white" : "text-gray-900"}`}>
                      {typeof plan.price === "object" ? (annual ? plan.price.yearly : plan.price.monthly) : plan.price}
                    </span>
                    {plan.period && (
                      <span className={`text-sm ml-1 ${plan.popular ? "text-white/70" : "text-gray-400"}`}>{plan.period}</span>
                    )}
                  </div>
                  {annual && plan.price.monthly !== "Egyedi" && plan.price.monthly !== "0" && (
                    <p className={`text-xs mb-2 ${plan.popular ? "text-white/60" : "text-gray-400"}`}>
                      <span className="line-through">{plan.price.monthly} Ft/hó</span>
                    </p>
                  )}
                  <p className={`text-sm mb-6 ${plan.popular ? "text-white/70" : "text-gray-500"}`}>{plan.desc}</p>

                  <ul className="space-y-2.5 mb-4 flex-1">
                    {plan.features.map((f, j) => (
                      <li key={j} className="flex items-start gap-2.5 text-sm">
                        <svg className={`w-4 h-4 mt-0.5 shrink-0 ${plan.popular ? "text-brand-gold" : "text-brand-teal"}`} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className={plan.popular ? "text-white/90" : "text-gray-600"}>{f}</span>
                      </li>
                    ))}
                    {plan.limitations.map((l, j) => (
                      <li key={`lim-${j}`} className="flex items-start gap-2.5 text-sm">
                        <svg className={`w-4 h-4 mt-0.5 shrink-0 ${plan.popular ? "text-white/30" : "text-gray-300"}`} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        <span className={plan.popular ? "text-white/40" : "text-gray-400"}>{l}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={plan.name === "Nagyvállalati" ? "mailto:hello@szerzodes.cegverzum.hu" : "/register"}
                    className={`block text-center py-3 rounded-xl font-semibold text-sm transition ${
                      plan.popular
                        ? "bg-brand-gold hover:bg-brand-gold-dark text-white shadow-lg shadow-brand-gold/30"
                        : "bg-brand-teal-dark hover:bg-brand-teal-darker text-white"
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <button
              onClick={() => setShowComparison(!showComparison)}
              className="inline-flex items-center gap-2 text-brand-teal-dark font-semibold text-sm hover:underline"
            >
              {showComparison ? "Összehasonlítás elrejtése" : "Részletes összehasonlítás"}
              <svg className={`w-4 h-4 transition-transform ${showComparison ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {showComparison && (
            <Reveal>
              <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left px-6 py-4 font-semibold text-gray-900 min-w-[200px]">Funkció</th>
                      <th className="px-4 py-4 font-semibold text-gray-900 text-center">Ingyenes</th>
                      <th className="px-4 py-4 font-semibold text-gray-900 text-center">Kezdő</th>
                      <th className="px-4 py-4 font-semibold text-brand-teal-dark text-center bg-brand-teal/5">Profi</th>
                      <th className="px-4 py-4 font-semibold text-gray-900 text-center">Nagyvállalati</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonFeatures.map((f, i) => (
                      <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
                        <td className="px-6 py-3 text-gray-700 font-medium">{f.name}</td>
                        {(["free", "starter", "pro", "enterprise"] as const).map((tier) => (
                          <td key={tier} className={`px-4 py-3 text-center ${tier === "pro" ? "bg-brand-teal/5" : ""}`}>
                            {typeof f[tier] === "boolean" ? (
                              f[tier] ? (
                                <svg className="w-5 h-5 text-green-500 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              ) : (
                                <svg className="w-5 h-5 text-gray-300 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              )
                            ) : (
                              <span className="text-gray-600 text-xs font-medium">{f[tier]}</span>
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
      <section className="py-20 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center mb-12">
              <p className="text-brand-teal font-semibold text-sm uppercase tracking-wider mb-3">GYIK</p>
              <h2 className="text-3xl font-extrabold text-gray-900">Árazással kapcsolatos kérdések</h2>
            </div>
          </Reveal>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <Reveal key={i} delay={i * 60}>
                <details className="group bg-white rounded-xl border border-gray-100 overflow-hidden">
                  <summary className="flex items-center justify-between px-6 py-5 cursor-pointer list-none font-semibold text-gray-900 hover:text-brand-teal-dark transition">
                    {faq.q}
                    <svg className="w-5 h-5 text-gray-400 group-open:rotate-45 transition-transform shrink-0 ml-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </summary>
                  <div className="px-6 pb-5 text-gray-600 text-sm leading-relaxed">
                    {faq.a}
                  </div>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-brand-teal-dark via-brand-teal to-brand-teal-muted relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-20 w-72 h-72 bg-brand-gold rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-3xl mx-auto px-4 text-center">
          <Reveal>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
              Kezdd el ingyen, kockázat nélkül
            </h2>
            <p className="text-white/70 text-lg mb-8">
              14 napos ingyenes próba, bankkártya nélkül.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-brand-gold hover:bg-brand-gold-dark text-white font-bold px-10 py-4 rounded-xl transition shadow-lg shadow-brand-gold/30 text-lg"
            >
              Ingyenes kezdés
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
