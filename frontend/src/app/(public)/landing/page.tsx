"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

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

/* -- Animated counter ---------------------------------------------------- */
function Counter({ end, suffix = "" }: { end: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          let start = 0;
          const step = Math.max(1, Math.floor(end / 40));
          const timer = setInterval(() => {
            start += step;
            if (start >= end) { setCount(end); clearInterval(timer); }
            else setCount(start);
          }, 30);
          observer.unobserve(el);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [end]);
  return <span ref={ref}>{count}{suffix}</span>;
}

/* ======================================================================== */
/*  LANDING PAGE                                                            */
/* ======================================================================== */
export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <StatsBar />
      <FeaturesSection />
      <HowItWorks />
      <PricingPreview />
      <TestimonialsSection />
      <FinalCTA />
      <Footer />
    </>
  );
}

/* -- 1. HERO ------------------------------------------------------------- */
function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-600 dark:from-blue-900 dark:via-blue-800 dark:to-cyan-800 min-h-[92vh] flex items-center">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-cyan-300 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-white rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-400 rounded-full blur-3xl opacity-30" />
      </div>
      <div className="absolute inset-0" style={{
        backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.07) 1px, transparent 0)",
        backgroundSize: "40px 40px",
      }} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-0">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left text */}
          <div>
            <Reveal>
              <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-1.5 rounded-full mb-6">
                <span className="w-2 h-2 bg-cyan-300 rounded-full animate-pulse" />
                <span className="text-white/90 text-sm font-medium">Magyar KKV-knak fejlesztve</span>
              </div>
            </Reveal>
            <Reveal delay={100}>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] mb-6">
                Szerződéskötés
                <br />
                <span className="text-cyan-300">egyszerűen,</span>
                <br />
                bárhonnan.
              </h1>
            </Reveal>
            <Reveal delay={200}>
              <p className="text-lg sm:text-xl text-white/80 mb-8 leading-relaxed max-w-xl">
                Digitális szerződéskezelés magyar kisvállalkozásoknak. Válassz sablont, töltsd ki, írd alá
                - mindezt online, papír nélkül, percek alatt.
              </p>
            </Reveal>
            <Reveal delay={300}>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 bg-white text-blue-700 font-bold px-8 py-4 rounded-xl transition shadow-lg shadow-black/10 text-base hover:bg-gray-100"
                >
                  Ingyenes regisztráció
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-semibold px-8 py-4 rounded-xl border border-white/20 transition text-base"
                >
                  Bejelentkezés
                </Link>
              </div>
            </Reveal>
            <Reveal delay={400}>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-8 text-white/60 text-sm">
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-cyan-300" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  Nem kell bankkártya
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-cyan-300" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  5 szerződés ingyen
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-cyan-300" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  30 mp-es regisztráció
                </span>
              </div>
            </Reveal>
          </div>

          {/* Right - floating contract mockup */}
          <Reveal delay={200} className="hidden lg:block">
            <div className="relative animate-float">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider">Szerződés</p>
                    <h3 className="font-bold text-gray-900 dark:text-white">Megbízási szerződés</h3>
                  </div>
                  <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold px-3 py-1 rounded-full">Aláírva</span>
                </div>
                <div className="space-y-3 mb-6">
                  <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full w-full" />
                  <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full w-4/5" />
                  <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full w-3/5" />
                  <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full w-5/6" />
                </div>
                <div className="border-t dark:border-gray-700 pt-5 flex items-center justify-between">
                  <div className="flex -space-x-2">
                    <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-white dark:ring-gray-800">NK</div>
                    <div className="w-9 h-9 rounded-full bg-cyan-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-white dark:ring-gray-800">BT</div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Aláírva</p>
                    <svg className="w-24 h-10 text-gray-800 dark:text-gray-200 animate-draw" viewBox="0 0 100 40" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 30 Q 15 5, 30 25 T 55 20 T 80 25 Q 90 28, 95 15" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 w-full h-full bg-blue-500/20 rounded-2xl -z-10 rotate-2" />
              <div className="absolute -top-8 -right-8 w-full h-full bg-cyan-500/10 rounded-2xl -z-20 rotate-4" />
              {/* Notification badge */}
              <div className="absolute -top-3 -left-3 bg-white dark:bg-gray-800 rounded-xl shadow-lg px-4 py-3 z-20 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-900 dark:text-white">Aláírás sikeres!</p>
                  <p className="text-xs text-gray-400">2 mp-el ezelőtt</p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* -- 2. STATS BAR -------------------------------------------------------- */
