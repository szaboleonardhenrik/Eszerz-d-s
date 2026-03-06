"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ABTestProvider, ABVariant } from "@/components/ab-test";

/* ── Reveal on scroll ─────────────────────────────────────────────── */
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

/* ── Animated counter ─────────────────────────────────────────────── */
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

/* ══════════════════════════════════════════════════════════════════ */
/*  LANDING PAGE                                                      */
/* ══════════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  return (
    <ABTestProvider>
      <ABVariant variant="A">
        <HeroSection />
      </ABVariant>
      <ABVariant variant="B">
        <HeroSectionB />
      </ABVariant>
      <LogoBar />
      <StatsBar />
      <FeaturesSection />
      <HowItWorks />
      <TemplatesSection />
      <TestimonialsSection />
      <PricingSection />
      <FAQSection />
      <FinalCTA />
    </ABTestProvider>
  );
}

/* ── 1. HERO ──────────────────────────────────────────────────────── */
function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-teal-dark via-brand-teal to-brand-teal-muted min-h-[90vh] flex items-center">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-brand-gold rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-white rounded-full blur-3xl" />
      </div>
      <div className="absolute inset-0" style={{
        backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.08) 1px, transparent 0)",
        backgroundSize: "40px 40px",
      }} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-0">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left text */}
          <div>
            <Reveal>
              <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-1.5 rounded-full mb-6">
                <span className="w-2 h-2 bg-brand-gold rounded-full animate-pulse" />
                <span className="text-white/90 text-sm font-medium">Több mint 500+ elégedett ügyfél</span>
              </div>
            </Reveal>
            <Reveal delay={100}>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] mb-6">
                Szerződéskötés
                <br />
                <span className="text-brand-gold">percek alatt,</span>
                <br />
                bárhonnan.
              </h1>
            </Reveal>
            <Reveal delay={200}>
              <p className="text-lg text-white/80 mb-8 leading-relaxed max-w-xl">
                Magyar KKV-knak tervezett platform. Ptk.-conform sablonok, digitális aláírás,
                automatikus PDF — egyetlen helyen, papír nélkül.
              </p>
            </Reveal>
            <Reveal delay={300}>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 bg-brand-gold hover:bg-brand-gold-dark text-white font-semibold px-8 py-4 rounded-xl transition shadow-lg shadow-brand-gold/30 text-base"
                >
                  Ingyenes regisztráció
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                </Link>
                <Link
                  href="/landing#hogyan-mukodik"
                  className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-semibold px-8 py-4 rounded-xl border border-white/20 transition text-base"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Hogyan működik?
                </Link>
              </div>
            </Reveal>
            <Reveal delay={400}>
              <div className="flex items-center gap-6 mt-8 text-white/60 text-sm">
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-brand-gold" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  Nem kell bankkártya
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-brand-gold" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  5 szerződés ingyen
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-brand-gold" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  30 mp-es regisztráció
                </span>
              </div>
            </Reveal>
          </div>

          {/* Right — floating contract mockup */}
          <Reveal delay={200} className="hidden lg:block">
            <div className="relative animate-float">
              {/* Main card */}
              <div className="bg-white rounded-2xl shadow-2xl p-8 relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider">Szerződés</p>
                    <h3 className="font-bold text-gray-900">Megbízási szerződés</h3>
                  </div>
                  <span className="bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full">Aláírva</span>
                </div>
                <div className="space-y-3 mb-6">
                  <div className="h-3 bg-gray-100 rounded-full w-full" />
                  <div className="h-3 bg-gray-100 rounded-full w-4/5" />
                  <div className="h-3 bg-gray-100 rounded-full w-3/5" />
                </div>
                <div className="border-t pt-5 flex items-center justify-between">
                  <div className="flex -space-x-2">
                    <div className="w-9 h-9 rounded-full bg-brand-teal flex items-center justify-center text-white text-xs font-bold ring-2 ring-white">NK</div>
                    <div className="w-9 h-9 rounded-full bg-brand-gold flex items-center justify-center text-white text-xs font-bold ring-2 ring-white">BT</div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Aláírva</p>
                    <svg className="w-24 h-10 text-gray-800 animate-draw" viewBox="0 0 100 40" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 30 Q 15 5, 30 25 T 55 20 T 80 25 Q 90 28, 95 15" />
                    </svg>
                  </div>
                </div>
              </div>
              {/* Background cards */}
              <div className="absolute -top-4 -right-4 w-full h-full bg-brand-teal/20 rounded-2xl -z-10 rotate-2" />
              <div className="absolute -top-8 -right-8 w-full h-full bg-brand-gold/10 rounded-2xl -z-20 rotate-4" />
              {/* Notification badge */}
              <div className="absolute -top-3 -left-3 bg-white rounded-xl shadow-lg px-4 py-3 z-20 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-900">Aláírás sikeres!</p>
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

