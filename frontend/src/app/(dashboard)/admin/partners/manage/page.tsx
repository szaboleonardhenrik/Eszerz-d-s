"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";

interface Partner {
  id: string;
  companyName: string;
  taxNumber: string | null;
  registrationNumber: string | null;
  headquarters: string | null;
  isActive: boolean;
  lastCheckedAt: string | null;
  notes: string | null;
  jobListings: { id: string; title: string; url: string; status: string }[];
  _count: { jobListings: number };
}

interface ValidationResult {
  found: boolean;
  slug: string;
  url: string;
  listingsCount: number;
}

export default function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newPartner, setNewPartner] = useState({ companyName: "", taxNumber: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [validating, setValidating] = useState(false);

  const load = () => {
    setLoading(true);
    api.get("/partner-monitor/partners", { params: { search: search || undefined } })
      .then((res) => setPartners(res.data))
      .catch(() => { /* ignore */ })
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [search]);

  // Debounced validation when company name changes
  useEffect(() => {
    const name = newPartner.companyName.trim();
    if (name.length < 3) return;
    const timer = setTimeout(() => {
      setValidating(true);
      api.get("/partner-monitor/validate", { params: { name } })
        .then((res) => setValidation(res.data))
        .catch(() => setValidation(null))
        .finally(() => setValidating(false));
    }, 600);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newPartner.companyName]);

  const addPartner = async () => {
    setSaving(true);
    try {
      await api.post("/partner-monitor/partners", newPartner);
      setNewPartner({ companyName: "", taxNumber: "", notes: "" });
      setValidation(null);
      setShowAdd(false);
      load();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      alert(err?.response?.data?.message || "Hiba");
    }
    setSaving(false);
  };

  const deletePartner = async (id: string, name: string) => {
    if (!confirm(`Biztosan törli: ${name}?`)) return;
    try {
      await api.delete(`/partner-monitor/partners/${id}`);
      load();
    } catch {}
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Partner Monitor</h1>
          <p className="text-sm text-gray-500 mt-1">Partnercégei álláshirdetéseit figyeljük a profession.hu-n</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/partners"
            className="px-4 py-2 bg-brand-teal-dark text-white rounded-lg text-sm font-medium hover:bg-brand-teal-dark/90 transition"
          >
            Dashboard
          </Link>
          <button
            onClick={() => setShowAdd(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
          >
            + Partner hozzáadása
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Keresés cégnév alapján..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-80 px-4 py-2 border rounded-lg text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
        />
      </div>

      {/* Add partner modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => { setShowAdd(false); setValidation(null); }}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4 dark:text-white">Új partner hozzáadása</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cégnév *</label>
                <input
                  type="text"
                  value={newPartner.companyName}
                  onChange={(e) => setNewPartner({ ...newPartner, companyName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="pl. OTP Bank Nyrt."
                />
                {/* Validation feedback */}
                {newPartner.companyName.trim().length >= 3 && (
                  <div className="mt-2">
                    {validating ? (
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <span className="inline-block w-3 h-3 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                        Ellenőrzés a profession.hu-n...
                      </p>
                    ) : validation ? (
                      validation.found ? (
                        <div className="p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                          <p className="text-xs text-green-700 dark:text-green-400 font-medium">
                            Találat a profession.hu-n: {validation.listingsCount} aktív álláshirdetés
                          </p>
                          <a
                            href={validation.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-green-600 dark:text-green-500 underline"
                          >
                            Megnyitás &rarr;
                          </a>
                        </div>
                      ) : (
                        <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                          <p className="text-xs text-yellow-700 dark:text-yellow-400">
                            A cég nem található a profession.hu-n ({validation.slug}).
                          </p>
                          <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-1">
                            Tipp: Próbáld a pontos cégnevet (pl. &quot;MOL Nyrt.&quot; a &quot;MOL&quot; helyett)
                          </p>
                        </div>
                      )
                    ) : null}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Adószám</label>
                <input
                  type="text"
                  value={newPartner.taxNumber}
                  onChange={(e) => setNewPartner({ ...newPartner, taxNumber: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="12345678-1-23"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Megjegyzés</label>
                <textarea
                  value={newPartner.notes}
                  onChange={(e) => setNewPartner({ ...newPartner, notes: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  rows={2}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={addPartner}
                disabled={!newPartner.companyName || saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {saving ? "Mentés..." : "Hozzáadás"}
              </button>
              <button
                onClick={() => { setShowAdd(false); setValidation(null); }}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              >
                Mégse
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Partner list */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
        </div>
      ) : partners.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400">Még nincsenek partnerek. Adja hozzá az elsőt!</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Cégnév</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Adószám</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Aktív hirdetések</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Utolsó ellenőrzés</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Műveletek</th>
              </tr>
            </thead>
            <tbody>
              {partners.map((p) => (
                <tr key={p.id} className="border-b dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                  <td className="px-4 py-3">
                    <Link href={`/partners/${p.id}`} className="font-medium text-sm text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400">
                      {p.companyName}
                    </Link>
                    {!p.isActive && (
                      <span className="ml-2 px-1.5 py-0.5 bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 text-[10px] rounded font-medium">
                        Inaktív
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 hidden sm:table-cell">{p.taxNumber || "-"}</td>
                  <td className="px-4 py-3 text-center">
                    {p.jobListings.length > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-semibold">
                        {p.jobListings.length}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">0</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 hidden md:table-cell">
                    {p.lastCheckedAt ? new Date(p.lastCheckedAt).toLocaleDateString("hu-HU") : "Még nem"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => deletePartner(p.id, p.companyName)}
                      className="text-red-500 hover:text-red-700 text-sm"
                      title="Törlés"
                    >
                      Törlés
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-gray-400 mt-4">
        Összesen: {partners.length} partner
      </p>
    </div>
  );
}
