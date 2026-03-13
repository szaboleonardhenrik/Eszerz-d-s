"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

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
  const [visible, setVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [hasConsent, setHasConsent] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(DEFAULT_PREFERENCES);

  useEffect(() => {
    const stored = localStorage.getItem("cookie_consent");
    if (!stored) {
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
  };

  const acceptAll = () => {
    savePreferences(ALL_ACCEPTED);
  };

  const saveSelected = () => {
    savePreferences({ ...preferences, essential: true });
  };

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
          <div className="max-w-4xl mx-auto bg-gray-900 text-white rounded-2xl shadow-2xl p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-1">
                <p className="text-sm leading-relaxed">
                  Az oldal cookie-kat (sütiket) használ a működéshez és a felhasználói élmény javításához.{" "}
                  <Link href="/cookie" className="underline text-brand-gold hover:text-brand-gold-light">
                    Cookie szabályzat
                  </Link>
                </p>
              </div>
              {!showSettings && (
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => setShowSettings(true)}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700 transition"
                  >
                    Beállítások
                  </button>
                  <button
                    onClick={acceptAll}
                    className="px-5 py-2 rounded-lg text-sm font-semibold bg-brand-gold hover:bg-brand-gold-dark text-white transition"
                  >
                    Elfogadom mind
                  </button>
                </div>
              )}
            </div>

            {showSettings && (
              <div className="mt-4 border-t border-gray-700 pt-4 space-y-3">
                <label className="flex items-center gap-3 cursor-not-allowed">
                  <input
                    type="checkbox"
                    checked={true}
                    disabled
                    className="w-4 h-4 rounded accent-brand-gold opacity-60"
                  />
                  <span className="text-sm">
                    <strong>Szükséges</strong>{" "}
                    <span className="text-gray-400">— a weboldal alapvető működéséhez (mindig aktív)</span>
                  </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.functional}
                    onChange={(e) =>
                      setPreferences((p) => ({ ...p, functional: e.target.checked }))
                    }
                    className="w-4 h-4 rounded accent-brand-gold"
                  />
                  <span className="text-sm">
                    <strong>Funkcionális</strong>{" "}
                    <span className="text-gray-400">— felhasználói beállítások megjegyzése</span>
                  </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.analytics}
                    onChange={(e) =>
                      setPreferences((p) => ({ ...p, analytics: e.target.checked }))
                    }
                    className="w-4 h-4 rounded accent-brand-gold"
                  />
                  <span className="text-sm">
                    <strong>Analitika</strong>{" "}
                    <span className="text-gray-400">— látogatottsági statisztikák, fejlesztés</span>
                  </span>
                </label>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={saveSelected}
                    className="px-5 py-2 rounded-lg text-sm font-semibold bg-brand-gold hover:bg-brand-gold-dark text-white transition"
                  >
                    Mentés
                  </button>
                  <button
                    onClick={acceptAll}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700 transition"
                  >
                    Elfogadom mind
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {hasConsent && !visible && (
        <button
          onClick={resetConsent}
          className="fixed bottom-4 left-4 z-50 px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow transition"
        >
          Cookie beállítások
        </button>
      )}
    </>
  );
}
