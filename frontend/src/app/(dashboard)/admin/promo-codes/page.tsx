"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-store";
import api from "@/lib/api";
import toast from "react-hot-toast";

const ADMIN_ROLES = ["superadmin", "employee"];

const discountTypeOptions = [
  { value: "percent", label: "Százalékos" },
  { value: "fixed", label: "Fix összeg" },
  { value: "tier_upgrade", label: "Szint frissítés" },
  { value: "trial_days", label: "Próba napok" },
];

const discountTypeLabelMap: Record<string, string> = {
  percent: "Sz\u00e1zal\u00e9kos",
  fixed: "Fix \u00f6sszeg",
  tier_upgrade: "Szint friss\u00edt\u00e9s",
  trial_days: "Pr\u00f3ba napok",
};

const tierOptions = [
  { value: "free", label: "Free" },
  { value: "starter", label: "Starter" },
  { value: "medium", label: "Medium" },
  { value: "premium", label: "Premium" },
  { value: "enterprise", label: "Enterprise" },
];

interface PromoCode {
  id: string;
  code: string;
  description: string | null;
  discountType: string;
  discountValue: number;
  targetTier: string | null;
  maxUses: number | null;
  usedCount: number;
  active: boolean;
  validFrom: string | null;
  validUntil: string | null;
  createdAt: string;
  _count?: { usages: number };
}

const defaultForm = {
  code: "",
  description: "",
  discountType: "percent",
  discountValue: 0,
  targetTier: "starter",
  maxUses: "",
  validFrom: "",
  validUntil: "",
};

