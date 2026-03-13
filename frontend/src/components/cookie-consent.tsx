"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [hasConsent, setHasConsent] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie_consent");
    if (!consent) {
      setVisible(true);
    } else {
      setHasConsent(true);
    }
  }, []);

  const accept = () => {
    localStorage.setItem("cookie_consent", "accepted");
    window.dispatchEvent(new Event("cookie_consent_changed"));
    setVisible(false);
    setHasConsent(true);
  };

  const decline = () => {
    localStorage.setItem("cookie_consent", "essential_only");
    window.dispatchEvent(new Event("cookie_consent_changed"));
    setVisible(false);
    setHasConsent(true);
  };

  const resetConsent = () => {
    localStorage.removeItem("cookie_consent");
    window.dispatchEvent(new Event("cookie_consent_changed"));
    setHasConsent(false);
    setVisible(true);
  };

  return (
    <>
      {visible && (
        <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 sm:p-6">
          <div className="max-w-4xl mx-auto bg-gray-900 text-white rounded-2xl shadow-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <p className="text-sm leading-relaxed">
                Az oldal cookie-kat (sütiket) használ a működéshez és a felhasználói élmény javításához.{" "}
                <Link href="/cookie" className="underline text-brand-gold hover:text-brand-gold-light">
                  Cookie szabályzat
                </Link>
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={decline}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700 transition"
              >
                Csak szükségesek
              </button>
              <button
                onClick={accept}
                className="px-5 py-2 rounded-lg text-sm font-semibold bg-brand-gold hover:bg-brand-gold-dark text-white transition"
              >
                Elfogadom
              </button>
            </div>
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
