"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/settings", label: "Profil" },
  { href: "/settings/security", label: "Biztonság" },
  { href: "/settings/team", label: "Csapat" },
  { href: "/settings/api", label: "API kulcsok" },
  { href: "/settings/notifications", label: "Értesítések" },
  { href: "/settings/webhooks", label: "Webhookok" },
  { href: "/settings/billing", label: "Előfizetés" },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Beállítások</h1>
      <div className="flex gap-1 border-b mb-8">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition ${
              pathname === tab.href
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>
      {children}
    </div>
  );
}