export default function AdminPromoCodesPage() {
  const { user } = useAuth();
  const isSuperadmin = user?.role === "superadmin";
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(defaultForm);

  useEffect(() => {
    if (!ADMIN_ROLES.includes(user?.role ?? "")) return;
    loadPromoCodes();
     
  }, [user]);

  const loadPromoCodes = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/promo-codes");
      setPromoCodes(res.data.data ?? res.data);
    } catch {
      /* */
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!form.code.trim()) {
      toast.error("A k\u00f3d megad\u00e1sa k\u00f6telez\u0151!");
      return;
    }
    if (form.discountValue <= 0) {
      toast.error("Az \u00e9rt\u00e9k nagyobb kell legyen, mint 0!");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/admin/promo-codes", {
        code: form.code.toUpperCase().trim(),
        description: form.description || undefined,
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        targetTier: form.targetTier || undefined,
        maxUses: form.maxUses ? Number(form.maxUses) : undefined,
        validFrom: form.validFrom || undefined,
        validUntil: form.validUntil || undefined,
      });
      toast.success("Prom\u00f3ci\u00f3s k\u00f3d l\u00e9trehozva!");
      setForm(defaultForm);
      setShowForm(false);
      loadPromoCodes();
    } catch (err: unknown) {
      const axiosMsg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      toast.error(axiosMsg || "Hiba t\u00f6rt\u00e9nt a l\u00e9trehoz\u00e1s sor\u00e1n");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (promo: PromoCode) => {
    try {
      await api.patch(`/admin/promo-codes/${promo.id}`, { active: !promo.active });
      toast.success(promo.active ? "K\u00f3d deaktiv\u00e1lva" : "K\u00f3d aktiv\u00e1lva");
      loadPromoCodes();
    } catch {
      toast.error("Hiba t\u00f6rt\u00e9nt");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Biztosan t\u00f6r\u00f6lni szeretn\u00e9d ezt a prom\u00f3ci\u00f3s k\u00f3dot?")) return;
    try {
      await api.delete(`/admin/promo-codes/${id}`);
      toast.success("Prom\u00f3ci\u00f3s k\u00f3d t\u00f6r\u00f6lve");
      loadPromoCodes();
    } catch {
      toast.error("Hiba t\u00f6rt\u00e9nt a t\u00f6rl\u00e9s sor\u00e1n");
    }
  };

  const formatDate = (d: string | null) => {
    if (!d) return "\u2013";
    return new Date(d).toLocaleDateString("hu-HU", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const formatDiscountValue = (type: string, value: number) => {
    if (type === "percent") return `${value}%`;
    if (type === "fixed") return `${value.toLocaleString("hu-HU")} Ft`;
    if (type === "trial_days") return `${value} nap`;
    return `${value}`;
  };

  if (!ADMIN_ROLES.includes(user?.role ?? "")) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-gray-400">Nincs jogosults\u00e1god.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Link
            href="/admin"
            className="text-violet-600 hover:text-violet-700 dark:text-violet-400"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Prom\u00f3ci\u00f3s k\u00f3dok
          </h1>
        </div>
        {isSuperadmin && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-medium transition flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            \u00daj k\u00f3d
          </button>
        )}
      </div>

      {/* Create form (superadmin only) */}
      {showForm && isSuperadmin && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
            \u00daj prom\u00f3ci\u00f3s k\u00f3d l\u00e9trehoz\u00e1sa
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">K\u00f3d *</label>
              <input
                placeholder="pl. NYAR2026"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-violet-500 uppercase"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Le\u00edr\u00e1s</label>
              <input
                placeholder="R\u00f6vid le\u00edr\u00e1s"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Kedvezm\u00e9ny t\u00edpusa *</label>
              <select
                value={form.discountType}
                onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-violet-500"
              >
                {discountTypeOptions.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">\u00c9rt\u00e9k *</label>
              <input
                type="number"
                min={0}
                placeholder="pl. 20"
                value={form.discountValue || ""}
                onChange={(e) => setForm({ ...form, discountValue: Number(e.target.value) })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">C\u00e9l szint</label>
              <select
                value={form.targetTier}
                onChange={(e) => setForm({ ...form, targetTier: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-violet-500"
              >
                {tierOptions.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Max felhaszn\u00e1l\u00e1s</label>
              <input
                type="number"
                min={0}
                placeholder="Korl\u00e1tlan"
                value={form.maxUses}
                onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">\u00c9rv\u00e9nyes ett\u0151l</label>
              <input
                type="datetime-local"
                value={form.validFrom}
                onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">\u00c9rv\u00e9nyes eddig</label>
              <input
                type="datetime-local"
                value={form.validUntil}
                onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              M\u00e9gse
            </button>
            <button
              onClick={handleCreate}
              disabled={submitting}
              className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
            >
              {submitting ? "L\u00e9trehoz\u00e1s..." : "L\u00e9trehoz\u00e1s"}
            </button>
          </div>
        </div>
      )}

      {/* Promo codes table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600 mx-auto" />
          </div>
        ) : promoCodes.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-400">
            M\u00e9g nincs prom\u00f3ci\u00f3s k\u00f3d.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700 text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    K\u00f3d
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    T\u00edpus
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    \u00c9rt\u00e9k
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    C\u00e9l szint
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Felhaszn\u00e1lva
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    St\u00e1tusz
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    \u00c9rv\u00e9nyess\u00e9g
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    M\u0171veletek
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {promoCodes.map((promo) => {
                  const usageCount = promo._count?.usages ?? promo.usedCount ?? 0;
                  return (
                    <tr
                      key={promo.id}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-750 ${!promo.active ? "opacity-50" : ""}`}
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono font-bold text-gray-900 dark:text-gray-100">
                          {promo.code}
                        </span>
                        {promo.description && (
                          <p className="text-xs text-gray-400 mt-0.5">{promo.description}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        {discountTypeLabelMap[promo.discountType] || promo.discountType}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                        {formatDiscountValue(promo.discountType, promo.discountValue)}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        {promo.targetTier ? (
                          <span className="capitalize">{promo.targetTier}</span>
                        ) : (
                          <span className="text-gray-400">\u2013</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        <span className="font-medium">{usageCount}</span>
                        <span className="text-gray-400">
                          /{promo.maxUses ?? "\u221e"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {promo.active ? (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                            Akt\u00edv
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                            Inakt\u00edv
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                        <div>{formatDate(promo.validFrom)}</div>
                        <div>{formatDate(promo.validUntil)}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleActive(promo)}
                            className={`text-xs px-2 py-1 rounded-lg transition ${
                              promo.active
                                ? "text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                                : "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                            }`}
                            title={promo.active ? "Deaktiv\u00e1l\u00e1s" : "Aktiv\u00e1l\u00e1s"}
                          >
                            {promo.active ? "Deaktiv\u00e1l" : "Aktiv\u00e1l"}
                          </button>
                          <button
                            onClick={() => handleDelete(promo.id)}
                            className="text-xs px-2 py-1 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                            title="T\u00f6rl\u00e9s"
                          >
                            T\u00f6rl\u00e9s
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
