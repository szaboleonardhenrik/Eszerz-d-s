"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import toast from "react-hot-toast";

export default function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const isValid = password.length >= 8 && password === confirm;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, password });
      toast.success("Jelszó sikeresen módosítva! Most már bejelentkezhetsz.");
      router.push("/login");
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message ?? "Érvénytelen vagy lejárt link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50 dark:bg-gray-900">
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Új jelszó beállítása</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Add meg az új jelszavadat</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border dark:border-gray-700 p-8 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Új jelszó</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-4 py-2.5 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-brand-teal/50 focus:border-brand-teal outline-none transition dark:bg-gray-700 dark:text-gray-100"
              placeholder="Legalább 8 karakter"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Jelszó megerősítése</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              className="w-full px-4 py-2.5 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-brand-teal/50 focus:border-brand-teal outline-none transition dark:bg-gray-700 dark:text-gray-100"
              placeholder="Jelszó újra"
            />
            {confirm && password !== confirm && (
              <p className="text-xs text-red-500 dark:text-red-400 mt-1">A jelszavak nem egyeznek</p>
            )}
          </div>
          <button
            type="submit"
            disabled={loading || !isValid}
            className="w-full bg-brand-teal-dark text-white py-3 rounded-xl font-semibold hover:bg-brand-teal-darker disabled:opacity-50 transition"
          >
            {loading ? "Mentés..." : "Jelszó mentése"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          <Link href="/login" className="text-brand-teal-dark font-semibold hover:underline">
            Vissza a bejelentkezéshez
          </Link>
        </p>
      </div>
    </div>
  );
}
