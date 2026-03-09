"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import toast from "react-hot-toast";

export default function TwoFactorVerifyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-teal-dark" /></div>}>
      <TwoFactorVerifyContent />
    </Suspense>
  );
}

function TwoFactorVerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mfaToken = searchParams.get("t") ?? "";
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [useBackup, setUseBackup] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    try {
      const res = await api.post("/auth/verify-mfa", { mfaToken, code: code.trim() });
      const { user, token } = res.data.data;
      localStorage.setItem("token", token);
      useAuth.setState({ user, token });
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message ?? "Érvénytelen kód");
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
          <h1 className="text-2xl font-bold text-gray-900">Kétfaktoros hitelesítés</h1>
          <p className="text-gray-500 mt-1 text-sm">
            {useBackup
              ? "Add meg az egyik tartalék kódodat"
              : "Add meg a 6 jegyű kódot az autentikátor alkalmazásból"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border p-8 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {useBackup ? "Tartalék kód" : "Hitelesítő kód"}
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              maxLength={useBackup ? 8 : 6}
              className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-brand-teal/50 focus:border-brand-teal outline-none transition text-center text-2xl tracking-widest font-mono"
              placeholder={useBackup ? "ABCD1234" : "000000"}
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="w-full bg-brand-teal-dark text-white py-3 rounded-xl font-semibold hover:bg-brand-teal-darker disabled:opacity-50 transition"
          >
            {loading ? "Ellenőrzés..." : "Megerősítés"}
          </button>

          <button
            type="button"
            onClick={() => { setUseBackup(!useBackup); setCode(""); }}
            className="w-full text-sm text-gray-500 hover:text-brand-teal-dark transition"
          >
            {useBackup ? "Hitelesítő kód használata" : "Tartalék kód használata"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          <Link href="/login" className="text-brand-teal-dark font-semibold hover:underline">
            Vissza a bejelentkezéshez
          </Link>
        </p>
      </div>
    </div>
  );
}
