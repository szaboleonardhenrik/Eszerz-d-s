"use client";

import { useI18n } from "@/lib/i18n";

export default function LanguageSwitcher({ variant = "dark" }: { variant?: "dark" | "light" }) {
  const { locale, setLocale, t } = useI18n();

  const isDark = variant === "dark";

  return (
    <button
      onClick={() => setLocale(locale === "hu" ? "en" : "hu")}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
        isDark
          ? "hover:bg-white/10 text-white/80"
          : "hover:bg-[#F0F5F7] text-[#4A6575]"
      }`}
      title={locale === "hu" ? t("languageSwitcher.switchToEnglish") : t("languageSwitcher.switchToHungarian")}
    >
      <span className="uppercase">{locale === "hu" ? "EN" : "HU"}</span>
    </button>
  );
}
