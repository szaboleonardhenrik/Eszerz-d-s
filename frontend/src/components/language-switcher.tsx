"use client";

import { useI18n, Locale } from "@/lib/i18n";

export default function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();

  return (
    <button
      onClick={() => setLocale(locale === "hu" ? "en" : "hu")}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-600 dark:text-gray-400"
      title={locale === "hu" ? "Switch to English" : "Magyarra váltás"}
    >
      <span className="uppercase">{locale === "hu" ? "EN" : "HU"}</span>
    </button>
  );
}
