"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import ThemeToggle from "@/components/theme-toggle";
import LanguageSwitcher from "@/components/language-switcher";

/* ── Reveal on scroll ──────────────────────────────────────────────── */
function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setTimeout(() => el.classList.add("animate-fadeUp"), delay);
          obs.unobserve(el);
        }
      },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [delay]);
  return (
    <div ref={ref} className={`opacity-0 translate-y-6 ${className}`}>
      {children}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   LANDING PAGE
   ══════════════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  return (
    <>
      <Navbar />
      <HeroSection />
      <TransformSection />
      <ProductShowcase />
      <FeaturesGrid />
      <HowItWorks />
      <PricingPreview />
      <TestimonialsSection />
      <FinalCTA />
      <Footer />
    </>
  );
}

/* ── NAVBAR ─────────────────────────────────────────────────────────── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-sm border-b border-gray-100 dark:border-gray-800"
          : "bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/landing" className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-brand-teal-dark flex items-center justify-center">
              <span className="text-white font-bold text-sm tracking-tight">L</span>
            </div>
            <span className="font-bold text-xl tracking-tight text-gray-900 dark:text-white">
              Legitas
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden lg:flex items-center gap-8">
            {[
              { label: "Funkciók", href: "#funkciok" },
              { label: "Hogyan működik", href: "#hogyan-mukodik" },
              { label: "Árazás", href: "#arak" },
              { label: "Blog", href: "/blog" },
            ].map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-brand-teal-dark dark:hover:text-brand-teal transition-colors"
              >
                {l.label}
              </a>
            ))}
          </div>

          {/* Desktop right side */}
          <div className="hidden lg:flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
            <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />
            <Link
              href="/login"
              className="text-sm font-semibold px-4 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:text-brand-teal-dark dark:hover:text-brand-teal transition-colors"
            >
              Bejelentkezés
            </Link>
            <Link
              href="/register"
              className="text-sm font-semibold px-5 py-2.5 rounded-lg bg-brand-gold hover:bg-brand-gold-dark text-white transition-colors shadow-sm"
            >
              Próbáld ki ingyen
            </Link>
          </div>

          {/* Mobile hamburger */}
          <div className="flex lg:hidden items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-lg text-gray-700 dark:text-gray-300"
              aria-label="Menü"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="lg:hidden bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 mt-2 p-4 absolute left-4 right-4">
            <div className="flex flex-col gap-1">
              {[
                { label: "Funkciók", href: "#funkciok" },
                { label: "Hogyan működik", href: "#hogyan-mukodik" },
                { label: "Árazás", href: "#arak" },
                { label: "Blog", href: "/blog" },
              ].map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                  className="text-gray-700 dark:text-gray-300 font-medium px-3 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
                >
                  {l.label}
                </a>
              ))}
              <hr className="my-2 border-gray-100 dark:border-gray-700" />
              <Link href="/login" className="text-gray-700 dark:text-gray-300 font-medium px-3 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm">
                Bejelentkezés
              </Link>
              <Link href="/register" className="text-center font-semibold px-3 py-2.5 rounded-lg bg-brand-gold text-white text-sm mt-1">
                Próbáld ki ingyen
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

