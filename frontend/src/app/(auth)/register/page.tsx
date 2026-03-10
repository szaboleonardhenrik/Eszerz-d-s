"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-store";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    companyName: "",
    taxNumber: "",
    acceptTerms: false,
  });
  const [loading, setLoading] = useState(false);
  const register = useAuth((s) => s.register);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      toast.success("Sikeres regisztráció!");
      router.push("/dashboard");
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.error?.message || "Hiba történt a regisztrációkor";
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setLoading(false);
    }
  };

  const update = (field: string, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

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
            <span className="text-white font-bold text-2xl">SZ</span>
          </div>
          <h2 className="text-3xl font-extrabold text-white mb-4">
            Csatlakozz most!
          </h2>
          <p className="text-white/70 text-lg leading-relaxed">
            Hozd létre fiókodat 30 másodperc alatt, és kezd el a szerződéseid digitális kezelését.
          </p>
          <div className="mt-10 space-y-4 text-left max-w-xs mx-auto">
            {[
              "5 szerződés havonta ingyen",
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
                <span className="text-white font-bold text-sm">SZ</span>
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                <span className="text-brand-teal-dark">Szerződés</span>Portál
              </span>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Fiók létrehozása</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Regisztrálj és kezdj el szerződni digitálisan</p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border dark:border-gray-700 p-8 space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Teljes név *</label>
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email cím *</label>
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Jelszó *</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                required
                minLength={8}
                className="w-full px-4 py-2.5 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-brand-teal/50 focus:border-brand-teal outline-none transition dark:bg-gray-700 dark:text-gray-100"
                placeholder="Legalább 8 karakter"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cégnév</label>
                <input
                  type="text"
                  value={form.companyName}
                  onChange={(e) => update("companyName", e.target.value)}
                  className="w-full px-4 py-2.5 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-brand-teal/50 focus:border-brand-teal outline-none transition dark:bg-gray-700 dark:text-gray-100"
                  placeholder="Példa Kft."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Adószám</label>
                <input
                  type="text"
                  value={form.taxNumber}
                  onChange={(e) => update("taxNumber", e.target.value)}
                  className="w-full px-4 py-2.5 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-brand-teal/50 focus:border-brand-teal outline-none transition dark:bg-gray-700 dark:text-gray-100"
                  placeholder="12345678-1-23"
                />
              </div>
            </div>

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

            <button
              type="submit"
              disabled={loading || !form.acceptTerms}
              className="w-full bg-brand-gold text-white py-3 rounded-xl font-semibold hover:bg-brand-gold-dark disabled:opacity-50 transition shadow-sm"
            >
              {loading ? "Regisztráció..." : "Ingyenes regisztráció"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
            Már van fiókod?{" "}
            <Link href="/login" className="text-brand-teal-dark font-semibold hover:underline">
              Bejelentkezés
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
