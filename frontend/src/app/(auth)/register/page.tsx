"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-store";
import { useI18n } from "@/lib/i18n";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    accountType: "company" as "company" | "personal",
    companyName: "",
    taxNumber: "",
    companyAddress: "",
    acceptTerms: false,
  });
  const [loading, setLoading] = useState(false);
  const register = useAuth((s) => s.register);
  const { t } = useI18n();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.accountType === "company" && form.taxNumber && !/^\d{8}-\d{1,2}-\d{2}$/.test(form.taxNumber)) {
      toast.error("Érvénytelen adószám formátum (helyes: 12345678-1-23)");
      return;
    }
    setLoading(true);
    try {
      await register(form);
      toast.success(t("auth.success.register"));
      router.push("/dashboard");
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.error?.message || t("auth.error.register");
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setLoading(false);
    }
  };

  const formatTaxNumber = (raw: string): string => {
    const digits = raw.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 8) return digits;
    if (digits.length <= 9) return `${digits.slice(0, 8)}-${digits.slice(8)}`;
    return `${digits.slice(0, 8)}-${digits.slice(8, 9)}-${digits.slice(9)}`;
  };

  const update = (field: string, value: string) =>
    setForm((f) => ({ ...f, [field]: field === "taxNumber" ? formatTaxNumber(value) : value }));

  return (
    <div className="min-h-screen flex">
      {/* Left — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-teal-dark via-brand-teal to-brand-teal-muted items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 right-10 w-72 h-72 bg-brand-gold rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-10 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
        <div className="relative text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-8">
            <span className="text-white font-bold text-2xl">L</span>
          </div>
          <h2 className="text-3xl font-extrabold text-white mb-4">
            {t("auth.joinNow")}
          </h2>
          <p className="text-white/70 text-lg leading-relaxed">
            Hozd létre fiókodat 30 másodperc alatt, és kezd el a szerződéseid digitális kezelését.
          </p>
          <div className="mt-10 space-y-4 text-left max-w-xs mx-auto">
            {[
              "3 szerződés havonta ingyen",
              "Jogász által ellenőrzött sablonok",
              "Digitális aláírás bárhonnan",
              "Nem kell bankkártya",
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-brand-gold/20 flex items-center justify-center shrink-0">
                  <svg className="w-3.5 h-3.5 text-brand-gold" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-white/80 text-sm">{item}</span>
              </div>
            ))}
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t("auth.createAccount")}</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">{t("auth.registerSubtitle")}</p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border dark:border-gray-700 p-8 space-y-4"
          >
            {/* Account type toggle */}
            <div className="flex rounded-xl border dark:border-gray-600 overflow-hidden">
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, accountType: "company" }))}
                className={`flex-1 py-2.5 text-sm font-medium transition ${form.accountType === "company" ? "bg-brand-teal-dark text-white" : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"}`}
              >
                Cég / Egyéni vállalkozó
              </button>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, accountType: "personal", companyName: "", taxNumber: "", companyAddress: "" }))}
                className={`flex-1 py-2.5 text-sm font-medium transition ${form.accountType === "personal" ? "bg-brand-teal-dark text-white" : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"}`}
              >
                Magánszemély
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("auth.name")} {t("auth.required")}</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                required
                className="w-full px-4 py-2.5 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-brand-teal/50 focus:border-brand-teal outline-none transition dark:bg-gray-700 dark:text-gray-100"
                placeholder="Kovács János"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("auth.email")} {t("auth.required")}</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                required
                className="w-full px-4 py-2.5 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-brand-teal/50 focus:border-brand-teal outline-none transition dark:bg-gray-700 dark:text-gray-100"
                placeholder="kovacs@ceg.hu"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("auth.password")} {t("auth.required")}</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                required
                minLength={8}
                className="w-full px-4 py-2.5 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-brand-teal/50 focus:border-brand-teal outline-none transition dark:bg-gray-700 dark:text-gray-100"
                placeholder="Min. 8 karakter, kis- és nagybetű, szám, speciális karakter"
              />
              {form.password && !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/.test(form.password) && (
                <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                  A jelszónak tartalmaznia kell kis- és nagybetűt, számot, valamint speciális karaktert (!@#$%... stb.)
                </p>
              )}
            </div>

            {/* Company fields — only for company accounts */}
            {form.accountType === "company" && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("auth.companyName")}</label>
                    <input
                      type="text"
                      value={form.companyName}
                      onChange={(e) => update("companyName", e.target.value)}
                      className="w-full px-4 py-2.5 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-brand-teal/50 focus:border-brand-teal outline-none transition dark:bg-gray-700 dark:text-gray-100"
                      placeholder="Példa Kft."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("auth.taxNumber")}</label>
                    <input
                      type="text"
                      value={form.taxNumber}
                      onChange={(e) => update("taxNumber", e.target.value)}
                      maxLength={13}
                      className="w-full px-4 py-2.5 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-brand-teal/50 focus:border-brand-teal outline-none transition dark:bg-gray-700 dark:text-gray-100"
                      placeholder="12345678-1-23"
                    />
                    {form.taxNumber && (
                      <div className="flex items-center justify-between mt-1">
                        <p className={`text-xs ${/^\d{8}-\d{1,2}-\d{2}$/.test(form.taxNumber) ? "text-green-500 dark:text-green-400" : "text-red-500 dark:text-red-400"}`}>
                          {/^\d{8}-\d{1,2}-\d{2}$/.test(form.taxNumber) ? "Érvényes adószám" : "Érvénytelen formátum (helyes: 12345678-1-23)"}
                        </p>
                        <span className={`text-xs ${form.taxNumber.replace(/\D/g, "").length === 11 ? "text-green-500" : "text-gray-400"}`}>
                          {form.taxNumber.replace(/\D/g, "").length}/11 számjegy
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Székhely</label>
                  <input
                    type="text"
                    value={form.companyAddress}
                    onChange={(e) => update("companyAddress", e.target.value)}
                    className="w-full px-4 py-2.5 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-brand-teal/50 focus:border-brand-teal outline-none transition dark:bg-gray-700 dark:text-gray-100"
                    placeholder="1234 Budapest, Példa utca 1."
                  />
                </div>
              </>
            )}

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.acceptTerms}
                onChange={(e) => setForm((f) => ({ ...f, acceptTerms: e.target.checked }))}
                className="mt-0.5 w-4 h-4 rounded border-gray-300 dark:border-gray-600 accent-brand-teal-dark"
              />
              <span className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                Elolvastam és elfogadom az{" "}
                <Link href="/aszf" target="_blank" className="text-brand-teal-dark font-medium underline hover:text-brand-teal">
                  Általános Szerződési Feltételeket
                </Link>{" "}
                és az{" "}
                <Link href="/adatvedelem" target="_blank" className="text-brand-teal-dark font-medium underline hover:text-brand-teal">
                  Adatvédelmi Tájékoztatót
                </Link>
                . *
              </span>
            </label>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-relaxed -mt-1 ml-7">
              A regisztrációval digitális tartalomszolgáltatásra fizet elő. A 45/2014. (II. 26.) Korm. rendelet alapján 14 napon belül indokolás nélkül elállhat.
            </p>

            <button
              type="submit"
              disabled={loading || !form.acceptTerms}
              className="w-full bg-brand-gold text-white py-3 rounded-xl font-semibold hover:bg-brand-gold-dark disabled:opacity-50 transition shadow-sm"
            >
              {loading ? t("auth.registering") : t("auth.registerFree")}
            </button>

            <div className="relative flex items-center gap-3 my-1">
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-600" />
              <span className="text-xs text-gray-400 dark:text-gray-500">{t("common.or")}</span>
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-600" />
            </div>

            {form.acceptTerms ? (
              <a
                href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/auth/google`}
                className="w-full flex items-center justify-center gap-3 bg-white dark:bg-gray-700 border dark:border-gray-600 py-2.5 rounded-xl font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                {t("auth.googleRegister")}
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="w-full flex items-center justify-center gap-3 bg-white dark:bg-gray-700 border dark:border-gray-600 py-2.5 rounded-xl font-medium text-gray-400 dark:text-gray-500 opacity-50 cursor-not-allowed transition"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                {t("auth.googleRegister")}
              </button>
            )}
          </form>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
            {t("auth.hasAccount")}{" "}
            <Link href="/login" className="text-brand-teal-dark font-semibold hover:underline">
              {t("auth.login")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
