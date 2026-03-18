"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { useI18n } from "@/lib/i18n";

interface CookiePreferences {
  essential: boolean;
  functional: boolean;
  analytics: boolean;
}

const DEFAULT_PREFERENCES: CookiePreferences = {
  essential: true,
  functional: false,
  analytics: false,
};

const ALL_ACCEPTED: CookiePreferences = {
  essential: true,
  functional: true,
  analytics: true,
};

export default function CookieConsent() {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [hasConsent, setHasConsent] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(DEFAULT_PREFERENCES);

  useEffect(() => {
    const stored = localStorage.getItem("cookie_consent");
    if (!stored) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(true);
    } else {
      setHasConsent(true);
      try {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === "object" && "essential" in parsed) {
          setPreferences(parsed);
        }
      } catch {
        // legacy format, treat as all accepted
      }
    }
  }, []);

  const savePreferences = (prefs: CookiePreferences) => {
    localStorage.setItem("cookie_consent", JSON.stringify(prefs));
    window.dispatchEvent(new Event("cookie_consent_changed"));
    setPreferences(prefs);
    setVisible(false);
    setShowSettings(false);
    setHasConsent(true);
    toast.success("Cookie beállítások mentve");
  };

  const acceptAll = () => savePreferences(ALL_ACCEPTED);
  const essentialOnly = () => savePreferences(DEFAULT_PREFERENCES);
  const saveSelected = () => savePreferences({ ...preferences, essential: true });

  const resetConsent = () => {
    localStorage.removeItem("cookie_consent");
    window.dispatchEvent(new Event("cookie_consent_changed"));
    setHasConsent(false);
    setShowSettings(false);
    setPreferences(DEFAULT_PREFERENCES);
    setVisible(true);
  };

  return (
    <>
      {visible && (
        <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 sm:p-6">
          <div className="max-w-lg mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-5 sm:p-6">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
              {t("cookie.title")}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
              {t("cookie.description")}{" "}
              <Link href="/adatvedelem" className="underline text-brand-teal-dark dark:text-brand-teal hover:opacity-80">
                {t("cookie.policyLink")}
              </Link>
            </p>

            {showSettings && (
              <div className="mb-4 space-y-3 border-t border-gray-100 dark:border-gray-700 pt-4">
                <label className="flex items-center gap-3 cursor-not-allowed">
                  <input type="checkbox" checked disabled className="w-4 h-4 rounded accent-brand-teal-dark opacity-60" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    <strong>{t("cookie.essential")}</strong>
                    <span className="text-gray-400"> — {t("cookie.essentialDesc")}</span>
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.functional}
                    onChange={(e) => setPreferences((p) => ({ ...p, functional: e.target.checked }))}
                    className="w-4 h-4 rounded accent-brand-teal-dark"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    <strong>{t("cookie.functional")}</strong>
                    <span className="text-gray-400"> — {t("cookie.functionalDesc")}</span>
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.analytics}
                    onChange={(e) => setPreferences((p) => ({ ...p, analytics: e.target.checked }))}
                    className="w-4 h-4 rounded accent-brand-teal-dark"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    <strong>{t("cookie.analyticsLabel")}</strong>
                    <span className="text-gray-400"> — {t("cookie.analyticsDesc")}</span>
                  </span>
                </label>
                <div className="pt-2">
                  <button
                    onClick={saveSelected}
                    data-testid="cookie-save"
                    className="w-full py-2.5 rounded-xl text-sm font-semibold bg-brand-teal-dark hover:bg-brand-teal-darker text-white transition"
                  >
                    {t("cookie.save")}
                  </button>
                </div>
              </div>
            )}

            {!showSettings && (
              <div className="flex gap-2">
                <button
                  onClick={() => setShowSettings(true)}
                  data-testid="cookie-settings"
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                >
                  {t("cookie.settings")}
                </button>
                <button
                  onClick={essentialOnly}
                  data-testid="cookie-essential-only"
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                >
                  {t("cookie.essentialOnly")}
                </button>
                <button
                  onClick={acceptAll}
                  data-testid="cookie-accept-all"
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-brand-teal-dark hover:bg-brand-teal-darker text-white transition"
                >
                  {t("cookie.acceptAll")}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {hasConsent && !visible && (
        <button
          onClick={resetConsent}
          data-testid="cookie-withdrawal"
          className="fixed bottom-4 left-4 z-50 px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow transition"
        >
          {t("cookie.cookieSettings")}
        </button>
      )}
    </>
  );
}
