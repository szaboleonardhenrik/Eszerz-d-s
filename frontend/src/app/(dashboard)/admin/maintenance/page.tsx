"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-store";
import api from "@/lib/api";
import toast from "react-hot-toast";

const ADMIN_ROLES = ["superadmin", "employee"];

export default function AdminMaintenancePage() {
  const { user } = useAuth();
  const isSuperadmin = user?.role === "superadmin";
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!ADMIN_ROLES.includes(user?.role ?? "")) return;
    loadStatus();
     
  }, [user]);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/maintenance");
      const data = res.data.data;
      setEnabled(data.enabled);
      setMessage(data.message ?? "");
    } catch {
      toast.error("Nem sikerült betölteni a karbantartási állapotot.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post("/admin/maintenance", {
        enabled,
        message: message.trim() || undefined,
      });
      toast.success(
        enabled
          ? "Karbantartási mód bekapcsolva."
          : "Karbantartási mód kikapcsolva."
      );
    } catch (err: unknown) {
      const axiosMsg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      toast.error(axiosMsg || "Hiba történt a mentés során.");
    } finally {
      setSaving(false);
    }
  };

  if (!ADMIN_ROLES.includes(user?.role ?? "")) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-gray-400">Nincs jogosultságod.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Link
          href="/admin"
          className="text-violet-600 hover:text-violet-700 dark:text-violet-400"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Karbantartási mód
        </h1>
      </div>

      {loading ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600 mx-auto" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Status card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-6">
              Jelenlegi állapot
            </h2>

            <div className="flex flex-col items-center gap-6">
              {/* Large status indicator */}
              <div className="flex flex-col items-center gap-3">
                <div
                  className={`w-24 h-24 rounded-full flex items-center justify-center transition-colors ${
                    enabled
                      ? "bg-red-100 dark:bg-red-900/40"
                      : "bg-emerald-100 dark:bg-emerald-900/40"
                  }`}
                >
                  {enabled ? (
                    <svg
                      className="w-12 h-12 text-red-600 dark:text-red-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-12 h-12 text-emerald-600 dark:text-emerald-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  )}
                </div>
                <span
                  className={`text-lg font-bold ${
                    enabled
                      ? "text-red-600 dark:text-red-400"
                      : "text-emerald-600 dark:text-emerald-400"
                  }`}
                >
                  {enabled ? "Aktív" : "Inaktív"}
                </span>
              </div>

              {/* Toggle switch */}
              {isSuperadmin && (
                <button
                  type="button"
                  role="switch"
                  aria-checked={enabled}
                  onClick={() => setEnabled(!enabled)}
                  className={`relative inline-flex h-10 w-20 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 ${
                    enabled ? "bg-red-500" : "bg-gray-300 dark:bg-gray-600"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-9 w-9 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      enabled ? "translate-x-10" : "translate-x-0"
                    }`}
                  />
                </button>
              )}

              {!isSuperadmin && (
                <p className="text-sm text-gray-400">
                  Csak superadmin módosíthatja a karbantartási módot.
                </p>
              )}
            </div>
          </div>

          {/* Message textarea */}
          {isSuperadmin && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Karbantartási üzenet
              </h2>
              <p className="text-xs text-gray-400 mb-4">
                Ez az üzenet jelenik meg a felhasználóknak karbantartás közben.
              </p>
              <textarea
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Pl.: A rendszer karbantartás alatt áll, kérjük próbálja újra később..."
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-violet-500 resize-none"
              />
            </div>
          )}

          {/* Warning + save */}
          {isSuperadmin && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <svg
                  className="w-5 h-5 text-amber-500 shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01M10.29 3.86l-8.4 14.31A1 1 0 002.72 20h18.56a1 1 0 00.83-1.83l-8.4-14.31a1 1 0 00-1.66 0z"
                  />
                </svg>
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  A karbantartási mód bekapcsolásakor minden felhasználó értesítést kap.
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-medium transition disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      Mentés...
                    </>
                  ) : (
                    "Mentés"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
