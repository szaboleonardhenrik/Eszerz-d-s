"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-store";
import { useI18n } from "@/lib/i18n";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const login = useAuth((s) => s.login);
  const { t } = useI18n();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await login(email, password);
      if (result?.requiresMfa) {
        router.push(`/2fa-verify?t=${encodeURIComponent(result.mfaToken)}`);
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      toast.error(
        err.response?.data?.error?.message ?? t("auth.error.login")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-teal-dark via-brand-teal to-brand-teal-muted items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-brand-gold rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
        <div className="relative text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-8">
            <span className="text-white font-bold text-2xl">L</span>
          </div>
          <h2 className="text-3xl font-extrabold text-white mb-4">
            {t("auth.welcomeBack")}
          </h2>
          <p className="text-white/70 text-lg leading-relaxed">
            Kezeld szerződéseidet egyetlen platformon — gyorsan, biztonságosan, papír nélkül.
          </p>
          <div className="mt-12 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-white">500+</p>
              <p className="text-white/50 text-xs mt-1">Ügyfél</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">12K+</p>
              <p className="text-white/50 text-xs mt-1">Szerződés</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">99%</p>
              <p className="text-white/50 text-xs mt-1">Elégedettség</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/landing" className="inline-flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-brand-teal-dark flex items-center justify-center">
                <span className="text-white font-bold text-sm">L</span>
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Legitas
              </span>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t("auth.login")}</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">{t("auth.loginSubtitle")}</p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border dark:border-gray-700 p-8 space-y-5"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("auth.email")}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                data-testid="login-email"
                className="w-full px-4 py-2.5 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-brand-teal/50 focus:border-brand-teal outline-none transition dark:bg-gray-700 dark:text-gray-100"
                placeholder="pelda@ceg.hu"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("auth.password")}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                data-testid="login-password"
                className="w-full px-4 py-2.5 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-brand-teal/50 focus:border-brand-teal outline-none transition dark:bg-gray-700 dark:text-gray-100"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              data-testid="login-submit"
              className="w-full bg-brand-teal-dark text-white py-3 rounded-xl font-semibold hover:bg-brand-teal-darker disabled:opacity-50 transition"
            >
              {loading ? t("auth.loggingIn") : t("auth.loginBtn")}
            </button>

            <div className="text-right">
              <Link href="/forgot-password" className="text-sm text-brand-teal-dark hover:underline">
                {t("auth.forgotPassword")}?
              </Link>
            </div>

            <div className="relative flex items-center gap-3 my-1">
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-600" />
              <span className="text-xs text-gray-400 dark:text-gray-500">{t("common.or")}</span>
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-600" />
            </div>

            <a
              href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/auth/google`}
              data-testid="login-google"
              className="w-full flex items-center justify-center gap-3 bg-white dark:bg-gray-700 border dark:border-gray-600 py-2.5 rounded-xl font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {t("auth.googleLogin")}
            </a>
          </form>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
            {t("auth.noAccount")}{" "}
            <Link href="/register" className="text-brand-teal-dark font-semibold hover:underline">
              {t("auth.register")}
            </Link>
          </p>
          <p className="text-center text-sm text-gray-400 dark:text-gray-500 mt-3">
            <Link href="/portal" className="hover:text-brand-teal-dark transition hover:underline">
              {t("auth.clientPortal")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
