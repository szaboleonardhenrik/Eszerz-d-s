"use client";

import { useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import toast from "react-hot-toast";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
    } catch {
      toast.error("Hiba történt, próbáld újra később");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/landing" className="inline-flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-brand-teal-dark flex items-center justify-center">
              <span className="text-white font-bold text-sm">SZ</span>
            </div>
            <span className="text-lg font-bold text-gray-900">
              <span className="text-brand-teal-dark">Szerződés</span>Portál
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Elfelejtett jelszó</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Add meg az email címedet és küldünk egy jelszó-visszaállító linket
          </p>
        </div>

        {sent ? (
          <div className="bg-white rounded-2xl shadow-sm border p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Email elküldve!</h2>
            <p className="text-sm text-gray-500 mb-4">
              Ha a megadott email cím regisztrálva van, küldtünk egy jelszó-visszaállító linket.
              Nézd meg a postafiókodat (és a spam mappát is).
            </p>
            <Link href="/login" className="text-brand-teal-dark font-semibold text-sm hover:underline">
              Vissza a bejelentkezéshez
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border p-8 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email cím</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-brand-teal/50 focus:border-brand-teal outline-none transition"
                placeholder="pelda@ceg.hu"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-teal-dark text-white py-3 rounded-xl font-semibold hover:bg-brand-teal-darker disabled:opacity-50 transition"
            >
              {loading ? "Küldés..." : "Jelszó-visszaállító link küldése"}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-gray-500 mt-6">
          <Link href="/login" className="text-brand-teal-dark font-semibold hover:underline">
            Vissza a bejelentkezéshez
          </Link>
        </p>
      </div>
    </div>
  );
}