/* ── 1B. HERO (Variant B) ─────────────────────────────────────────── */
function HeroSectionB() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-teal-dark via-brand-teal to-brand-teal-muted min-h-[90vh] flex items-center">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-brand-gold rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-white rounded-full blur-3xl" />
      </div>
      <div className="absolute inset-0" style={{
        backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.08) 1px, transparent 0)",
        backgroundSize: "40px 40px",
      }} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-0">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left text */}
          <div>
            <Reveal>
              <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-1.5 rounded-full mb-6">
                <span className="w-2 h-2 bg-brand-gold rounded-full animate-pulse" />
                <span className="text-white/90 text-sm font-medium">Több mint 500+ elégedett ügyfél</span>
              </div>
            </Reveal>
            <Reveal delay={100}>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] mb-6">
                Digitális
                <br />
                <span className="text-brand-gold">szerződéskötés</span>
                <br />
                5 perc alatt
              </h1>
            </Reveal>
            <Reveal delay={200}>
              <p className="text-lg text-white/80 mb-8 leading-relaxed max-w-xl">
                Nincs több papírmunka. Készítsen, küldjön és írjon alá szerződéseket online — bárhonnan, bármikor.
              </p>
            </Reveal>
            <Reveal delay={300}>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 bg-brand-gold hover:bg-brand-gold-dark text-white font-semibold px-8 py-4 rounded-xl transition shadow-lg shadow-brand-gold/30 text-base"
                >
                  Kezdje el ingyen
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                </Link>
                <Link
                  href="/landing#hogyan-mukodik"
                  className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-semibold px-8 py-4 rounded-xl border border-white/20 transition text-base"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Hogyan működik?
                </Link>
              </div>
            </Reveal>
            <Reveal delay={400}>
              <div className="flex items-center gap-6 mt-8 text-white/60 text-sm">
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-brand-gold" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  Nem kell bankkártya
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-brand-gold" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  5 szerződés ingyen
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-brand-gold" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  30 mp-es regisztráció
                </span>
              </div>
            </Reveal>
          </div>

          {/* Right — floating contract mockup */}
          <Reveal delay={200} className="hidden lg:block">
            <div className="relative animate-float">
              {/* Main card */}
              <div className="bg-white rounded-2xl shadow-2xl p-8 relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider">Szerződés</p>
                    <h3 className="font-bold text-gray-900">Megbízási szerződés</h3>
                  </div>
                  <span className="bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full">Aláírva</span>
                </div>
                <div className="space-y-3 mb-6">
                  <div className="h-3 bg-gray-100 rounded-full w-full" />
                  <div className="h-3 bg-gray-100 rounded-full w-4/5" />
                  <div className="h-3 bg-gray-100 rounded-full w-3/5" />
                </div>
                <div className="border-t pt-5 flex items-center justify-between">
                  <div className="flex -space-x-2">
                    <div className="w-9 h-9 rounded-full bg-brand-teal flex items-center justify-center text-white text-xs font-bold ring-2 ring-white">NK</div>
                    <div className="w-9 h-9 rounded-full bg-brand-gold flex items-center justify-center text-white text-xs font-bold ring-2 ring-white">BT</div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Aláírva</p>
                    <svg className="w-24 h-10 text-gray-800 animate-draw" viewBox="0 0 100 40" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 30 Q 15 5, 30 25 T 55 20 T 80 25 Q 90 28, 95 15" />
                    </svg>
                  </div>
                </div>
              </div>
              {/* Background cards */}
              <div className="absolute -top-4 -right-4 w-full h-full bg-brand-teal/20 rounded-2xl -z-10 rotate-2" />
              <div className="absolute -top-8 -right-8 w-full h-full bg-brand-gold/10 rounded-2xl -z-20 rotate-4" />
              {/* Notification badge */}
              <div className="absolute -top-3 -left-3 bg-white rounded-xl shadow-lg px-4 py-3 z-20 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-900">Aláírás sikeres!</p>
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

