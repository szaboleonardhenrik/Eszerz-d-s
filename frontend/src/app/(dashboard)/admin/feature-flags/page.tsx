"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-store";
import api from "@/lib/api";
import toast from "react-hot-toast";

const ADMIN_ROLES = ["superadmin", "employee"];

interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  minTier: string | null;
  createdAt: string;
  updatedAt: string;
}

const tierOptions: { value: string | null; label: string }[] = [
  { value: null, label: "Mindenki" },
  { value: "free", label: "Ingyenes" },
  { value: "starter", label: "Kezdő" },
  { value: "medium", label: "Közepes" },
  { value: "premium", label: "Prémium" },
  { value: "enterprise", label: "Nagyvállalati" },
];

const tierLabelMap: Record<string, string> = {
  "": "Mindenki",
  free: "Ingyenes",
  starter: "Kezdő",
  medium: "Közepes",
  premium: "Prémium",
  enterprise: "Nagyvállalati",
};

function getTierLabel(tier: string | null): string {
  if (!tier) return "Mindenki";
  return tierLabelMap[tier] || tier;
}

export default function AdminFeatureFlagsPage() {
  const { user } = useAuth();
  const isSuperadmin = user?.role === "superadmin";
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ key: "", name: "", description: "", minTier: "" });

  useEffect(() => {
    if (!ADMIN_ROLES.includes(user?.role ?? "")) return;
    loadFlags();
  }, [user]);

  const loadFlags = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/feature-flags");
      setFlags(res.data.data);
    } catch { /* */ } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (flag: FeatureFlag) => {
    if (!isSuperadmin) {
      toast.error("Csak superadmin változtathatja!");
      return;
    }
    const prev = flag.enabled;
    setFlags((f) => f.map((ff) => (ff.id === flag.id ? { ...ff, enabled: !prev } : ff)));
    try {
      await api.patch(`/admin/feature-flags/${flag.id}`, { enabled: !prev });
      toast.success(`${flag.name} ${!prev ? "bekapcsolva" : "kikapcsolva"}`);
    } catch (err: any) {
      setFlags((f) => f.map((ff) => (ff.id === flag.id ? { ...ff, enabled: prev } : ff)));
      toast.error(err.response?.data?.error?.message || "Hiba történt");
    }
  };

  const handleTierChange = async (flag: FeatureFlag, newTier: string) => {
    if (!isSuperadmin) {
      toast.error("Csak superadmin változtathatja!");
      return;
    }
    const minTier = newTier === "" ? null : newTier;
    const prevTier = flag.minTier;
    setFlags((f) => f.map((ff) => (ff.id === flag.id ? { ...ff, minTier: minTier } : ff)));
    try {
      await api.patch(`/admin/feature-flags/${flag.id}`, { minTier });
      toast.success(`${flag.name} szint: ${getTierLabel(minTier)}`);
    } catch (err: any) {
      setFlags((f) => f.map((ff) => (ff.id === flag.id ? { ...ff, minTier: prevTier } : ff)));
      toast.error(err.response?.data?.error?.message || "Hiba történt");
    }
  };

  const handleCreate = async () => {
    if (!form.key.trim() || !form.name.trim()) {
      toast.error("Kulcs és név kötelező!");
      return;
    }
    setCreating(true);
    try {
      await api.post("/admin/feature-flags", {
        key: form.key.trim(),
        name: form.name.trim(),
        description: form.description.trim(),
        minTier: form.minTier || null,
      });
      toast.success("Feature flag létrehozva!");
      setForm({ key: "", name: "", description: "", minTier: "" });
      setShowForm(false);
      loadFlags();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || "Hiba történt");
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("hu-HU", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });

  if (!ADMIN_ROLES.includes(user?.role ?? "")) {
    return <div className="min-h-[60vh] flex items-center justify-center"><p className="text-gray-400">Nincs jogosultságod.</p></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Link href="/admin" className="text-violet-600 hover:text-violet-700 dark:text-violet-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Feature flag-ek</h1>
        </div>
        {isSuperadmin && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-medium transition flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Új flag
          </button>
        )}
      </div>

      {/* Create form */}
      {showForm && isSuperadmin && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Új feature flag</h3>
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                placeholder="Kulcs (pl. ai_analysis) *"
                value={form.key}
                onChange={(e) => setForm({ ...form, key: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-violet-500 font-mono"
              />
              <input
                placeholder="Név *"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <input
              placeholder="Leírás (opcionális)"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-violet-500"
            />
            <select
              value={form.minTier}
              onChange={(e) => setForm({ ...form, minTier: e.target.value })}
              className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
            >
              {tierOptions.map((t) => (
                <option key={t.value ?? "null"} value={t.value ?? ""}>{t.label}</option>
              ))}
            </select>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                Mégse
              </button>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
              >
                {creating ? "Létrehozás..." : "Létrehozás"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Flags table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600 mx-auto" /></div>
        ) : flags.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-400">Még nincs feature flag.</div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <th className="text-left px-5 py-3 font-medium text-gray-500 dark:text-gray-400">Státusz</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-500 dark:text-gray-400">Név</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-500 dark:text-gray-400">Kulcs</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-500 dark:text-gray-400">Leírás</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-500 dark:text-gray-400">Min. szint</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-500 dark:text-gray-400">Módosítva</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {flags.map((flag) => (
                    <tr key={flag.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition">
                      <td className="px-5 py-4">
                        <button
                          onClick={() => handleToggle(flag)}
                          disabled={!isSuperadmin}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            flag.enabled ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600"
                          } ${!isSuperadmin ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                              flag.enabled ? "translate-x-6" : "translate-x-1"
                            }`}
                          />
                        </button>
                      </td>
                      <td className="px-5 py-4 font-medium text-gray-900 dark:text-gray-100">{flag.name}</td>
                      <td className="px-5 py-4">
                        <code className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono text-gray-600 dark:text-gray-300">{flag.key}</code>
                      </td>
                      <td className="px-5 py-4 text-gray-500 dark:text-gray-400 max-w-xs truncate">{flag.description || "-"}</td>
                      <td className="px-5 py-4">
                        {isSuperadmin ? (
                          <select
                            value={flag.minTier ?? ""}
                            onChange={(e) => handleTierChange(flag, e.target.value)}
                            className="px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-xs"
                          >
                            {tierOptions.map((t) => (
                              <option key={t.value ?? "null"} value={t.value ?? ""}>{t.label}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-xs text-gray-600 dark:text-gray-300">
                            {getTierLabel(flag.minTier)}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-xs text-gray-400">{formatDate(flag.updatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-700">
              {flags.map((flag) => (
                <div key={flag.id} className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">{flag.name}</h4>
                      <code className="text-xs font-mono text-gray-500 dark:text-gray-400">{flag.key}</code>
                    </div>
                    <button
                      onClick={() => handleToggle(flag)}
                      disabled={!isSuperadmin}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        flag.enabled ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600"
                      } ${!isSuperadmin ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                          flag.enabled ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                  {flag.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">{flag.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">Min. szint:</span>
                      {isSuperadmin ? (
                        <select
                          value={flag.minTier ?? ""}
                          onChange={(e) => handleTierChange(flag, e.target.value)}
                          className="px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-xs"
                        >
                          {tierOptions.map((t) => (
                            <option key={t.value ?? "null"} value={t.value ?? ""}>{t.label}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-xs text-gray-600 dark:text-gray-300">{getTierLabel(flag.minTier)}</span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">{formatDate(flag.updatedAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
