"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-store";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const login = useAuth((s) => s.login);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(
        err.response?.data?.error?.message ?? "Hiba történt a bejelentkezéskor"
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
            <span className="text-white font-bold text-2xl">SZ</span>
          </div>
          <h2 className="text-3xl font-extrabold text-white mb-4">
            Üdvözlünk újra!
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
      <div className="flex-1 flex items-center justify-center px-4 py-12 bg-gray-50">
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
            <h1 className="text-2xl font-bold text-gray-900">Bejelentkezés</h1>
            <p className="text-gray-500 mt-1 text-sm">Lépj be a fiókodba a folytatáshoz</p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl shadow-sm border p-8 space-y-5"
          >
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jelszó</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-brand-teal/50 focus:border-brand-teal outline-none transition"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-teal-dark text-white py-3 rounded-xl font-semibold hover:bg-brand-teal-darker disabled:opacity-50 transition"
            >
              {loading ? "Bejelentkezés..." : "Bejelentkezés"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Nincs még fiókod?{" "}
            <Link href="/register" className="text-brand-teal-dark font-semibold hover:underline">
              Regisztráció
            </Link>
          </p>
          <p className="text-center text-sm text-gray-400 mt-3">
            <Link href="/portal" className="hover:text-brand-teal-dark transition hover:underline">
              Ügyfélportál (aláíróknak)
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
