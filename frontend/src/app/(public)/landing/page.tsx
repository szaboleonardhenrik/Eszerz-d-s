"use client";

// SEO note: Despite "use client", Next.js App Router still pre-renders this page
// as static HTML at build time (SSG). The directive only means JS hydrates on the
// client — the full HTML is in the initial response for search engine crawlers.

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import ThemeToggle from "@/components/theme-toggle";
import LanguageSwitcher from "@/components/language-switcher";
import { useI18n } from "@/lib/i18n";

/* ── Helpers ───────────────────────────────────────────────────────── */
function Ico({ d, className = "", style }: { d: string; className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={`w-5 h-5 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" style={style}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={d} />
    </svg>
  );
}

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.unobserve(el); } }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, visible } = useInView(0.1);
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  return (
    <div style={{ "--bg-page": "#F8FAFB", "--bg-card": "#fff", "--bg-alt": "#F0F5F7", "--text": "#1E2E38", "--text-mid": "#3D5260", "--text-muted": "#6B8290", "--border": "#DDE7EC" } as React.CSSProperties}>
      <Nav />
      <Hero />
      <Trust />
      <Services />
      <Band />
      <BeforeAfter />
      <Process />
      <Pricing />
      <Testimonials />
      <FAQ />
      <CTA />
      <Foot />
    </div>
  );
}

/* ── NAV ───────────────────────────────────────────────────────────── */
function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => { const h = () => setScrolled(window.scrollY > 40); window.addEventListener("scroll", h, { passive: true }); return () => window.removeEventListener("scroll", h); }, []);

  const links = [
    { l: "Szolgáltatások", h: "#funkciok" },
    { l: "Működés", h: "#folyamat" },
    { l: "Csomagok", h: "#arak" },
    { l: "Tudástár", h: "/blog" },
  ];

  return (
    <div className="fixed top-0 inset-x-0 z-50 flex justify-center pointer-events-none" style={{ paddingTop: scrolled ? 0 : 16, transition: "padding 0.3s" }}>
      <nav
        className="pointer-events-auto w-full transition-all duration-300"
        style={{
          maxWidth: scrolled ? "100%" : "1140px",
          borderRadius: scrolled ? 0 : 16,
          background: scrolled ? "rgba(255,255,255,0.97)" : "rgba(255,255,255,0.92)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          boxShadow: scrolled
            ? "0 1px 0 rgba(0,0,0,0.06)"
            : "0 4px 20px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)",
          border: scrolled ? "none" : "1px solid rgba(221,231,236,0.5)",
          margin: scrolled ? 0 : "0 16px",
        }}
      >
        <div className="h-[60px] px-6 md:px-8 flex items-center justify-between max-w-7xl mx-auto">
          <Link href="/landing" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#2F6482] to-[#46A0A0] flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-sm">L</span>
            </div>
            <span className="font-semibold text-[1.1rem] tracking-tight text-[#1E2E38]">
              Legit<span className="font-bold text-[#2F8A8A]">as</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {links.map(l => (
              <a key={l.h} href={l.h} className={`text-[.84rem] font-medium px-4 py-2 rounded-lg transition-all ${scrolled ? "text-[#4A6575] hover:text-[#1E2E38] hover:bg-[#F0F5F7]" : "text-[#4A6575] hover:text-[#1E2E38] hover:bg-[#F0F5F7]"}`}>{l.l}</a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <LanguageSwitcher variant="light" />
            <ThemeToggle variant="light" />
            <Link href="/login" className="text-[.84rem] font-medium px-4 py-2 rounded-lg transition-all text-[#4A6575] hover:text-[#1E2E38] hover:bg-[#F0F5F7]">Bejelentkezés</Link>
            <Link href="/register" className="text-[.84rem] font-semibold px-5 py-2 rounded-lg bg-[#2F8A8A] hover:bg-[#267070] text-white transition-all shadow-sm shadow-[#2F8A8A]/20">Kezdés ingyen</Link>
          </div>

          <div className="md:hidden flex items-center gap-1">
            <ThemeToggle variant="light" />
            <button onClick={() => setOpen(!open)} className="p-2 rounded-lg transition-colors text-[#3D5260] hover:bg-[#F0F5F7]" aria-label="Menü">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={open ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>
        </div>

        {open && (
          <div className="md:hidden px-5 pb-5 pt-1 flex flex-col gap-0.5 border-t border-[#DDE7EC]/60">
            {links.map(l => <a key={l.h} href={l.h} onClick={() => setOpen(false)} className="text-sm font-medium px-4 py-3 rounded-lg text-[#3D5260] hover:bg-[#F0F5F7] transition-colors">{l.l}</a>)}
            <hr className="my-2 border-0 h-px bg-[#DDE7EC]/60" />
            <div className="flex items-center gap-2 px-4 mb-1"><LanguageSwitcher variant="light" /></div>
            <Link href="/login" className="text-sm font-medium px-4 py-3 rounded-lg text-[#3D5260] hover:bg-[#F0F5F7]">Bejelentkezés</Link>
            <Link href="/register" className="text-center text-sm font-semibold px-4 py-3 rounded-lg bg-[#2F8A8A] text-white mt-1">Kezdés ingyen</Link>
          </div>
        )}
      </nav>
    </div>
  );
}

/* ── HERO ───────────────────────────────────────────────────────────── */
function Hero() {
  return (
    <section className="relative overflow-hidden bg-white pt-24 md:pt-28 pb-16 md:pb-24">
      {/* Blue rectangle behind content — full coverage */}
      <div
        className="absolute left-1/2 -translate-x-1/2 top-[50%] -translate-y-1/2 w-[96%] max-w-[1400px] h-[88%] rounded-[2rem] md:rounded-[2.5rem]"
        style={{
          background: "linear-gradient(135deg, #133040 0%, #184050 40%, #1B4D5C 70%, #143545 100%)",
          boxShadow: "0 20px 60px rgba(15,32,39,0.25)",
        }}
      />
      {/* Soft glow on the blue rect */}
      <div className="absolute left-1/2 -translate-x-1/2 top-[52%] -translate-y-1/2 w-[500px] h-[400px] rounded-full opacity-[0.12] blur-[100px]" style={{ background: "#46A0A0" }} />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10">
        <div className="grid md:grid-cols-2 gap-10 md:gap-14 items-center">

          {/* Left — text */}
          <div className="max-w-xl">
            <Reveal>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-px w-10 bg-[#2F8A8A]/40" />
                <span className="text-[#2F8A8A] text-[12px] font-semibold uppercase tracking-[0.15em]">Digitális szerződéskezelés</span>
              </div>
            </Reveal>

            <Reveal delay={60}>
              <h1 className="text-[clamp(2rem,4.5vw,3.2rem)] font-[800] text-white leading-[1.1] tracking-tight mb-5" style={{ textShadow: "0 2px 20px rgba(0,0,0,0.3)" }}>
                Szerződések létrehozása,<br />
                aláírása és kezelése —{" "}
                <span className="text-[#5FC4C4]">egyetlen platformon.</span>
              </h1>
            </Reveal>

            <Reveal delay={120}>
              <p className="text-[#A0C4D4] text-[1.05rem] leading-[1.7] mb-8 max-w-lg">
                Professzionális sablonok, jogilag érvényes e-aláírás és teljes audit trail.
                Csökkentse a szerződéskötés idejét akár 90%-kal — regisztráció után azonnal használható.
              </p>
            </Reveal>

            <Reveal delay={180}>
              <div className="flex flex-col sm:flex-row gap-3 mb-10">
                <Link href="/register" className="inline-flex items-center justify-center gap-2.5 bg-[#D29B01] hover:bg-[#E8B320] text-white font-semibold px-7 py-3.5 rounded-lg transition-all shadow-lg shadow-[#D29B01]/25 text-[.9rem]">
                  Ingyenes fiók létrehozása
                  <Ico d="M13 7l5 5m0 0l-5 5m5-5H6" className="w-4 h-4" />
                </Link>
                <a href="#folyamat" className="inline-flex items-center justify-center gap-2 text-white/60 hover:text-white font-medium px-5 py-3.5 rounded-lg transition-all text-[.9rem] hover:bg-white/8">
                  <Ico d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" className="w-4 h-4" />
                  Bemutató megtekintése
                </a>
              </div>
            </Reveal>

            {/* Key metrics */}
            <Reveal delay={240}>
              <div className="grid grid-cols-3 gap-5 pt-8 border-t border-white/[0.08]">
                {[
                  { value: "15+", label: "jogi sablon" },
                  { value: "90%", label: "időmegtakarítás" },
                  { value: "0 Ft", label: "indulás" },
                ].map((m, i) => (
                  <div key={i}>
                    <div className="text-white text-2xl font-bold tracking-tight">{m.value}</div>
                    <div className="text-[#7BA0B0] text-[.75rem] mt-1 font-medium">{m.label}</div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>

          {/* Right — photo */}
          <div className="relative">
            <Reveal delay={100}>
              <div className="relative">
                {/* Photo */}
                <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/hero-photo.jpg"
                    alt="Professzionális szerződéskezelés"
                    className="object-cover w-full h-[320px] md:h-[400px] lg:h-[460px]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0B1D26]/30 via-transparent to-transparent" />
                </div>

                {/* Floating card — top right */}
                <div className="absolute -top-3 -right-3 md:-right-5 rounded-xl p-3.5 shadow-xl border border-white/10" style={{ background: "rgba(18,44,56,0.92)", backdropFilter: "blur(16px)" }}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#2F8A8A]/20 flex items-center justify-center">
                      <Ico d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" className="w-4 h-4 text-[#5FC4C4]" />
                    </div>
                    <div>
                      <div className="text-white text-[13px] font-semibold">Szerződés aláírva</div>
                      <div className="text-[#6B8FA0] text-[10px] mt-0.5">Mindkét fél jóváhagyta</div>
                    </div>
                  </div>
                </div>

                {/* Floating card — bottom left */}
                <div className="absolute -bottom-3 -left-3 md:-left-5 rounded-xl p-3.5 shadow-xl border border-white/10" style={{ background: "rgba(18,44,56,0.92)", backdropFilter: "blur(16px)" }}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#D4A017]/15 flex items-center justify-center">
                      <Ico d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" className="w-4 h-4 text-[#D4A017]" />
                    </div>
                    <div>
                      <div className="text-white text-[13px] font-semibold">3 perc 12 mp</div>
                      <div className="text-[#6B8FA0] text-[10px] mt-0.5">Átlagos kitöltési idő</div>
                    </div>
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

/* ── TRUST BADGES ──────────────────────────────────────────────────── */
function Trust() {
  const items = [
    { icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z", l: "eIDAS kompatibilis", c: "text-[#46A0A0]" },
    { icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z", l: "GDPR megfelelő", c: "text-[#D29B01]" },
    { icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2", l: "Ptk.-konform sablonok", c: "text-[#46A0A0]" },
    { icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", l: "15+ jogi sablon", c: "text-[#2F6482]" },
    { icon: "M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z", l: "98% ügyfél elégedettség", c: "text-[#D29B01]" },
  ];
  return (
    <section className="py-6 bg-white dark:bg-[#1F2F3D] border-b border-[#DDE7EC] dark:border-[#446070]">
      <div className="max-w-7xl mx-auto px-5 flex flex-wrap justify-center gap-x-10 gap-y-3">
        {items.map((t, i) => (
          <div key={i} className="flex items-center gap-2 text-[.82rem] font-medium text-[#6B8290] dark:text-[#96B5C6]">
            <Ico d={t.icon} className={`w-4 h-4 ${t.c}`} />
            {t.l}
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── SERVICES ──────────────────────────────────────────────────────── */
const svc = [
  { t: "Jogi sablonok", d: "15+ Ptk.-kompatibilis sablon: munkaszerződés, megbízási, NDA, bérleti, vállalkozási.", tags: ["Munkajogi", "B2B", "Ingatlan"], icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
  { t: "E-aláírás", d: "Rajzolt vagy gépelt aláírás mobilról is. Az aláíró emailben kapja a linket, bárhonnan aláírhat.", tags: ["Rajzolt", "Gépelt", "Mobilos"], icon: "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" },
  { t: "Automatikus PDF", d: "Professzionális PDF egy kattintásra. SHA-256 hash, tevékenységi napló, azonnali letöltés.", tags: ["SHA-256", "Audit log", "Letöltés"], icon: "M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
  { t: "AI asszisztens", d: "Az AI átnézi a szerződésed, jelzi a kockázatokat és javaslatokat tesz — mielőtt aláírnád.", tags: ["Elemzés", "Kockázat", "Javaslat"], icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" },
  { t: "Csapatkezelés", d: "Admin, szerkesztő, megtekintő jogosultságok. Hívd meg kollégáidat, kezeld a hozzáférést.", tags: ["Jogosultság", "Meghívás", "Szerepkör"], icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
  { t: "API és webhook", d: "REST API az integrációkhoz. Hozz létre szerződéseket a saját rendszeredből, automatizálj.", tags: ["REST API", "Webhook", "CRM"], icon: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" },
];

function Services() {
  return (
    <section id="funkciok" className="py-20 lg:py-28 bg-[#F0F5F7] dark:bg-[#243545]">
      <div className="max-w-7xl mx-auto px-5">
        <Reveal>
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="w-10 h-1 rounded-full bg-gradient-to-r from-[#46A0A0] to-[#D29B01] mx-auto mb-4" />
            <h2 className="text-[clamp(1.7rem,3vw,2.3rem)] font-extrabold text-[#1E2E38] dark:text-white mb-3">Minden, ami a szerződéseidhez kell</h2>
            <p className="text-[#6B8290] dark:text-[#96B5C6] text-[1rem]">Egy platform a sablonválasztástól az aláírásig.</p>
          </div>
        </Reveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-[1.4rem]">
          {svc.map((s, i) => (
            <Reveal key={i} delay={i * 70}>
              <div className="group bg-white dark:bg-[#283D4E] rounded-[14px] border border-[#DDE7EC] dark:border-[#446070] overflow-hidden hover:-translate-y-1 hover:shadow-[0_8px_28px_rgba(47,100,130,.11)] transition-all duration-300 h-full flex flex-col">
                <div className="h-[3px] bg-gradient-to-r from-[#2F6482] to-[#46A0A0] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                <div className="p-6 flex flex-col flex-1">
                  <div className="w-[44px] h-[44px] rounded-xl bg-[#E8F5F5] dark:bg-[#46A0A0]/20 flex items-center justify-center mb-4">
                    <Ico d={s.icon} className="text-[#46A0A0]" />
                  </div>
                  <h3 className="font-bold text-[#1E2E38] dark:text-white text-[1.1rem] mb-2">{s.t}</h3>
                  <p className="text-[#6B8290] dark:text-[#96B5C6] text-[.88rem] leading-relaxed mb-4 flex-1">{s.d}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {s.tags.map((tag, j) => (
                      <span key={j} className="text-[.7rem] font-medium bg-[#EAF2F7] dark:bg-[#2F6482]/30 text-[#2F6482] dark:text-[#C4DAE5] px-2.5 py-1 rounded-md">{tag}</span>
                    ))}
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

/* ── SPECIALTY BAND ────────────────────────────────────────────────── */
function Band() {
  return (
    <section className="py-14 bg-gradient-to-r from-[#1E3A5F] to-[#0F766E]">
      <div className="max-w-7xl mx-auto px-5 grid sm:grid-cols-3 gap-8 text-center">
        {[
          { i: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z", l: "eIDAS kompatibilis", s: "Jogilag érvényes e-aláírás" },
          { i: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z", l: "GDPR megfelelő", s: "Adatvédelem beépítve" },
          { i: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2", l: "Ptk.-konform", s: "Szakértők által ellenőrzött sablonok" },
        ].map((x, i) => (
          <Reveal key={i} delay={i * 100}>
            <div className="flex flex-col items-center">
              <div className="w-[52px] h-[52px] rounded-2xl bg-white/15 flex items-center justify-center mb-3">
                <Ico d={x.i} className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-white font-bold text-lg mb-1">{x.l}</h3>
              <p className="text-white/55 text-[.85rem]">{x.s}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ── BEFORE / AFTER ────────────────────────────────────────────────── */
function BeforeAfter() {
  return (
    <section className="py-20 lg:py-28 bg-[#F8FAFB] dark:bg-[#1F2F3D] relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full opacity-40 dark:opacity-15" style={{ background: "radial-gradient(circle,#E8F5F5 0%,transparent 70%)" }} />
      <div className="relative max-w-7xl mx-auto px-5">
        <Reveal>
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="w-10 h-1 rounded-full bg-gradient-to-r from-[#46A0A0] to-[#D29B01] mx-auto mb-4" />
            <h2 className="text-[clamp(1.7rem,3vw,2.3rem)] font-extrabold text-[#1E2E38] dark:text-white mb-3">
              Ugyanez <span className="text-[#D29B01]">10 perc</span> alatt
            </h2>
          </div>
        </Reveal>
        <div className="grid lg:grid-cols-[1fr_80px_1fr] gap-4 lg:gap-0 items-stretch">
          <Reveal>
            <div className="bg-white dark:bg-[#283D4E] rounded-2xl p-7 border border-[#DDE7EC] dark:border-[#446070] shadow-[0_2px_10px_rgba(47,100,130,.07)] h-full">
              <p className="text-[.75rem] font-bold text-[#6B8290] uppercase tracking-widest mb-5">Eddig</p>
              {["Word-ben szerkeszteni", "Emailben verziókat küldözgetni", "Kinyomtatni, postázni", "Beszkennelni, visszaküldeni", "Mappában tárolni"].map((t, i) => (
                <div key={i} className="flex items-center gap-3 mb-3 last:mb-0">
                  <span className="w-6 h-6 rounded-full bg-[#F0F5F7] dark:bg-[#243545] text-[#6B8290] text-[.7rem] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                  <span className="text-[#3D5260] dark:text-[#C4DAE5] text-[.9rem]">{t}</span>
                </div>
              ))}
              <div className="mt-5 pt-4 border-t border-[#DDE7EC] dark:border-[#446070]">
                <span className="text-[#6B8290] text-[.82rem]">Átlagosan <b className="text-[#1E2E38] dark:text-white">3-5 munkanap</b></span>
              </div>
            </div>
          </Reveal>
          <div className="flex items-center justify-center">
            <Reveal delay={200}>
              <div className="w-14 h-14 rounded-full bg-[#D29B01] flex items-center justify-center shadow-lg shadow-[#D29B01]/30">
                <Ico d="M13 7l5 5m0 0l-5 5m5-5H6" className="w-6 h-6 text-white lg:rotate-0 rotate-90" />
              </div>
            </Reveal>
          </div>
          <Reveal delay={150}>
            <div className="bg-white dark:bg-[#283D4E] rounded-2xl p-7 border-2 border-[#46A0A0]/25 shadow-[0_8px_28px_rgba(70,160,160,.08)] h-full">
              <p className="text-[.75rem] font-bold text-[#46A0A0] uppercase tracking-widest mb-5">A Legitas-szal</p>
              {[
                { t: "Sablon kiválasztása", d: "15+ kész, Ptk.-kompatibilis sablon" },
                { t: "Adatok kitöltése", d: "Egyszerű űrlap, auto behelyettesítés" },
                { t: "Aláírás küldése", d: "Email link, mobilról is aláírható" },
              ].map((x, i) => (
                <div key={i} className="flex gap-3 items-start mb-4 last:mb-0">
                  <span className="w-9 h-9 rounded-xl bg-[#E8F5F5] dark:bg-[#46A0A0]/20 text-[#46A0A0] text-sm font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                  <div>
                    <p className="font-semibold text-[#1E2E38] dark:text-white text-[.92rem]">{x.t}</p>
                    <p className="text-[#6B8290] dark:text-[#96B5C6] text-[.82rem]">{x.d}</p>
                  </div>
                </div>
              ))}
              <div className="mt-5 pt-4 border-t border-[#46A0A0]/15">
                <span className="text-[#46A0A0] text-[.82rem] font-semibold">Átlagosan <b className="text-[#D29B01]">10 perc</b> alatt kész.</span>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ── PROCESS ───────────────────────────────────────────────────────── */
function Process() {
  const steps = [
    { n: "1", t: "Regisztrálj", d: "Hozd létre a fiókodat — ingyenes, nem kell bankkártya.", icon: "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z", color: "#46A0A0" },
    { n: "2", t: "Válassz sablont", d: "Böngészd a 15+ sablont, vagy töltsd fel a sajátodat.", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", color: "#2F6482" },
    { n: "3", t: "Töltsd ki az adatokat", d: "Add meg a feleket, összegeket, dátumokat. Automatikus behelyettesítés.", icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z", color: "#D29B01" },
    { n: "4", t: "Küld el aláírásra", d: "Az aláíró emailben kapja a linket. Mobilról is aláírhat.", icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z", color: "#46A0A0" },
    { n: "5", t: "Aláírás megtörténik", d: "Rajzolt vagy gépelt aláírás — jogilag érvényes, eIDAS kompatibilis.", icon: "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z", color: "#2F6482" },
    { n: "6", t: "Kész a PDF", d: "Az aláírt szerződés automatikusan elkészül. Letölthető, archiválható.", icon: "M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", color: "#D29B01" },
  ];
  return (
    <section id="folyamat" className="py-20 lg:py-28 bg-[#F0F5F7] dark:bg-[#243545] relative overflow-hidden">
      <div className="absolute -bottom-20 -left-20 w-[340px] h-[340px] rounded-full opacity-30 dark:opacity-10" style={{ background: "radial-gradient(circle,#FBF5E0 0%,transparent 70%)" }} />
      <div className="relative max-w-7xl mx-auto px-5">
        <Reveal>
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="w-10 h-1 rounded-full bg-gradient-to-r from-[#46A0A0] to-[#D29B01] mx-auto mb-4" />
            <h2 className="text-[clamp(1.7rem,3vw,2.3rem)] font-extrabold text-[#1E2E38] dark:text-white mb-3">6 lépés a kész szerződésig</h2>
            <p className="text-[#6B8290] dark:text-[#96B5C6]">Nincs bonyolult beállítás — regisztrálj, és indulhatsz is.</p>
          </div>
        </Reveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-[1.4rem] max-w-5xl mx-auto">
          {steps.map((s, i) => (
            <Reveal key={i} delay={i * 80}>
              <div className="bg-white dark:bg-[#283D4E] rounded-2xl border border-[#DDE7EC] dark:border-[#446070] overflow-hidden hover:-translate-y-1 hover:shadow-[0_8px_28px_rgba(47,100,130,.11)] transition-all h-full">
                <div className="h-1 w-full" style={{ background: `linear-gradient(to right, ${s.color}, ${s.color}88)` }} />
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${s.color}15` }}>
                      <Ico d={s.icon} className="w-5 h-5" style={{ color: s.color } as React.CSSProperties} />
                    </div>
                    <span className="text-[1.8rem] font-extrabold leading-none" style={{ color: s.color }}>{s.n}</span>
                  </div>
                  <h3 className="font-bold text-[#1E2E38] dark:text-white text-lg mb-1.5">{s.t}</h3>
                  <p className="text-[#6B8290] dark:text-[#96B5C6] text-[.88rem] leading-relaxed">{s.d}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── PRICING ───────────────────────────────────────────────────────── */
function Pricing() {
  return (
    <section id="arak" className="py-20 lg:py-28 bg-[#F8FAFB] dark:bg-[#1F2F3D]">
      <div className="max-w-7xl mx-auto px-5">
        <Reveal>
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="w-10 h-1 rounded-full bg-gradient-to-r from-[#46A0A0] to-[#D29B01] mx-auto mb-4" />
            <h2 className="text-[clamp(1.7rem,3vw,2.3rem)] font-extrabold text-[#1E2E38] dark:text-white mb-3">Átlátható árak</h2>
            <p className="text-[#6B8290] dark:text-[#96B5C6]">Éves fizetésnél 23% kedvezmény.</p>
          </div>
        </Reveal>
        <div className="grid md:grid-cols-3 gap-5 max-w-4xl mx-auto">
          {[
            { n: "Kezdő", p: "975", d: "Egyéni vállalkozóknak", f: ["2 szerződés / hó", "AI asszisztens", "Kézi e-aláírás", "Tevékenységi napló"], pop: false },
            { n: "Közepes", p: "14 950", d: "Mikro-vállalkozásoknak", f: ["12 szerződés / hó", "2 társfiók", "Sablontár + CRM", "Email követés"], pop: false },
            { n: "Prémium", p: "26 000", d: "KKV-knak", f: ["35 szerződés / hó", "5 társfiók", "API + automatizáció", "Branding"], pop: true },
          ].map((pl, i) => (
            <Reveal key={i} delay={i * 100}>
              <div className={`relative rounded-2xl p-7 flex flex-col h-full transition-all hover:-translate-y-1 ${pl.pop ? "bg-gradient-to-br from-[#1E3A5F] to-[#0F766E] text-white shadow-xl shadow-[#1E3A5F]/20 scale-[1.03] ring-2 ring-[#D29B01]/40" : "bg-white dark:bg-[#283D4E] border border-[#DDE7EC] dark:border-[#446070] hover:shadow-[0_8px_28px_rgba(47,100,130,.11)]"}`}>
                {pl.pop && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#D29B01] text-white text-[.7rem] font-bold px-4 py-1 rounded-full">Legnépszerűbb</span>}
                {pl.pop && <div className="h-1 w-full bg-gradient-to-r from-[#D29B01] to-[#F0C246] rounded-full mb-4" />}
                <h3 className={`font-bold text-lg ${pl.pop ? "text-white" : "text-[#1E2E38] dark:text-white"}`}>{pl.n}</h3>
                <p className={`text-[.78rem] mt-1 mb-4 ${pl.pop ? "text-white/55" : "text-[#6B8290]"}`}>{pl.d}</p>
                <div className="mb-5">
                  <span className={`text-3xl font-extrabold ${pl.pop ? "text-white" : "text-[#1E2E38] dark:text-white"}`}>{pl.p}</span>
                  <span className={`text-sm ml-1 ${pl.pop ? "text-white/55" : "text-[#6B8290]"}`}>Ft + áfa / hó</span>
                </div>
                <ul className="space-y-2.5 mb-7 flex-1">
                  {pl.f.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm">
                      <svg className={`w-4 h-4 shrink-0 ${pl.pop ? "text-[#D29B01]" : "text-[#46A0A0]"}`} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                      <span className={pl.pop ? "text-white/80" : "text-[#3D5260] dark:text-[#C4DAE5]"}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href={pl.pop ? "/pricing" : "/register"} className={`block text-center py-3 rounded-xl font-semibold text-sm transition-all hover:-translate-y-px ${pl.pop ? "bg-[#D29B01] hover:bg-[#F0C246] text-white shadow-lg shadow-[#D29B01]/25" : "bg-[#46A0A0] hover:bg-[#357878] text-white"}`}>{pl.pop ? "Prémium csomag" : `${pl.n} csomag`}</Link>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal delay={400}>
          <p className="text-center mt-8"><Link href="/pricing" className="text-[#46A0A0] font-semibold text-sm hover:underline inline-flex items-center gap-1">Részletes összehasonlítás <Ico d="M13 7l5 5m0 0l-5 5m5-5H6" className="w-4 h-4" /></Link></p>
        </Reveal>
      </div>
    </section>
  );
}

/* ── TESTIMONIALS — marquee ────────────────────────────────────────── */
const testi = [
  { q: "Korábban napokat vett igénybe egy-egy szerződés. A Legitas-szal 10 perc alatt kész vagyunk, és az ügyfelek is egyszerűen aláírják mobilról.", n: "Kuli Dorina", r: "Értékesítési vezető, TDHR Group", i: "KD" },
  { q: "Az audit napló és a sablonok nyugalmat adnak. Végre nem kell azon aggódnunk, hogy valami hiányzik a szerződésből.", n: "Galgóczi Anna", r: "Compliance vezető, Tudatos Diák", i: "GA" },
  { q: "A szerződések elkészítési ideje 80%-kal csökkent a Legitas bevezetése után. Régen napokig tartott, most percek.", n: "Varga Gábor", r: "Pénzügyi vezető, T-Cloud Solutions", i: "VG" },
  { q: "A csapatkezelés fantasztikus. 8 munkatárs, mindenki a saját jogosultsági szintjén dolgozik. Átlátható.", n: "Horváth László", r: "Ügyvezető, DataBridge Kft.", i: "HL" },
  { q: "Az API összeköttetés révén a CRM rendszerünk automatikusan szinkronizálódik. Nulla manuális adminisztráció.", n: "Molnár Eszter", r: "IT vezető, LogiTech Hungary Zrt.", i: "ME" },
];

function Testimonials() {
  return (
    <section className="py-20 lg:py-28 bg-gradient-to-br from-[#1E3A5F] via-[#2A5078] to-[#0F766E] overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(212,160,23,.08)_1px,transparent_0)] bg-[length:28px_28px]" />
      <div className="relative max-w-7xl mx-auto px-5 mb-12">
        <Reveal>
          <div className="text-center">
            <div className="w-10 h-1 rounded-full bg-gradient-to-r from-[#D29B01] to-[#F0C246] mx-auto mb-4" />
            <h2 className="text-[clamp(1.7rem,3vw,2.3rem)] font-extrabold text-white mb-3">Amit ügyfeleink mondanak</h2>
          </div>
        </Reveal>
      </div>
      {/* Marquee */}
      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#1E3A5F] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#0F766E] to-transparent z-10 pointer-events-none" />
        <div className="flex animate-marquee hover:[animation-play-state:paused]" style={{ width: "max-content" }}>
          {[...testi, ...testi].map((t, i) => (
            <div key={i} className="w-[340px] shrink-0 px-2.5">
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 h-full flex flex-col">
                <div className="flex gap-0.5 mb-3">
                  {[...Array(5)].map((_, j) => <svg key={j} className="w-4 h-4 text-[#D29B01]" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>)}
                </div>
                <p className="text-white/70 text-[.88rem] leading-relaxed mb-5 flex-1 italic">&ldquo;{t.q}&rdquo;</p>
                <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2F6482] to-[#46A0A0] flex items-center justify-center text-white text-[.7rem] font-bold">{t.i}</div>
                  <div>
                    <p className="font-semibold text-white text-sm">{t.n}</p>
                    <p className="text-white/40 text-[.75rem]">{t.r}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── FAQ ──────────────────────────────────────────────────────────── */
const faqs = [
  { q: "Mennyibe kerül a Legitas?", a: "A Kezdő csomag tartósan ingyenes, havi 2 szerződéssel és AI asszisztenssel. A fizetős csomagok 975 Ft + áfa/hó-tól indulnak. Részletek az Árazás oldalon." },
  { q: "Jogilag érvényes az elektronikus aláírás?", a: "Igen. A Legitas eIDAS-kompatibilis egyszerű elektronikus aláírást használ, amely a legtöbb üzleti szerződésnél jogilag érvényes. A Ptk. 6:63. § szerint a szerződés alaki kötöttség hiányában szóban is megköthető." },
  { q: "Biztonságban vannak az adataim?", a: "Az adatokat titkosítva, EU-ban található Cloudflare R2 szerveren tároljuk. A platform GDPR-kompatibilis, és minden dokumentumot SHA-256 hash-sel védünk." },
  { q: "Használhatom mobilról is?", a: "Igen, a Legitas reszponzív webalkalmazás. Az aláírók emailben kapott linkkel mobilról is aláírhatnak — alkalmazás telepítése nélkül." },
  { q: "Kell hozzá jogi szaktudás?", a: "Nem. A sablonok jogász által ellenőrzöttek, a wizard végigvezet a kitöltésen, és az AI figyelmeztet a hiányzó elemekre. De a platform nem helyettesíti a jogi tanácsadást." },
  { q: "Lehet-e saját sablont feltölteni?", a: "Igen, a Közepes és Prémium csomagokban saját sablonokat is létrehozhatsz és szerkeszthetsz a beépített szerkesztővel." },
];

function FAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  return (
    <section className="py-20 lg:py-28 bg-[#F0F5F7] dark:bg-[#243545]">
      <div className="max-w-3xl mx-auto px-5">
        <Reveal>
          <div className="text-center mb-14">
            <div className="w-10 h-1 rounded-full bg-gradient-to-r from-[#46A0A0] to-[#D29B01] mx-auto mb-4" />
            <h2 className="text-[clamp(1.7rem,3vw,2.3rem)] font-extrabold text-[#1E2E38] dark:text-white mb-3">Gyakran ismételt kérdések</h2>
          </div>
        </Reveal>
        <div className="space-y-3">
          {faqs.map((f, i) => (
            <Reveal key={i} delay={i * 60}>
              <div className="bg-white dark:bg-[#283D4E] rounded-xl border border-[#DDE7EC] dark:border-[#446070] overflow-hidden">
                <button
                  onClick={() => setOpenIdx(openIdx === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left"
                >
                  <span className="font-semibold text-[#1E2E38] dark:text-white text-[.95rem] pr-4">{f.q}</span>
                  <svg className={`w-5 h-5 shrink-0 text-[#6B8290] transition-transform duration-200 ${openIdx === i ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${openIdx === i ? "max-h-40 pb-4" : "max-h-0"}`}>
                  <p className="px-6 text-[#6B8290] dark:text-[#96B5C6] text-[.9rem] leading-relaxed">{f.a}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── CTA ───────────────────────────────────────────────────────────── */
function CTA() {
  return (
    <section className="py-20 lg:py-24 bg-[#F8FAFB] dark:bg-[#1F2F3D] relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full opacity-30" style={{ background: "radial-gradient(circle,#E8F5F5 0%,transparent 70%)" }} />
      <div className="relative max-w-3xl mx-auto px-5 text-center">
        <Reveal>
          <div className="inline-flex items-center gap-2 bg-[#E8F5F5] dark:bg-[#46A0A0]/20 px-4 py-1.5 rounded-full mb-6">
            <Ico d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" className="w-4 h-4 text-[#46A0A0]" />
            <span className="text-[#46A0A0] text-[.82rem] font-medium">Tartósan ingyenes Kezdő csomag</span>
          </div>
        </Reveal>
        <Reveal delay={80}>
          <h2 className="text-[clamp(1.8rem,3.5vw,2.8rem)] font-extrabold text-[#1E2E38] dark:text-white mb-5 leading-tight">
            Indulj el ingyen,<br /><span className="text-[#D29B01]">fizess, ha kinövöd.</span>
          </h2>
        </Reveal>
        <Reveal delay={160}>
          <p className="text-[#6B8290] dark:text-[#96B5C6] text-lg mb-9 max-w-xl mx-auto">Csatlakozz a magyar vállalkozásokhoz, akik már papír nélkül szerződnek.</p>
        </Reveal>
        <Reveal delay={240}>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register" className="inline-flex items-center justify-center gap-2 bg-[#D29B01] hover:bg-[#F0C246] text-white font-bold px-10 py-4 rounded-xl transition-all hover:-translate-y-px shadow-lg shadow-[#D29B01]/25 text-lg">
              Regisztrálok ingyen
              <Ico d="M13 7l5 5m0 0l-5 5m5-5H6" className="w-5 h-5" />
            </Link>
          </div>
        </Reveal>
        <Reveal delay={320}>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-8 text-[#6B8290] text-sm">
            {["Nem kell bankkártya", "Tartósan ingyenes Kezdő csomag", "Bármikor upgrade-elhető"].map(t => (
              <span key={t} className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-[#46A0A0]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                {t}
              </span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ── FOOTER ────────────────────────────────────────────────────────── */
function Foot() {
  const { t } = useI18n();
  return (
    <footer className="bg-[#0F1A22] text-[rgba(255,255,255,.55)]">
      <div className="max-w-7xl mx-auto px-5 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#2F6482] to-[#46A0A0] flex items-center justify-center"><span className="text-white font-bold text-sm">L</span></div>
              <span className="text-white font-semibold text-lg">Legit<span className="text-[#46A0A0]">as</span></span>
            </div>
            <p className="text-[.85rem] leading-relaxed">A magyar KKV-k szerződéskezelő platformja.</p>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm">{t("footer.product")}</h3>
            <ul className="space-y-2 text-[.85rem]">
              <li><Link href="#funkciok" className="hover:text-white transition">{t("footer.features")}</Link></li>
              <li><Link href="/pricing" className="hover:text-white transition">{t("footer.pricing")}</Link></li>
              <li><Link href="/blog" className="hover:text-white transition">{t("footer.blog")}</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm">{t("footer.legal")}</h3>
            <ul className="space-y-2 text-[.85rem]">
              <li><Link href="/adatvedelem" className="hover:text-white transition">{t("footer.privacy")}</Link></li>
              <li><Link href="/aszf" className="hover:text-white transition">{t("footer.terms")}</Link></li>
              <li><Link href="/cookie" className="hover:text-white transition">{t("footer.cookies")}</Link></li>
              <li><Link href="/impresszum" className="hover:text-white transition">Impresszum</Link></li>
              <li><Link href="/dpa" className="hover:text-white transition">DPA</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm">{t("footer.contact")}</h3>
            <ul className="space-y-2 text-[.85rem]">
              <li><a href="mailto:info@legitas.hu" className="hover:text-white transition">info@legitas.hu</a></li>
              <li>{t("footer.location")}</li>
              <li className="pt-2"><Link href="/portal" className="text-[#46A0A0] hover:text-white transition">Aláírói portál</Link></li>
              <li><Link href="/status" className="hover:text-white transition">Rendszer állapot</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-[.8rem]">&copy; {new Date().getFullYear()} {t("footer.copyright")}</p>
          <p className="text-[.72rem] text-white/30">{t("footer.disclaimer")}</p>
        </div>
      </div>
    </footer>
  );
}
