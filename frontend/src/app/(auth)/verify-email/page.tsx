"use client";

import { useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import Logo from "@/components/logo";
import toast from "react-hot-toast";

export default function VerifyEmailPromptPage() {
  const [resending, setResending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleResend = async () => {
    setResending(true);
    try {
      await api.post("/auth/resend-verification");
      setSent(true);
      toast.success("Megerősítő email elküldve!");
    } catch {
      toast.error("Nem sikerült elküldeni. Kérjük, próbáld újra később.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md text-center">
        <Link href="/landing" className="inline-flex items-center gap-2 mb-8">
          <Logo />
        </Link>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border dark:border-gray-700 p-8">
          <div className="w-16 h-16 bg-brand-teal/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-brand-teal-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Erősítsd meg az email címedet!
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
            Küldtünk egy megerősítő emailt a regisztrációkor megadott címre.
            Kérjük, kattints az emailben található linkre a fiókod aktiválásához.
          </p>

          <div className="space-y-3">
            <Link
              href="/dashboard"
              className="block w-full bg-brand-teal-dark text-white py-2.5 rounded-xl font-semibold hover:bg-brand-teal-darker transition"
            >
              Tovább az irányítópultra
            </Link>

            <button
              onClick={handleResend}
              disabled={resending || sent}
              className="block w-full py-2.5 rounded-xl text-sm font-medium border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50"
            >
              {sent ? "Email elküldve!" : resending ? "Küldés..." : "Megerősítő email újraküldése"}
            </button>
          </div>

          <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
            Nem kaptad meg? Ellenőrizd a spam mappát is.
          </p>
        </div>
      </div>
    </div>
  );
}