/* ── 1. HERO ────────────────────────────────────────────────────────── */
function HeroSection() {
  return (
    <section className="relative pt-20 lg:pt-0 min-h-screen flex items-center overflow-hidden bg-white dark:bg-gray-900">
      {/* Full background photo — blurred */}
      <div className="absolute inset-0">
        <Image
          src="/images/hero-bg.jpg"
          alt=""
          fill
          className="object-cover blur-sm scale-105"
          priority
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
        {/* Overlay to keep text readable */}
        <div className="absolute inset-0 bg-white/85 dark:bg-gray-900/90" />
      </div>

      {/* Teal rounded stripe behind the top */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[110%] h-[420px] lg:h-[480px] bg-brand-teal-dark rounded-b-[60px] lg:rounded-b-[80px]" />
      {/* Gold accent line at the stripe bottom */}
      <div className="absolute top-[418px] lg:top-[478px] left-1/2 -translate-x-1/2 w-[90%] max-w-4xl h-1 bg-brand-gold/40 rounded-full" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left — text (on top of teal stripe → white text) */}
          <div>
            <Reveal>
              <span className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-semibold mb-5 text-white/90">
                <span className="w-2 h-2 bg-brand-gold rounded-full animate-pulse" />
                Magyar KKV-knak fejlesztve
              </span>
            </Reveal>
            <Reveal delay={80}>
              <h1 className="text-4xl sm:text-5xl xl:text-[3.5rem] font-extrabold text-white leading-[1.12] mb-6 drop-shadow-sm">
                Készíts szerződést
                <span className="text-brand-gold"> percek alatt,</span>
                <br />ne napok alatt.
              </h1>
            </Reveal>
            <Reveal delay={160}>
              <p className="text-lg text-white/70 leading-relaxed mb-8 max-w-lg">
                Válassz sablont, töltsd ki az adatokat, küldd el aláírásra — mindezt
                egyetlen felületen, papír és nyomtató nélkül.
              </p>
            </Reveal>
            <Reveal delay={240}>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 bg-brand-gold hover:bg-brand-gold-dark text-white font-bold px-7 py-3.5 rounded-xl transition shadow-lg shadow-black/15 text-[15px]"
                >
                  Regisztrálok ingyen
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
                <a
                  href="#hogyan-mukodik"
                  className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 text-white font-semibold px-7 py-3.5 rounded-xl transition text-[15px]"
                >
                  Hogyan működik?
                </a>
              </div>
            </Reveal>
            <Reveal delay={320}>
              <div className="flex items-center gap-5 mt-8 text-white/50 text-sm">
                <span className="flex items-center gap-1.5">
                  <CheckIcon className="text-brand-gold" /> Ingyenes kezdés
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckIcon className="text-brand-gold" /> Bankkártya nélkül
                </span>
              </div>
            </Reveal>
          </div>

          {/* Right — illustrative floating cards */}
          <div className="hidden lg:block">
            <Reveal delay={200}>
              <div className="relative h-[480px]">
                {/* Card 1 — Contract document */}
                <div className="absolute top-0 right-8 w-72 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl shadow-gray-400/20 dark:shadow-black/30 p-6 border border-gray-100 dark:border-gray-700 animate-float">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-brand-teal/10 flex items-center justify-center">
                      <svg className="w-5 h-5 text-brand-teal-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium">Megbízási szerződés</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">DigitalFlow Kft.</p>
                    </div>
                    <span className="ml-auto bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] font-bold px-2 py-0.5 rounded-full">Aláírva</span>
                  </div>
                  <div className="space-y-2">
                    <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full w-full" />
                    <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full w-4/5" />
                    <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full w-3/5" />
                  </div>
                  <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <div className="flex -space-x-2">
                      <div className="w-7 h-7 rounded-full bg-brand-teal-dark text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-gray-800">NK</div>
                      <div className="w-7 h-7 rounded-full bg-brand-gold text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-gray-800">BT</div>
                    </div>
                    <svg className="w-16 h-8 text-gray-800 dark:text-gray-200 animate-draw" viewBox="0 0 70 30" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M5 22 Q 12 5, 22 18 T 40 15 T 58 18 Q 64 20, 65 12" />
                    </svg>
                  </div>
                </div>

                {/* Card 2 — Notification */}
                <div className="absolute top-4 left-0 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 px-4 py-3 flex items-center gap-3" style={{ animationDelay: "1s", animation: "float 5s ease-in-out infinite" }}>
                  <div className="w-9 h-9 rounded-full bg-brand-teal/10 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-brand-teal-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Aláírás sikeres!</p>
                    <p className="text-xs text-gray-400">2 másodperce</p>
                  </div>
                </div>

                {/* Card 3 — Stats */}
                <div className="absolute bottom-20 left-4 w-52 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 p-5" style={{ animationDelay: "2s", animation: "float 7s ease-in-out infinite" }}>
                  <p className="text-xs text-gray-400 font-medium mb-1">Havi szerződések</p>
                  <p className="text-3xl font-extrabold text-brand-teal-dark">47</p>
                  <div className="flex items-center gap-1 mt-1">
                    <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-green-500 text-xs font-bold">+23%</span>
                    <span className="text-gray-400 text-xs">vs. előző hó</span>
                  </div>
                  {/* Mini bar chart */}
                  <div className="flex items-end gap-1 mt-3 h-10">
                    {[40, 55, 35, 70, 50, 85, 65].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-sm bg-brand-teal/20"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>

                {/* Card 4 — Template picker mini */}
                <div className="absolute bottom-8 right-0 w-60 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 p-4" style={{ animationDelay: "0.5s", animation: "float 6s ease-in-out infinite" }}>
                  <p className="text-xs font-bold text-gray-900 dark:text-white mb-3">Sablonok</p>
                  <div className="space-y-2">
                    {[
                      { name: "Munkaszerződés", color: "bg-brand-teal" },
                      { name: "NDA", color: "bg-brand-gold" },
                      { name: "Megbízási", color: "bg-brand-teal-dark" },
                    ].map((t, i) => (
                      <div key={i} className="flex items-center gap-2.5 p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                        <div className={`w-2 h-8 rounded-full ${t.color}`} />
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{t.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── TRANSFORM SECTION (before → after, connected) ──────────────────── */
function TransformSection() {
  return (
    <section className="py-20 lg:py-28 bg-gray-50 dark:bg-gray-800/50 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-brand-teal text-sm font-semibold uppercase tracking-wider">
              Miért váltanak a Legitas-ra?
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mt-3 mb-4">
              Ugyanez <span className="text-brand-gold">10 perc</span> alatt, papír nélkül.
            </h2>
          </div>
        </Reveal>

        <div className="grid lg:grid-cols-11 gap-6 items-stretch">
          {/* Before */}
          <Reveal className="lg:col-span-5">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 h-full relative overflow-hidden">
              {/* Corner accent */}
              <div className="absolute top-0 left-0 w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-br-[40px] -translate-x-4 -translate-y-4" />
              <div className="relative">
                <p className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-6">
                  Eddig
                </p>
                <div className="space-y-4">
                  {[
                    "Word-ben szerkeszteni a szerződést",
                    "Emailben küldözgetni a verziókat",
                    "Kinyomtatni, postázni, aláíratni",
                    "Beszkennelni és visszaküldeni",
                    "Mappában tárolni a papírokat",
                  ].map((text, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-gray-400 text-xs font-bold">{i + 1}</span>
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 text-[15px]">{text}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-5 border-t border-gray-100 dark:border-gray-700">
                  <p className="text-gray-400 dark:text-gray-500 text-sm">
                    Átlagosan <span className="font-bold text-gray-600 dark:text-gray-300">3-5 munkanap</span> egy
                    szerződés aláírásáig.
                  </p>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Arrow connector */}
          <div className="lg:col-span-1 flex items-center justify-center">
            <Reveal delay={200}>
              <div className="w-14 h-14 rounded-full bg-brand-gold flex items-center justify-center shadow-lg shadow-brand-gold/25">
                <svg className="w-6 h-6 text-white lg:rotate-0 rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </Reveal>
          </div>

          {/* After */}
          <Reveal delay={150} className="lg:col-span-5">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border-2 border-brand-teal/30 dark:border-brand-teal/20 h-full relative overflow-hidden shadow-lg shadow-brand-teal/5">
              {/* Corner accent */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-brand-teal/5 dark:bg-brand-teal/10 rounded-bl-[40px] translate-x-4 -translate-y-4" />
              <div className="relative">
                <p className="text-sm font-bold text-brand-teal-dark dark:text-brand-teal uppercase tracking-widest mb-6">
                  A Legitas-szal
                </p>
                <div className="space-y-4">
                  {[
                    { title: "Sablon kiválasztása", desc: "15+ kész, Ptk.-kompatibilis sablon" },
                    { title: "Adatok kitöltése", desc: "Egyszerű űrlap, automatikus behelyettesítés" },
                    { title: "Aláírás küldése", desc: "Email link, mobilról is aláírható" },
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4 items-start">
                      <div className="w-10 h-10 rounded-xl bg-brand-teal/10 dark:bg-brand-teal/20 flex items-center justify-center shrink-0">
                        <span className="text-brand-teal-dark dark:text-brand-teal font-bold text-sm">{i + 1}</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white text-[15px]">{item.title}</h4>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-5 border-t border-brand-teal/10 dark:border-brand-teal/20">
                  <p className="text-brand-teal-dark dark:text-brand-teal text-sm font-semibold">
                    Átlagosan <span className="text-brand-gold font-extrabold">10 perc</span> alatt kész.
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ── PRODUCT SHOWCASE (screenshots) ─────────────────────────────────── */
function ProductShowcase() {
  const screens = [
    {
      label: "Sablonválasztó",
      desc: "Válassz 15+ kész sablonból: munkaszerződés, megbízási, NDA, bérleti és még sok más.",
      img: "/images/screenshot-templates.png",
    },
    {
      label: "Szerződés szerkesztő",
      desc: "Egyszerű űrlap: add meg az adatokat, a rendszer automatikusan behelyettesíti a sablonba.",
      img: "/images/screenshot-editor.png",
    },
    {
      label: "Digitális aláírás",
      desc: "Rajzold meg az aláírásod mobilon vagy gépen — az aláíró emailben kapja a linket.",
      img: "/images/screenshot-signing.png",
    },
  ];

  const [active, setActive] = useState(0);

  return (
    <section className="py-20 lg:py-28 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-brand-teal text-sm font-semibold uppercase tracking-wider">
              A platform
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mt-3 mb-4">
              Nézd meg, milyen egyszerű
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              Intuitív felület, amiben nem kell keresgélni.
            </p>
          </div>
        </Reveal>

        {/* Tabs */}
        <Reveal delay={100}>
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {screens.map((s, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  active === i
                    ? "bg-brand-teal-dark text-white shadow-md"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </Reveal>

        {/* Screenshot */}
        <Reveal delay={200}>
          <div className="max-w-5xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="bg-gray-50 dark:bg-gray-750 border-b border-gray-200 dark:border-gray-700 px-4 py-2.5 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-gray-600" />
                  <div className="w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-gray-600" />
                  <div className="w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-gray-600" />
                </div>
                <div className="ml-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded px-3 py-0.5 text-xs text-gray-400 flex-1 max-w-sm">
                  app.legitas.hu
                </div>
              </div>
              <div className="aspect-[16/9] bg-gray-100 dark:bg-gray-800 relative">
                <Image
                  key={active}
                  src={screens[active].img}
                  alt={screens[active].label}
                  fill
                  className="object-cover object-top"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                    const parent = target.parentElement!;
                    parent.classList.add("flex", "items-center", "justify-center");
                    const existing = parent.querySelector("[data-fallback]");
                    if (existing) existing.remove();
                    const div = document.createElement("div");
                    div.setAttribute("data-fallback", "true");
                    div.className = "text-center p-8";
                    div.innerHTML = `
                      <div class="w-20 h-20 mx-auto mb-5 rounded-2xl bg-brand-teal/10 flex items-center justify-center">
                        <svg class="w-10 h-10 text-brand-teal-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      </div>
                      <p class="text-gray-500 font-semibold">${screens[active].label}</p>
                      <p class="text-gray-400 text-sm mt-1 max-w-xs mx-auto">${screens[active].desc}</p>
                    `;
                    parent.appendChild(div);
                  }}
                />
              </div>
            </div>
            <p className="text-center text-gray-500 dark:text-gray-400 mt-5 text-sm max-w-lg mx-auto">
              {screens[active].desc}
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ── FEATURES GRID ──────────────────────────────────────────────────── */
const features = [
  {
    title: "15+ jogi sablon",
    desc: "Munkajogi, B2B, ingatlan, NDA, IT — mind Ptk.-kompatibilis.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    accent: "brand-teal",
  },
  {
    title: "E-aláírás mobilról",
    desc: "Rajzold meg az aláírásod az érintőképernyőn, vagy gépeld be a neved.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    ),
    accent: "brand-gold",
  },
  {
    title: "Automatikus PDF",
    desc: "SHA-256 hash, audit log, azonnali letöltés. Egy kattintás.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    accent: "brand-teal",
  },
  {
    title: "AI asszisztens",
    desc: "Az AI átnézi a szerződésed, jelzi a kockázatokat és javaslatokat tesz.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    accent: "brand-gold",
  },
  {
    title: "Csapat és jogosultságok",
    desc: "Admin, szerkesztő, megtekintő. Kezeld ki mihez fér hozzá.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    accent: "brand-teal",
  },
  {
    title: "Tevékenységi napló",
    desc: "Ki mikor nyitotta meg, szerkesztette, írta alá — minden naplózva.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
    accent: "brand-gold",
  },
];

function FeaturesGrid() {
  return (
    <section id="funkciok" className="py-20 lg:py-28 bg-gray-50 dark:bg-gray-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="max-w-2xl mb-14">
            <span className="text-brand-teal text-sm font-semibold uppercase tracking-wider">
              Funkciók
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mt-3 mb-4">
              Minden, ami a szerződéseidhez kell
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              Egy platform a sablonválasztástól az aláírásig.
            </p>
          </div>
        </Reveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <Reveal key={i} delay={i * 70}>
              <div className={`group bg-white dark:bg-gray-800 rounded-2xl p-7 border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:shadow-${f.accent}/5 hover:border-${f.accent}/30 transition-all duration-300 h-full`}>
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform ${
                    f.accent === "brand-gold"
                      ? "bg-brand-gold/10 text-brand-gold-dark dark:text-brand-gold"
                      : "bg-brand-teal/10 text-brand-teal-dark dark:text-brand-teal"
                  }`}
                >
                  {f.icon}
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2">{f.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-[15px] leading-relaxed">{f.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── HOW IT WORKS ───────────────────────────────────────────────────── */
function HowItWorks() {
  const steps = [
    {
      num: "1",
      title: "Válassz sablont",
      desc: "15+ szakértők által összeállított sablon: munkajogi, megbízási, NDA, bérleti.",
    },
    {
      num: "2",
      title: "Töltsd ki az adatokat",
      desc: "Add meg a feleket, összegeket, dátumokat. Automatikus behelyettesítés.",
    },
    {
      num: "3",
      title: "Küld el aláírásra",
      desc: "Email link, mobilról is aláírható, rajzolt vagy gépelt aláírással. Kész a PDF.",
    },
  ];

  return (
    <section id="hogyan-mukodik" className="py-20 lg:py-28 bg-brand-teal-dark relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-brand-gold/10 rounded-full blur-[120px]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-brand-gold text-sm font-semibold uppercase tracking-wider">
              Hogyan működik
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-3 mb-4">
              3 egyszerű lépés
            </h2>
            <p className="text-white/50 text-lg">
              Nincs bonyolult beállítás. Regisztrálj és már kezdheted is.
            </p>
          </div>
        </Reveal>

        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, i) => (
            <Reveal key={i} delay={i * 120}>
              <div className="relative">
                {i < 2 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] border-t border-dashed border-white/15" />
                )}
                <div className="w-16 h-16 rounded-2xl bg-brand-gold flex items-center justify-center mb-5 shadow-lg shadow-brand-gold/20">
                  <span className="text-white font-extrabold text-xl">{step.num}</span>
                </div>
                <h3 className="font-bold text-white text-xl mb-2">{step.title}</h3>
                <p className="text-white/50 text-[15px] leading-relaxed">{step.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── PRICING PREVIEW ────────────────────────────────────────────────── */
const plans = [
  {
    name: "Kezdő",
    price: "975",
    period: "Ft + áfa / hó",
    desc: "Egyéni vállalkozóknak",
    features: ["2 szerződés / hó", "AI asszisztens", "Kézi e-aláírás", "Tevékenységi napló"],
    cta: "Kezdő csomag",
    popular: false,
  },
  {
    name: "Közepes",
    price: "14 950",
    period: "Ft + áfa / hó",
    desc: "Mikro-vállalkozásoknak",
    features: ["12 szerződés / hó", "2 társfiók", "Sablontár + CRM", "Email követés"],
    cta: "Közepes csomag",
    popular: false,
  },
  {
    name: "Prémium",
    price: "26 000",
    period: "Ft + áfa / hó",
    desc: "KKV-knak",
    features: ["35 szerződés / hó", "5 társfiók", "API + automatizáció", "Branding"],
    cta: "Prémium csomag",
    popular: true,
  },
];

function PricingPreview() {
  return (
    <section id="arak" className="py-20 lg:py-28 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-brand-teal text-sm font-semibold uppercase tracking-wider">Árazás</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mt-3 mb-4">
              Átlátható árak, meglepetés nélkül
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              Válaszd ki a cégednek megfelelő csomagot. Éves fizetésnél 23% kedvezmény.
            </p>
          </div>
        </Reveal>
        <div className="grid md:grid-cols-3 gap-5 max-w-4xl mx-auto">
          {plans.map((plan, i) => (
            <Reveal key={i} delay={i * 100}>
              <div className={`relative rounded-2xl p-7 flex flex-col h-full transition-all duration-300 ${
                plan.popular
                  ? "bg-brand-teal-dark text-white shadow-2xl shadow-brand-teal-dark/20 ring-2 ring-brand-gold scale-[1.03]"
                  : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-brand-teal/30 hover:shadow-lg"
              }`}>
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-gold text-white text-xs font-bold px-4 py-1 rounded-full">
                    Legnépszerűbb
                  </span>
                )}
                <h3 className={`font-bold text-lg ${plan.popular ? "text-white" : "text-gray-900 dark:text-white"}`}>{plan.name}</h3>
                <p className={`text-xs mt-1 mb-4 ${plan.popular ? "text-white/60" : "text-gray-400"}`}>{plan.desc}</p>
                <div className="mb-5">
                  <span className={`text-3xl font-extrabold ${plan.popular ? "text-white" : "text-gray-900 dark:text-white"}`}>{plan.price}</span>
                  <span className={`text-sm ml-1 ${plan.popular ? "text-white/60" : "text-gray-400"}`}>{plan.period}</span>
                </div>
                <ul className="space-y-2.5 mb-7 flex-1">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm">
                      <CheckIcon className={plan.popular ? "text-brand-gold" : "text-brand-teal"} />
                      <span className={plan.popular ? "text-white/85" : "text-gray-600 dark:text-gray-300"}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.popular ? "/pricing" : "/register"}
                  className={`block text-center py-3 rounded-xl font-semibold text-sm transition ${
                    plan.popular
                      ? "bg-brand-gold hover:bg-brand-gold-dark text-white shadow-lg shadow-brand-gold/25"
                      : "bg-brand-teal-dark hover:bg-brand-teal-darker text-white"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal delay={400}>
          <div className="text-center mt-8">
            <Link href="/pricing" className="inline-flex items-center gap-1.5 text-brand-teal-dark dark:text-brand-teal font-semibold text-sm hover:underline">
              Részletes összehasonlítás
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ── TESTIMONIALS — 5 people ────────────────────────────────────────── */
const testimonials = [
  {
    quote: "Korábban napokat vett igénybe egy-egy szerződés. A Legitas-szal 10 perc alatt kész vagyunk, és az ügyfelek is egyszerűen aláírják mobilról.",
    name: "Kuli Dorina",
    role: "Értékesítési vezető",
    company: "TDHR Group",
    initials: "KD",
  },
  {
    quote: "Az audit napló és a szakértők által összeállított sablonok nyugalmat adnak. Végre nem kell azon aggódnunk, hogy valami hiányzik a szerződésből.",
    name: "Galgóczi Anna",
    role: "Compliance vezető",
    company: "Tudatos Diák Iskolaszövetkezet",
    initials: "GA",
  },
  {
    quote: "A szerződések elkészítési ideje 80%-kal csökkent a Legitas bevezetése után. Régen napokig tartott, most percek alatt kész.",
    name: "Varga Gábor",
    role: "Pénzügyi vezető",
    company: "T-Cloud Solutions Kft.",
    initials: "VG",
  },
  {
    quote: "A csapatkezelés funkció fantasztikus. 8 munkatársamat vettem fel, mindenki a saját jogosultsági szintjén dolgozik.",
    name: "Horváth László",
    role: "Ügyvezető",
    company: "DataBridge Kft.",
    initials: "HL",
  },
  {
    quote: "Az API összeköttetés révén a CRM rendszerünk automatikusan szinkronizálódik a szerződés-adatokkal. Nulla manuális adminisztráció.",
    name: "Molnár Eszter",
    role: "IT vezető",
    company: "LogiTech Hungary Zrt.",
    initials: "ME",
  },
];

function TestimonialsSection() {
  return (
    <section className="py-20 lg:py-28 bg-gray-50 dark:bg-gray-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-brand-teal text-sm font-semibold uppercase tracking-wider">
              Vélemények
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mt-3 mb-4">
              Amit ügyfeleink mondanak
            </h2>
          </div>
        </Reveal>
        {/* Top row: 3 */}
        <div className="grid md:grid-cols-3 gap-5 mb-5">
          {testimonials.slice(0, 3).map((t, i) => (
            <Reveal key={i} delay={i * 80}>
              <TestimonialCard t={t} />
            </Reveal>
          ))}
        </div>
        {/* Bottom row: 2, centered */}
        <div className="grid md:grid-cols-2 gap-5 max-w-3xl mx-auto">
          {testimonials.slice(3).map((t, i) => (
            <Reveal key={i + 3} delay={(i + 3) * 80}>
              <TestimonialCard t={t} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({ t }: { t: (typeof testimonials)[number] }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-7 border border-gray-100 dark:border-gray-700 hover:border-brand-teal/20 dark:hover:border-brand-teal/30 transition-colors h-full flex flex-col">
      <div className="flex gap-0.5 mb-4">
        {[...Array(5)].map((_, j) => (
          <svg key={j} className="w-4 h-4 text-brand-gold" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6 flex-1 text-[15px]">
        &ldquo;{t.quote}&rdquo;
      </p>
      <div className="flex items-center gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
        <div className="w-10 h-10 rounded-full bg-brand-teal-dark flex items-center justify-center text-white text-xs font-bold">
          {t.initials}
        </div>
        <div>
          <p className="font-semibold text-gray-900 dark:text-white text-sm">{t.name}</p>
          <p className="text-gray-400 text-xs">{t.role}, {t.company}</p>
        </div>
      </div>
    </div>
  );
}

/* ── FINAL CTA ──────────────────────────────────────────────────────── */
function FinalCTA() {
  return (
    <section className="py-20 lg:py-24 bg-brand-teal-dark relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-brand-gold/15 rounded-full blur-[100px]" />

      <div className="relative max-w-3xl mx-auto px-4 text-center">
        <Reveal>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-5 leading-tight">
            Indulj el ingyen,
            <br />
            <span className="text-brand-gold">fizess, ha kinövöd.</span>
          </h2>
        </Reveal>
        <Reveal delay={100}>
          <p className="text-white/55 text-lg mb-9 max-w-xl mx-auto">
            Csatlakozz a magyar vállalkozásokhoz, akik már papír nélkül szerződnek.
            14 nap ingyenes próba, bankkártya nélkül.
          </p>
        </Reveal>
        <Reveal delay={200}>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-brand-gold hover:bg-brand-gold-dark text-white font-bold px-10 py-4 rounded-xl transition shadow-lg shadow-brand-gold/25 text-lg"
          >
            Regisztrálok ingyen
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </Reveal>
        <Reveal delay={300}>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-8 text-white/40 text-sm">
            <span className="flex items-center gap-1.5">
              <CheckIcon className="text-brand-gold" /> Nem kell bankkártya
            </span>
            <span className="flex items-center gap-1.5">
              <CheckIcon className="text-brand-gold" /> 14 napos próba
            </span>
            <span className="flex items-center gap-1.5">
              <CheckIcon className="text-brand-gold" /> Bármikor lemondható
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ── FOOTER ─────────────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div>
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-lg bg-brand-teal-dark flex items-center justify-center">
                <span className="text-white font-bold text-sm">L</span>
              </div>
              <span className="text-white font-bold text-lg">Legitas</span>
            </div>
            <p className="text-sm leading-relaxed">
              A magyar KKV-k szerződéskezelő platformja. Ptk.-konfrom sablonok, e-aláírás, egy helyen.
            </p>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm">Termék</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="#funkciok" className="hover:text-white transition">Funkciók</Link></li>
              <li><Link href="/pricing" className="hover:text-white transition">Árazás</Link></li>
              <li><Link href="/blog" className="hover:text-white transition">Blog</Link></li>
              <li><Link href="/portal" className="hover:text-white transition">Ügyfélportál</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm">Jogi</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/adatvedelem" className="hover:text-white transition">Adatvédelem</Link></li>
              <li><Link href="/aszf" className="hover:text-white transition">ÁSZF</Link></li>
              <li><Link href="/cookie" className="hover:text-white transition">Cookie szabályzat</Link></li>
              <li><Link href="/dpa" className="hover:text-white transition">DPA</Link></li>
              <li><Link href="/impresszum" className="hover:text-white transition">Impresszum</Link></li>
              <li><Link href="/dpia" className="hover:text-white transition">DPIA</Link></li>
              <li><Link href="/scc" className="hover:text-white transition">SCC / TIA</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm">Kapcsolat</h3>
            <ul className="space-y-2.5 text-sm">
              <li><a href="mailto:info@legitas.hu" className="hover:text-white transition">info@legitas.hu</a></li>
              <li>Budapest, Magyarország</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm">&copy; {new Date().getFullYear()} Legitas. Minden jog fenntartva.</p>
          <p className="text-xs text-gray-600">A platform nem helyettesíti a jogi tanácsadást.</p>
        </div>
      </div>
    </footer>
  );
}

/* ── Shared ─────────────────────────────────────────────────────────── */
function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={`w-4 h-4 shrink-0 ${className}`} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  );
}
