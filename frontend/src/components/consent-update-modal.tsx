"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-store";
import api from "@/lib/api";

export default function ConsentUpdateModal() {
  const { requiresConsentUpdate, clearConsentUpdate } = useAuth();
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!requiresConsentUpdate) return null;

  const handleAccept = async () => {
    setLoading(true);
    setError("");
    try {
      await api.post("/auth/update-consent");
      clearConsentUpdate();
    } catch {
      setError("Hiba történt. Kérjük, próbáld újra.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Frissített feltételek
          </h2>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
          Az Általános Szerződési Feltételeink és Adatvédelmi Tájékoztatónk frissült.
          A szolgáltatás további használatához kérjük, fogadd el a módosított feltételeket.
        </p>

        <div className="flex gap-3 mb-5">
          <a
            href="/aszf"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-[#198296] hover:underline font-medium"
          >
            ÁSZF megtekintése
          </a>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <a
            href="/adatvedelem"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-[#198296] hover:underline font-medium"
          >
            Adatvédelmi Tájékoztató
          </a>
        </div>

        <label className="flex items-start gap-3 cursor-pointer mb-5">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300 leading-snug">
            Elolvastam és elfogadom a frissített ÁSZF-et és Adatvédelmi Tájékoztatót
          </span>
        </label>

        {error && (
          <p className="text-sm text-red-600 mb-3">{error}</p>
        )}

        <button
          onClick={handleAccept}
          disabled={!accepted || loading}
          className="w-full py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {loading ? "Feldolgozás..." : "Elfogadom"}
        </button>
      </div>
    </div>
  );
}
