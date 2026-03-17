"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-store";

const PLAN_ORDER = ["free", "starter", "medium", "premium", "enterprise"];

const tabs: { href: string; label: string; minTier?: string }[] = [
  { href: "/settings", label: "Profil" },
  { href: "/settings/security", label: "Biztonság" },
  { href: "/settings/team", label: "Csapat", minTier: "medium" },
  { href: "/settings/api", label: "API kulcsok", minTier: "premium" },
  { href: "/settings/tags", label: "Címkék" },
  { href: "/settings/notifications", label: "Értesítések" },
  { href: "/settings/webhooks", label: "Webhookok", minTier: "premium" },
  { href: "/settings/branding", label: "Arculat", minTier: "premium" },
  { href: "/settings/billing", label: "Előfizetés" },
  { href: "/settings/invoicing", label: "Számlázás", minTier: "starter" },
  { href: "/settings/referral", label: "Ajánlás" },
  { href: "/settings/portal", label: "Ügyfélportál", minTier: "medium" },
];

function hasAccess(userTier: string, minTier?: string): boolean {
  if (!minTier) return true;
  return PLAN_ORDER.indexOf(userTier) >= PLAN_ORDER.indexOf(minTier);
}

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const tier = user?.subscriptionTier ?? "free";

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Beállítások</h1>
      <div className="flex gap-1 border-b mb-8 overflow-x-auto">
        {tabs.map((tab) => {
          const locked = !hasAccess(tier, tab.minTier);
          return (
            <Link
              key={tab.href}
              href={locked ? "/settings/billing" : tab.href}
              title={locked ? `${tab.minTier === "starter" ? "Kezdő" : tab.minTier === "medium" ? "Közepes" : "Prémium"}+ csomag szükséges` : undefined}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition whitespace-nowrap flex items-center gap-1.5 ${
                pathname === tab.href
                  ? "border-blue-600 text-blue-600"
                  : locked
                    ? "border-transparent text-gray-400 cursor-default"
                    : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
              {locked && (
                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              )}
            </Link>
          );
        })}
      </div>
      {children}
    </div>
  );
}
