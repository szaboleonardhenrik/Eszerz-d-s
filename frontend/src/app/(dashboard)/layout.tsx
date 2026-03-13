"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useAuth } from "@/lib/auth-store";
import api from "@/lib/api";
import NotificationBell from "@/components/notification-bell";
import ThemeToggle from "@/components/theme-toggle";
import LanguageSwitcher from "@/components/language-switcher";
import KeyboardShortcutsHelp, { useKeyboardShortcuts } from "@/components/keyboard-shortcuts";
import ConsentUpdateModal from "@/components/consent-update-modal";
import { useI18n } from "@/lib/i18n";
import GlobalSearch from "@/components/global-search";
import MaintenanceBanner from "@/components/maintenance-banner";

// Lazy-load heavy components (code-splitting)
const OnboardingWizard = dynamic(() => import("@/components/onboarding-wizard"), { ssr: false });
const OnboardingTour = dynamic(() => import("@/components/onboarding-tour"), { ssr: false });
const TrialBanner = dynamic(() => import("@/components/trial-banner"), { ssr: false });
const ChatWidget = dynamic(() => import("@/components/chat-widget"), { ssr: false });

const navItemKeys = [
  { href: "/dashboard", labelKey: "nav.home", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { href: "/create", labelKey: "nav.newContract", icon: "M12 4v16m8-8H4" },
  { href: "/templates", labelKey: "nav.templates", icon: "M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" },
  { href: "/quotes", labelKey: "nav.quotes", icon: "M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" },
  { href: "/contacts", labelKey: "nav.contacts", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
  { href: "/analytics", labelKey: "nav.analytics", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
  { href: "/calendar", labelKey: "nav.calendar", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
  { href: "/reminders", labelKey: "nav.reminders", icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" },
];

const adminNavItem = {
  href: "/admin",
  labelKey: "nav.admin",
  icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, loadProfile, logout } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [creditBalance, setCreditBalance] = useState<number | null>(null);
  const { showHelp, setShowHelp } = useKeyboardShortcuts();

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (user) {
      api.get("/credits/balance").then((res) => {
        setCreditBalance(res.data.data.balance ?? 0);
      }).catch(() => {});
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-sm text-gray-400">Betöltés...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <MaintenanceBanner />
      <TrialBanner />
      <nav className="bg-gradient-to-r from-brand-teal-dark to-brand-teal border-b border-brand-teal-dark/30 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top row: logo + actions */}
          <div className="flex justify-between items-center h-14">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <span className="text-white font-bold text-sm">L</span>
              </div>
              <span className="text-lg font-bold text-white hidden sm:inline">
                Legitas
              </span>
            </Link>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <GlobalSearch />
              <LanguageSwitcher />
              <ThemeToggle />
              <NotificationBell />
              {creditBalance !== null && (
                <Link
                  href="/settings/billing"
                  className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition text-white text-xs font-medium"
                  title="Kredit egyenleg"
                >
                  <svg className="w-4 h-4 text-brand-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {creditBalance} kredit
                </Link>
              )}
              <button
                onClick={() => setMobileNav(!mobileNav)}
                className="lg:hidden p-2 rounded-lg hover:bg-white/10"
              >
                <svg className="w-5 h-5 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileNav ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                </svg>
              </button>
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-lg hover:bg-white/10 transition"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-semibold">
                    {user.name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase()}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-white leading-none">{user.name}</p>
                    <p className="text-xs mt-0.5">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        user.subscriptionTier === "pro" || user.subscriptionTier === "pro_trial"
                          ? "bg-white/20 text-white"
                          : user.subscriptionTier === "basic"
                          ? "bg-white/20 text-white"
                          : "bg-white/15 text-white/80"
                      }`}>{user.subscriptionTier === "pro_trial" ? t("trial.proTrial") : user.subscriptionTier} {t("auth.plan")}</span>
                    </p>
                  </div>
                  <svg className="w-4 h-4 text-white/60 hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-48 sm:w-56 bg-white dark:bg-gray-800 rounded-xl shadow-lg border dark:border-gray-700 z-50 py-2">
                      <div className="px-4 py-2 border-b dark:border-gray-700">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.name}</p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                        <p className="text-xs text-gray-400 mt-0.5">Szerepkör: {{ superadmin: "Szuperadmin", employee: "Munkatárs", user: "Felhasználó" }[user.role ?? "user"] ?? user.role}</p>
                      </div>
                      {["superadmin", "employee"].includes(user.role ?? "") && (
                        <Link
                          href="/admin"
                          onClick={() => setMenuOpen(false)}
                          className="block px-4 py-2.5 text-sm text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 font-medium"
                        >
                          Admin panel
                        </Link>
                      )}
                      <Link
                        href="/settings"
                        onClick={() => setMenuOpen(false)}
                        className="block px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        {t("nav.settings")}
                      </Link>
                      <Link
                        href="/settings/billing"
                        onClick={() => setMenuOpen(false)}
                        className="block px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        {t("settings.billing")}
                      </Link>
                      <Link
                        href="/archive"
                        onClick={() => setMenuOpen(false)}
                        className="block px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        {t("nav.archive")}
                      </Link>
                      <Link
                        href="/bulk-send"
                        onClick={() => setMenuOpen(false)}
                        className="block px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        {t("nav.bulkSend")}
                      </Link>
                      <div className="border-t dark:border-gray-700 mt-1 pt-1">
                        <button
                          onClick={() => { setMenuOpen(false); logout(); }}
                          className="block w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          {t("auth.logout")}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>
      {/* Secondary navigation row — separate from the blue header */}
      <div className="hidden lg:block border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1.5">
          <div className={`inline-flex gap-1 rounded-xl px-2 py-1 transition-colors ${
            pathname === "/dashboard" ? "bg-brand-teal-dark/8 dark:bg-brand-teal/10" : ""
          }`}>
            {[...navItemKeys, ...(["superadmin", "employee"].includes(user.role ?? "") ? [adminNavItem] : [])].map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? "bg-brand-teal-dark text-white shadow-sm"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                  </svg>
                  {t(item.labelKey)}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
      {mobileNav && (
        <>
          <div className="fixed inset-0 bg-black/20 z-40 lg:hidden" onClick={() => setMobileNav(false)} />
          <div className="fixed inset-y-0 left-0 w-64 sm:w-72 bg-white dark:bg-gray-800 border-r dark:border-gray-700 shadow-xl z-50 lg:hidden overflow-y-auto">
            <div className="flex items-center justify-between px-4 h-16 border-b border-gray-100 dark:border-gray-700">
              <Link href="/dashboard" className="flex items-center gap-2" onClick={() => setMobileNav(false)}>
                <div className="w-8 h-8 rounded-lg bg-brand-teal-dark flex items-center justify-center">
                  <span className="text-white font-bold text-sm">L</span>
                </div>
                <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  <span className="text-brand-teal-dark">Legitas</span>
                </span>
              </Link>
              <button onClick={() => setMobileNav(false)} className="p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-3 py-4 space-y-1">
              {[...navItemKeys, ...(["superadmin", "employee"].includes(user.role ?? "") ? [adminNavItem] : [])].map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                const isAdmin = item.href === "/admin";
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileNav(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                      isActive
                        ? isAdmin
                          ? "bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400"
                          : "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                        : isAdmin
                          ? "text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20"
                          : "text-gray-800 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                    </svg>
                    {t(item.labelKey)}
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-4 sm:py-8 pb-20 lg:pb-8">
        {children}
      </main>

      {/* ── Mobile bottom navigation ── */}
      <div className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 safe-area-bottom">
        <div className="flex items-center justify-around px-1 py-1.5">
          {navItemKeys.slice(0, 5).map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg min-w-[52px] transition ${
                  isActive
                    ? "text-brand-teal-dark dark:text-brand-teal bg-brand-teal-dark/8 dark:bg-brand-teal/10"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isActive ? 2 : 1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                </svg>
                <span className="text-[11px] font-medium leading-none">{t(item.labelKey)}</span>
              </Link>
            );
          })}
          <button
            onClick={() => setMobileNav(!mobileNav)}
            className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg min-w-[52px] text-gray-500 dark:text-gray-400"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
            <span className="text-[11px] font-medium leading-none">{t("nav.more")}</span>
          </button>
        </div>
      </div>

      <OnboardingWizard />
      <OnboardingTour />
      <KeyboardShortcutsHelp open={showHelp} onClose={() => setShowHelp(false)} />
      <ChatWidget />
      <ConsentUpdateModal />
    </div>
  );
}
