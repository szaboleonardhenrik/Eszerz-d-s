"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import Logo from "@/components/logo";

export default function VerifyEmailPage() {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const doVerify = async () => {
      try {
        await api.post("/auth/verify-email", { token });
        setStatus("success");
      } catch (err: unknown) {
        const axiosMsg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
        setErrorMsg(axiosMsg ?? "Érvénytelen vagy lejárt link");
        setStatus("error");
      }
    };
    doVerify();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md text-center">
        <Link href="/landing" className="inline-flex items-center gap-2 mb-8">
          <Logo />
        </Link>

        {status === "loading" && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border dark:border-gray-700 p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-teal-dark mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Email megerősítése...</p>
          </div>
        )}

        {status === "success" && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border dark:border-gray-700 p-8">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Email megerősítve!</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Az email címed sikeresen megerősítve. Most már minden funkció elérhető.</p>
            <Link
              href="/dashboard"
              className="inline-block bg-brand-teal-dark text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-brand-teal-darker transition"
            >
              Tovább az irányítópultra
            </Link>
          </div>
        )}

        {status === "error" && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border dark:border-gray-700 p-8">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Hiba</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{errorMsg}</p>
            <Link
              href="/login"
              className="inline-block bg-brand-teal-dark text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-brand-teal-darker transition"
            >
              Vissza a bejelentkezéshez
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