function StatsBar() {
  return (
    <section className="py-16 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
      <div className="max-w-5xl mx-auto px-4">
        <Reveal>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: 500, suffix: "+", label: "Elégedett ügyfél" },
              { value: 12000, suffix: "+", label: "Aláírt szerződés" },
              { value: 15, suffix: "+", label: "Kész sablon" },
              { value: 5, suffix: " perc", label: "Átlagos aláírási idő" },
            ].map((stat, i) => (
              <div key={i}>
                <p className="text-3xl sm:text-4xl font-extrabold text-blue-700 dark:text-cyan-400">
                  <Counter end={stat.value} suffix={stat.suffix} />
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* -- 3. FEATURES --------------------------------------------------------- */
const features = [
  {
    title: "Sablonok",
    desc: "15+ kész, jogász által ellenőrzött szerződéssablon: munkaszerződés, megbízási, NDA, bérleti, vállalkozási és még sok más.",
    iconPath: "M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z",
    color: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
  },
  {
    title: "E-aláírás",
    desc: "Kézírásos (rajzolt) és gépelt e-aláírás. Az aláíró emailben kapja a linket, mobilról is aláírhat, bárhonnan.",
    iconPath: "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z",
    color: "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400",
  },
  {
    title: "PDF generálás",
    desc: "Automatikus, professzionális PDF generálás egy kattintással. SHA-256 hash, audit trail, azonnali letöltés.",
    iconPath: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    color: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400",
  },
  {
    title: "Csapatkezelés",
    desc: "Hívd meg kollégáidat, adj szerepköröket. Admin, szerkesztő vagy megtekintő jogosultságok egy helyen.",
    iconPath: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
    color: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
  },
  {
    title: "API hozzáférés",
    desc: "REST API az integrációkhoz. Hozz létre szerződéseket, kérdezz le státuszokat a saját rendszeredből.",
    iconPath: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4",
    color: "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400",
  },
  {
    title: "Analitika",
    desc: "Kövesd nyomon a szerződéseidet: aláírási ráta, átlagos idő, lejáró szerződések. Vizuális dashboard.",
    iconPath: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    color: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
  },
];

function FeaturesSection() {
  return (
    <section id="funkciok" className="py-24 bg-gray-50 dark:bg-gray-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-blue-600 dark:text-cyan-400 font-semibold text-sm uppercase tracking-wider mb-3">Funkciók</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
              Minden, ami a szerződéskezeléshez kell
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              Egyetlen platformon a sablonválasztástól az aláírásig - papír nélkül, percek alatt.
            </p>
          </div>
        </Reveal>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <Reveal key={i} delay={i * 80}>
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-7 border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-700 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300 group h-full">
                <div className={`w-12 h-12 rounded-xl ${f.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={f.iconPath} />
                  </svg>
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-lg">{f.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -- 4. HOW IT WORKS ----------------------------------------------------- */
const steps = [
  {
    num: "01",
    title: "Válassz sablont",
    desc: "Böngészd a 15+ jogász által ellenőrzött magyar sablont, vagy töltsd fel a sajátodat. Munkajogi, B2B, ingatlan, IT - minden területre.",
    iconPath: "M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5z",
  },
  {
    num: "02",
    title: "Töltsd ki az adatokat",
    desc: "Add meg a feleket, összegeket, dátumokat. A rendszer automatikusan behelyettesíti a sablonba - nem kell kézzel szerkeszteni.",
    iconPath: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
  },
  {
    num: "03",
    title: "Írd alá digitálisan",
    desc: "Az aláírók emailben kapják a linket. Aláírhatnak mobilról is, rajzolt vagy gépelt aláírással. A PDF automatikusan elkészül.",
    iconPath: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  },
];

function HowItWorks() {
  return (
    <section id="hogyan-mukodik" className="py-24 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-blue-600 dark:text-cyan-400 font-semibold text-sm uppercase tracking-wider mb-3">Hogyan működik</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
              3 lépés a kész szerződésig
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-lg">Nincs bonyolult beállítás - regisztrálj, és már indulhatsz is.</p>
          </div>
        </Reveal>
        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, i) => (
            <Reveal key={i} delay={i * 150}>
              <div className="relative text-center group">
                {/* Connector line */}
                {i < 2 && (
                  <div className="hidden md:block absolute top-12 left-[60%] w-[80%] border-t-2 border-dashed border-blue-200 dark:border-blue-800" />
                )}
                <div className="w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-blue-700 to-cyan-600 dark:from-blue-600 dark:to-cyan-500 flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-shadow">
                  <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={step.iconPath} />
                  </svg>
                </div>
                <span className="text-xs font-bold text-blue-600 dark:text-cyan-400 uppercase tracking-widest">{step.num}. lépés</span>
                <h3 className="font-bold text-gray-900 dark:text-white text-xl mt-2 mb-3">{step.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed max-w-xs mx-auto">{step.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -- 5. PRICING PREVIEW -------------------------------------------------- */
const plans = [
  {
    name: "Ingyenes",
    price: "0",
    period: "Ft / hó",
    desc: "Egyéni vállalkozóknak, kipróbáláshoz.",
    features: ["5 szerződés / hó", "1 felhasználó", "100 MB tárolás", "Email értesítők", "Alap sablonok"],
    cta: "Regisztráció ingyen",
    popular: false,
  },
  {
    name: "Alap",
    price: "4 990",
    period: "Ft / hó",
    desc: "Kis csapatoknak, akik komolyan veszik.",
    features: ["30 szerződés / hó", "3 felhasználó", "1 GB tárolás", "API hozzáférés (100/nap)", "Analitika", "Csapatkezelés", "Egyéni branding"],
    cta: "Alap csomag választása",
    popular: true,
  },
  {
    name: "Profi",
    price: "14 990",
    period: "Ft / hó",
    desc: "Növekvő cégeknek, korlátok nélkül.",
    features: ["Korlátlan szerződés", "10 felhasználó", "5 GB tárolás", "Korlátlan API", "Webhookok", "Prioritásos támogatás", "AI elemzés"],
    cta: "Profi csomag választása",
    popular: false,
  },
];

function PricingPreview() {
  return (
    <section id="arak" className="py-24 bg-gray-50 dark:bg-gray-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-blue-600 dark:text-cyan-400 font-semibold text-sm uppercase tracking-wider mb-3">Árazás</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
              Átlátható árak, rejtett költségek nélkül
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-lg">Kezdd ingyen, fizess akkor, amikor a céged nő.</p>
          </div>
        </Reveal>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
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
                <h3 className={`font-bold text-lg ${plan.popular ? "text-white" : "text-gray-900 dark:text-white"}`}>{plan.name}</h3>
                <div className="mt-3 mb-2">
                  <span className={`text-4xl font-extrabold ${plan.popular ? "text-white" : "text-gray-900 dark:text-white"}`}>{plan.price}</span>
                  <span className={`text-sm ml-1.5 ${plan.popular ? "text-white/70" : "text-gray-400"}`}>{plan.period}</span>
                </div>
                <p className={`text-sm mb-6 ${plan.popular ? "text-white/70" : "text-gray-500 dark:text-gray-400"}`}>{plan.desc}</p>
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-2.5 text-sm">
                      <svg className={`w-4 h-4 mt-0.5 shrink-0 ${plan.popular ? "text-cyan-300" : "text-blue-600 dark:text-cyan-400"}`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className={plan.popular ? "text-white/90" : "text-gray-600 dark:text-gray-300"}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.popular ? "/pricing" : "/register"}
                  className={`block text-center py-3.5 rounded-xl font-semibold text-sm transition ${
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
        <Reveal delay={400}>
          <div className="text-center mt-10">
            <Link href="/pricing" className="inline-flex items-center gap-1.5 text-blue-600 dark:text-cyan-400 font-semibold text-sm hover:underline">
              Részletes összehasonlítás
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* -- 6. TESTIMONIALS ----------------------------------------------------- */
const testimonials = [
  {
    quote: "Korábban napokat vett igénybe egy-egy szerződés. A SzerződésPortállal 10 perc alatt kész vagyunk, és az ügyfelek is egyszerűen aláírják mobilról.",
    name: "Kovács Márta",
    role: "Ügyvezető, DigitalFlow Kft.",
    initials: "KM",
  },
  {
    quote: "Az audit napló és a jogász által ellenőrzött sablonok nyugalmat adnak. Végre nem kell azon aggódnunk, hogy valami hiányzik a szerződésből.",
    name: "Tóth Balázs",
    role: "Pénzügyi vezető, BuildTech Zrt.",
    initials: "TB",
  },
  {
    quote: "A csapatkezelés funkció fantasztikus. 8 munkatársamat vettem fel, mindenki a saját jogosultsági szintjén dolgozik. Átlátható és biztonságos.",
    name: "Szabó Andrea",
    role: "HR vezető, GreenLogistics Kft.",
    initials: "SzA",
  },
];

function TestimonialsSection() {
  return (
    <section id="velemenyek" className="py-24 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-blue-600 dark:text-cyan-400 font-semibold text-sm uppercase tracking-wider mb-3">Vélemények</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
              Amit ügyfeleink mondanak
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-lg">Valódi visszajelzések magyar vállalkozásoktól.</p>
          </div>
        </Reveal>
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <Reveal key={i} delay={i * 100}>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-8 border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-700 transition-all h-full flex flex-col">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <svg key={j} className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6 flex-1 text-[15px]">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-700 to-cyan-600 flex items-center justify-center text-white text-sm font-bold">
                    {t.initials}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{t.name}</p>
                    <p className="text-gray-400 text-xs">{t.role}</p>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -- 7. FINAL CTA -------------------------------------------------------- */
function FinalCTA() {
  return (
    <section className="py-24 bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-600 dark:from-blue-900 dark:via-blue-800 dark:to-cyan-800 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 right-20 w-72 h-72 bg-cyan-300 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-20 w-96 h-96 bg-white rounded-full blur-3xl" />
      </div>
      <div className="relative max-w-3xl mx-auto px-4 text-center">
        <Reveal>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-4">
            Kezdd el ingyen,
            <br />
            <span className="text-cyan-300">frissíts, amikor kell.</span>
          </h2>
        </Reveal>
        <Reveal delay={100}>
          <p className="text-white/70 text-lg mb-10 max-w-xl mx-auto">
            Csatlakozz a 500+ magyar vállalkozáshoz, akik már papír nélkül szerződnek.
          </p>
        </Reveal>
        <Reveal delay={200}>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 bg-white text-blue-700 font-bold px-10 py-4 rounded-xl transition shadow-lg hover:bg-gray-100 text-lg"
            >
              Ingyenes regisztráció
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </Link>
          </div>
        </Reveal>
        <Reveal delay={300}>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-white/50 text-sm">
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-cyan-300" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
              Nem kell bankkártya
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-cyan-300" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
              5 szerződés ingyen
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-cyan-300" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
              Azonnali hozzáférés
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* -- 8. FOOTER ----------------------------------------------------------- */
function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-5">
              <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-xs">SZ</span>
              </div>
              <span className="text-white font-bold">SzerződésPortál</span>
            </div>
            <p className="text-sm leading-relaxed">A magyar KKV-k szerződéskezelő platformja. Ptk.-conform sablonok, e-aláírás, egy helyen.</p>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4">Termék</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/landing#funkciok" className="hover:text-white transition">Funkciók</Link></li>
              <li><Link href="/pricing" className="hover:text-white transition">Árazás</Link></li>
              <li><Link href="/landing#sablonok" className="hover:text-white transition">Sablonok</Link></li>
              <li><Link href="/blog" className="hover:text-white transition">Blog</Link></li>
              <li><Link href="/portal" className="hover:text-white transition">Ügyfélportál</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4">Jogi</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/adatvedelem" className="hover:text-white transition">Adatvédelmi tájékoztató</Link></li>
              <li><Link href="/aszf" className="hover:text-white transition">ÁSZF</Link></li>
              <li><Link href="/cookie" className="hover:text-white transition">Cookie szabályzat</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4">Kapcsolat</h3>
            <ul className="space-y-2.5 text-sm">
              <li><a href="mailto:hello@szerzodes.cegverzum.hu" className="hover:text-white transition">hello@szerzodes.cegverzum.hu</a></li>
              <li><span>Budapest, Magyarország</span></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm">
            &copy; {new Date().getFullYear()} SzerződésPortál. Minden jog fenntartva.
          </p>
          <p className="text-xs text-gray-500">
            A platform nem helyettesíti a jogi tanácsadást.
          </p>
        </div>
      </div>
    </footer>
  );
}