/* ── 2. LOGO BAR ──────────────────────────────────────────────────── */
function LogoBar() {
  const logos = [
    "MagyarTelekom", "OTP Bank", "MOL Csoport", "Richter Gedeon", "Wáberer's", "Bookline",
    "MagyarTelekom", "OTP Bank", "MOL Csoport", "Richter Gedeon", "Wáberer's", "Bookline",
  ];
  return (
    <section className="py-10 border-b bg-gray-50/50 overflow-hidden">
      <p className="text-center text-xs uppercase tracking-widest text-gray-400 font-semibold mb-6">
        Ők már digitálisan szerződnek
      </p>
      <div className="relative">
        <div className="flex gap-16 animate-marquee whitespace-nowrap">
          {logos.map((name, i) => (
            <span key={i} className="text-gray-300 font-bold text-xl tracking-wider">{name}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── 3. STATS BAR ─────────────────────────────────────────────────── */
function StatsBar() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-5xl mx-auto px-4">
        <Reveal>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: 500, suffix: "+", label: "Elégedett ügyfél" },
              { value: 12000, suffix: "+", label: "Aláírt szerződés" },
              { value: 99, suffix: "%", label: "Ügyfélelégedettség" },
              { value: 5, suffix: " perc", label: "Átlagos aláírási idő" },
            ].map((stat, i) => (
              <div key={i}>
                <p className="text-3xl sm:text-4xl font-extrabold text-brand-teal-dark">
                  <Counter end={stat.value} suffix={stat.suffix} />
                </p>
                <p className="text-sm text-gray-500 mt-1 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ── 4. FEATURES ──────────────────────────────────────────────────── */
const features = [
  {
    icon: "M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z",
    title: "15+ jogi sablon",
    desc: "Ptk.-conform sablonok: munkaszerződés, megbízási, NDA, bérleti, vállalkozási. Jogász által ellenőrizve.",
    color: "bg-brand-teal/10 text-brand-teal-dark",
  },
  {
    icon: "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z",
    title: "Digitális aláírás",
    desc: "Rajzolt, gépelt vagy minősített e-aláírás. DÁP és Microsec támogatás. Jogilag érvényes.",
    color: "bg-brand-gold/10 text-brand-gold-dark",
  },
  {
    icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    title: "Automatikus PDF",
    desc: "Egy kattintás, és a szerződés készen áll PDF-ben. SHA-256 hash, audit trail, letöltés.",
    color: "bg-brand-teal-muted/10 text-brand-teal-muted",
  },
  {
    icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
    title: "Csapatkezelés",
    desc: "Hívd meg kollégáidat, adj szerepköröket. Admin, szerkesztő, megtekintő jogosultságok.",
    color: "bg-brand-teal/10 text-brand-teal-dark",
  },
  {
    icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
    title: "Biztonság",
    desc: "End-to-end titkosítás, GDPR-megfelelőség, EU szerveren tárolt adatok. Teljes audit napló.",
    color: "bg-brand-gold/10 text-brand-gold-dark",
  },
  {
    icon: "M13 10V3L4 14h7v7l9-11h-7z",
    title: "Automatizálás",
    desc: "Emlékeztetők, lejáratkezelés, csapat értesítések. Nem kell kézzel nyomon követni semmit.",
    color: "bg-brand-teal-muted/10 text-brand-teal-muted",
  },
];

function FeaturesSection() {
  return (
    <section id="funkciok" className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-brand-gold font-semibold text-sm uppercase tracking-wider mb-3">Funkciók</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
              Minden, ami a szerződéskezeléshez kell
            </h2>
            <p className="text-gray-500 text-lg">
              Egyetlen platformon a sablonválasztástól az aláírásig — papír nélkül, percek alatt.
            </p>
          </div>
        </Reveal>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <Reveal key={i} delay={i * 80}>
              <div className="bg-white rounded-2xl p-7 border border-gray-100 hover:border-brand-teal/30 hover:shadow-lg hover:shadow-brand-teal/5 transition-all duration-300 group h-full">
                <div className={`w-12 h-12 rounded-xl ${f.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={f.icon} />
                  </svg>
                </div>
                <h3 className="font-bold text-gray-900 mb-2 text-lg">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── 5. HOW IT WORKS ──────────────────────────────────────────────── */
const steps = [
  { num: "01", title: "Válassz sablont", desc: "Böngészd a 15+ jogász által ellenőrzött magyar sablont, vagy töltsd fel a sajátodat.", icon: "M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5z" },
  { num: "02", title: "Töltsd ki", desc: "Add meg a feleket, összegeket és részleteket. A rendszer automatikusan behelyettesíti.", icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" },
  { num: "03", title: "Küld aláírásra", desc: "Az aláírók emailben kapják a linket. Aláírhatnak mobilról is, bárhonnan.", icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
  { num: "04", title: "Kész!", desc: "Az aláírt PDF automatikusan generálódik. Letölthető, audit naplóval.", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
];

function HowItWorks() {
  return (
    <section id="hogyan-mukodik" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-brand-teal font-semibold text-sm uppercase tracking-wider mb-3">Hogyan működik</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
              4 lépés a kész szerződésig
            </h2>
            <p className="text-gray-500 text-lg">Nincs bonyolult beállítás — regisztrálj, és már indulhatsz is.</p>
          </div>
        </Reveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <Reveal key={i} delay={i * 120}>
              <div className="relative text-center group">
                {/* Connector line */}
                {i < 3 && (
                  <div className="hidden lg:block absolute top-10 left-[60%] w-[80%] border-t-2 border-dashed border-brand-teal/20" />
                )}
                <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-brand-teal-dark to-brand-teal flex items-center justify-center mb-5 shadow-lg shadow-brand-teal/20 group-hover:shadow-brand-teal/40 transition-shadow">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={step.icon} />
                  </svg>
                </div>
                <span className="text-xs font-bold text-brand-gold uppercase tracking-widest">{step.num}. lépés</span>
                <h3 className="font-bold text-gray-900 text-lg mt-2 mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── 6. TEMPLATES ─────────────────────────────────────────────────── */
const templates = [
  { name: "Munkaszerződés", cat: "Munkajogi", catColor: "bg-brand-teal/10 text-brand-teal-dark", desc: "Határozatlan és határozott idejű munkaszerződés a Mt. alapján." },
  { name: "Megbízási szerződés", cat: "B2B", catColor: "bg-brand-gold/10 text-brand-gold-dark", desc: "Ptk. 6:272. § szerinti megbízási szerződés vállalkozásoknak." },
  { name: "Titoktartási nyilatkozat (NDA)", cat: "B2B", catColor: "bg-brand-gold/10 text-brand-gold-dark", desc: "Kétoldalú NDA üzleti tárgyalásokhoz és partnerségekhez." },
  { name: "Lakásbérleti szerződés", cat: "Ingatlan", catColor: "bg-brand-teal-muted/10 text-brand-teal-muted", desc: "Részletes bérleti szerződés lakóingatlanokra." },
  { name: "ÁSZF (webshop)", cat: "Fogyasztói", catColor: "bg-purple-100 text-purple-700", desc: "Eker. tv.-nek megfelelő általános szerződési feltételek webshopokhoz." },
  { name: "Szoftverfejlesztési szerződés", cat: "IT", catColor: "bg-blue-100 text-blue-700", desc: "Egyedi szoftverfejlesztésre, mérföldkövekkel és IP átadással." },
];

function TemplatesSection() {
  return (
    <section id="sablonok" className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-brand-gold font-semibold text-sm uppercase tracking-wider mb-3">Sablonok</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
              Jogász által ellenőrzött sablonok
            </h2>
            <p className="text-gray-500 text-lg">Nem kell ügyvédre várnod. Válaszd ki a sablont, töltsd ki, és kész.</p>
          </div>
        </Reveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {templates.map((t, i) => (
            <Reveal key={i} delay={i * 80}>
              <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:border-brand-teal/30 hover:shadow-lg transition-all duration-300 group">
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${t.catColor}`}>{t.cat}</span>
                  <svg className="w-5 h-5 text-gray-300 group-hover:text-brand-teal transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{t.name}</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-4">{t.desc}</p>
                <Link
                  href="/register"
                  className="inline-flex items-center text-sm font-semibold text-brand-teal-dark hover:text-brand-teal transition"
                >
                  Használom
                  <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                </Link>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── 7. TESTIMONIALS ──────────────────────────────────────────────── */
const testimonials = [
  {
    quote: "Korábban napokat vett igénybe egy-egy szerződés. A SzerződésPortállal 10 perc alatt kész vagyunk, és az ügyfelek is egyszerűen aláírják mobilról.",
    name: "Kovács Márta",
    role: "Ügyvezető",
    company: "DigitalFlow Kft.",
    initials: "KM",
  },
  {
    quote: "Az audit napló és a jogász által ellenőrzött sablonok nyugalmat adnak. Végre nem kell azon aggódnunk, hogy valami hiányzik a szerződésből.",
    name: "Tóth Balázs",
    role: "Pénzügyi vezető",
    company: "BuildTech Zrt.",
    initials: "TB",
  },
  {
    quote: "A csapatkezelés funkció fantasztikus. 8 munkatársamat vettem fel, mindenki a saját jogosultsági szintjén dolgozik. Átlátható és biztonságos.",
    name: "Szabó Andrea",
    role: "HR vezető",
    company: "GreenLogistics Kft.",
    initials: "SzA",
  },
  {
    quote: "Mint egyéni vállalkozónak, a legfontosabb az volt, hogy ingyenesen is használhassam. 5 szerződés havonta bőven elég nekem, és profi benyomást keltek.",
    name: "Horváth Péter",
    role: "Egyéni vállalkozó",
    company: "Horváth IT",
    initials: "HP",
  },
];

function TestimonialsSection() {
  return (
    <section id="velemenyek" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-brand-teal font-semibold text-sm uppercase tracking-wider mb-3">Vélemények</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
              Amit ügyfeleink mondanak
            </h2>
            <p className="text-gray-500 text-lg">Valódi visszajelzések magyar vállalkozásoktól.</p>
          </div>
        </Reveal>
        <div className="grid md:grid-cols-2 gap-6">
          {testimonials.map((t, i) => (
            <Reveal key={i} delay={i * 100}>
              <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100 hover:border-brand-teal/20 transition-all h-full flex flex-col">
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <svg key={j} className="w-5 h-5 text-brand-gold" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-700 leading-relaxed mb-6 flex-1 text-[15px]">"{t.quote}"</p>
                <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                  <div className="w-11 h-11 rounded-full bg-brand-teal-dark flex items-center justify-center text-white text-sm font-bold">
                    {t.initials}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                    <p className="text-gray-400 text-xs">{t.role} · {t.company}</p>
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

/* ── 8. PRICING ───────────────────────────────────────────────────── */
const plans = [
  {
    name: "Ingyenes",
    price: "0",
    period: "Ft / hó",
    desc: "Egyéni vállalkozóknak, kipróbáláshoz.",
    features: ["5 szerződés / hó", "1 felhasználó", "Alap sablonok", "Egyszerű e-aláírás", "Email értesítések"],
    cta: "Regisztráció ingyen",
    popular: false,
  },
  {
    name: "Kezdő",
    price: "2 990",
    period: "Ft / hó",
    desc: "Kis csapatoknak, akik komolyan veszik.",
    features: ["30 szerződés / hó", "3 felhasználó", "Összes sablon", "Egyéni sablonok", "Emlékeztetők", "Számlázz.hu integráció"],
    cta: "Kezdés 14 napos triallal",
    popular: false,
  },
  {
    name: "Profi",
    price: "9 990",
    period: "Ft / hó",
    desc: "Növekvő cégeknek, korlátok nélkül.",
    features: ["Korlátlan szerződés", "10 felhasználó", "Minősített aláírás (QES)", "AI szerződéselemzés", "Analytics dashboard", "Webhook integráció", "Dedikált támogatás"],
    cta: "Profi csomag választása",
    popular: true,
  },
  {
    name: "Nagyvállalati",
    price: "Egyedi",
    period: "",
    desc: "Enterprise igényekre szabva.",
    features: ["Korlátlan minden", "SSO (SAML/OIDC)", "Dedikált account manager", "SLA garancia", "White-label", "On-premise lehetőség"],
    cta: "Kapcsolatfelvétel",
    popular: false,
  },
];

function PricingSection() {
  return (
    <section id="arak" className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-brand-gold font-semibold text-sm uppercase tracking-wider mb-3">Árazás</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
              Átlátható árak, rejtett költségek nélkül
            </h2>
            <p className="text-gray-500 text-lg">Kezdd ingyen, fizess akkor, amikor a céged nő. Éves fizetésnél 2 hónap ingyen.</p>
          </div>
        </Reveal>
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
                <h3 className={`font-bold text-lg ${plan.popular ? "text-white" : "text-gray-900"}`}>{plan.name}</h3>
                <div className="mt-3 mb-2">
                  <span className={`text-3xl font-extrabold ${plan.popular ? "text-white" : "text-gray-900"}`}>{plan.price}</span>
                  {plan.period && (
                    <span className={`text-sm ml-1 ${plan.popular ? "text-white/70" : "text-gray-400"}`}>{plan.period}</span>
                  )}
                </div>
                <p className={`text-sm mb-6 ${plan.popular ? "text-white/70" : "text-gray-500"}`}>{plan.desc}</p>
                <ul className="space-y-2.5 mb-8 flex-1">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-2.5 text-sm">
                      <svg className={`w-4 h-4 mt-0.5 shrink-0 ${plan.popular ? "text-brand-gold" : "text-brand-teal"}`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className={plan.popular ? "text-white/90" : "text-gray-600"}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
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
  );
}

/* ── 9. FAQ ────────────────────────────────────────────────────────── */
const faqs = [
  { q: "Jogilag érvényes az elektronikus aláírás?", a: "Igen. Az eIDAS rendelet és a magyar Ptk. szerint az elektronikus aláírás jogilag egyenértékű a kézzel írott aláírással a legtöbb szerződéstípusnál. A minősített e-aláírás (QES) pedig teljes bizonyító erejű." },
  { q: "Milyen aláírás-típusokat támogattok?", a: "Egyszerű elektronikus aláírás (rajzolt, gépelt), fokozott biztonságú (AES), és minősített aláírás (QES) Microsec-en és DÁP-on keresztül. A minősített aláírás eléréséhez Profi csomag szükséges." },
  { q: "Biztonságban vannak az adataim?", a: "Igen. Minden dokumentumot SHA-256 hash-sel védünk, EU-s szerveren tárolunk, és GDPR-kompatibilis a teljes rendszer. Teljes audit napló rögzíti, ki mikor mit csinált." },
  { q: "Lehet saját sablont feltölteni?", a: "Igen, a Kezdő csomagtól kezdve. Feltölthetsz HTML-alapú sablonokat változókkal, amiket a rendszer automatikusan kitölt." },
  { q: "Hogyan működik a csapatkezelés?", a: "Meghívhatsz kollégákat emailben. Három szerepkör van: Admin (teljes hozzáférés), Tag (létrehozás + szerkesztés), és Megtekintő (csak olvasás)." },
  { q: "Van ingyenes csomag?", a: "Igen! Az ingyenes csomagban havonta 5 szerződést hozhatsz létre, korlátlan ideig. Nincs szükség bankkártyára a regisztrációhoz." },
];

function FAQSection() {
  return (
    <section id="gyik" className="py-24 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="text-center mb-16">
            <p className="text-brand-teal font-semibold text-sm uppercase tracking-wider mb-3">GYIK</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
              Gyakran ismételt kérdések
            </h2>
          </div>
        </Reveal>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <Reveal key={i} delay={i * 60}>
              <details className="group bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
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
  );
}

/* ── 10. FINAL CTA ────────────────────────────────────────────────── */
function FinalCTA() {
  return (
    <section className="py-24 bg-gradient-to-br from-brand-teal-dark via-brand-teal to-brand-teal-muted relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 right-20 w-72 h-72 bg-brand-gold rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-20 w-96 h-96 bg-white rounded-full blur-3xl" />
      </div>
      <div className="relative max-w-3xl mx-auto px-4 text-center">
        <Reveal>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-4">
            Kezdd el ingyen,<br />
            <span className="text-brand-gold">frissíts, amikor kell.</span>
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
              className="inline-flex items-center justify-center gap-2 bg-brand-gold hover:bg-brand-gold-dark text-white font-bold px-10 py-4 rounded-xl transition shadow-lg shadow-brand-gold/30 text-lg"
            >
              Regisztráció ingyen
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </Link>
          </div>
        </Reveal>
        <Reveal delay={300}>
          <div className="flex items-center justify-center gap-6 text-white/50 text-sm">
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-brand-gold" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
              Nem kell bankkártya
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-brand-gold" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
              5 szerződés ingyen
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-brand-gold" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
              Azonnali hozzáférés
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
