"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import toast from "react-hot-toast";

interface Partner {
  id: string;
  name: string;
  email: string;
  company?: string;
  phone?: string;
  taxNumber?: string;
  address?: string;
  notes?: string;
  contractCount: number;
  lastSignedAt: string | null;
}

interface PartnerContract {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  signers: { status: string; signedAt: string | null; signatureMethod: string | null }[];
}

interface PartnerDetail extends Partner {
  contracts: PartnerContract[];
}

const emptyForm = { name: "", email: "", company: "", phone: "", taxNumber: "", address: "", notes: "" };

const statusLabels: Record<string, string> = {
  draft: "Piszkozat",
  sent: "Elküldve",
  partially_signed: "Részben aláírt",
  completed: "Teljesítve",
  declined: "Visszautasítva",
  expired: "Lejárt",
  cancelled: "Visszavonva",
};

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  sent: "bg-blue-100 text-blue-700",
  partially_signed: "bg-yellow-100 text-yellow-700",
  completed: "bg-green-100 text-green-700",
  declined: "bg-red-100 text-red-700",
  expired: "bg-orange-100 text-orange-700",
  cancelled: "bg-gray-100 text-gray-500",
};

export default function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  // Detail panel
  const [selectedPartner, setSelectedPartner] = useState<PartnerDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => { load(); }, [search]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/contacts", { params: { withStats: "true", ...(search ? { search } : {}) } });
      setPartners(res.data.data ?? []);
    } catch { toast.error("Hiba a partnerek betöltésekor"); }
    finally { setLoading(false); }
  };

  const loadDetail = async (id: string) => {
    setDetailLoading(true);
    try {
      const res = await api.get(`/contacts/${id}`, { params: { withContracts: "true" } });
      setSelectedPartner(res.data.data);
    } catch { toast.error("Hiba a partner adatok betöltésekor"); }
    finally { setDetailLoading(false); }
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.email.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/contacts/${editingId}`, form);
        toast.success("Partner frissítve!");
      } else {
        await api.post("/contacts", form);
        toast.success("Partner hozzáadva!");
      }
      setForm(emptyForm);
      setShowForm(false);
      setEditingId(null);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message ?? "Hiba történt");
    } finally { setSaving(false); }
  };

  const startEdit = (p: Partner) => {
    setEditingId(p.id);
    setForm({ name: p.name, email: p.email, company: p.company ?? "", phone: p.phone ?? "", taxNumber: p.taxNumber ?? "", address: p.address ?? "", notes: p.notes ?? "" });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Biztosan törli a partnert?")) return;
    try {
      await api.delete(`/contacts/${id}`);
      toast.success("Partner törölve!");
      if (selectedPartner?.id === id) setSelectedPartner(null);
      load();
    } catch { toast.error("Hiba a törléskor"); }
  };

  const formatDate = (d: string | null) => {
    if (!d) return "-";
    return new Date(d).toLocaleDateString("hu-HU", { year: "numeric", month: "short", day: "numeric" });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Partnerek</h1>
          <p className="text-sm text-gray-500 mt-1">
            Az aláírók automatikusan partnerként mentődnek. Kézzel is hozzáadhatsz újakat.
          </p>
        </div>
        <button
          onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(true); }}
          className="bg-[#198296] text-white px-5 py-2.5 rounded-lg font-medium hover:bg-[#146d7d] transition text-sm"
        >
          + Új partner
        </button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Keresés név, email vagy cég szerint..."
          className="w-full max-w-md px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#41A5B9]"
        />
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {editingId ? "Partner szerkesztése" : "Új partner"}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Név *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#41A5B9]" />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Email *</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#41A5B9]" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Cégnév</label>
                <input type="text" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#41A5B9]" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Telefon</label>
                <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#41A5B9]" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Adószám</label>
                <input type="text" value={form.taxNumber} onChange={(e) => setForm({ ...form, taxNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#41A5B9]" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Cím</label>
                <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#41A5B9]" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Megjegyzés</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#41A5B9]" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => { setShowForm(false); setEditingId(null); }}
                className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">Mégse</button>
              <button onClick={handleSubmit} disabled={saving || !form.name.trim() || !form.email.trim()}
                className="px-5 py-2 text-sm font-medium text-white bg-[#198296] hover:bg-[#146d7d] rounded-lg transition disabled:opacity-50">
                {saving ? "Mentés..." : editingId ? "Frissítés" : "Létrehozás"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail panel */}
      {selectedPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl mx-4 p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#198296] to-[#41A5B9] flex items-center justify-center text-white font-bold text-lg">
                  {selectedPartner.name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{selectedPartner.name}</h2>
                  <p className="text-sm text-gray-500">{selectedPartner.email}</p>
                </div>
              </div>
              <button onClick={() => setSelectedPartner(null)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Partner info */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {selectedPartner.company && (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-0.5">Cégnév</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{selectedPartner.company}</p>
                </div>
              )}
              {selectedPartner.phone && (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-0.5">Telefon</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{selectedPartner.phone}</p>
                </div>
              )}
              {selectedPartner.taxNumber && (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-0.5">Adószám</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{selectedPartner.taxNumber}</p>
                </div>
              )}
              {selectedPartner.address && (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-0.5">Cím</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{selectedPartner.address}</p>
                </div>
              )}
            </div>

            {/* Contracts */}
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Közös szerződések ({selectedPartner.contracts?.length ?? 0})
            </h3>
            {detailLoading ? (
              <div className="text-center py-6">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#198296] mx-auto" />
              </div>
            ) : !selectedPartner.contracts?.length ? (
              <p className="text-sm text-gray-400 py-4 text-center">Nincs közös szerződés</p>
            ) : (
              <div className="space-y-2">
                {selectedPartner.contracts.map((c) => (
                  <Link
                    key={c.id}
                    href={`/contracts/${c.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{c.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatDate(c.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {c.signers[0]?.signedAt && (
                        <span className="text-xs text-gray-400">
                          Aláírva: {formatDate(c.signers[0].signedAt)}
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[c.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {statusLabels[c.status] ?? c.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Partner list */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#198296] mx-auto" />
          </div>
        ) : partners.length === 0 ? (
          <div className="p-12 text-center">
            <svg className="w-12 h-12 mx-auto text-gray-200 dark:text-gray-700 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              {search ? "Nincs találat" : "Még nincsenek partnerek"}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Az aláírók automatikusan megjelennek itt, vagy adj hozzá kézzel.
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                <th className="px-4 py-3 font-medium">Partner</th>
                <th className="px-4 py-3 font-medium hidden sm:table-cell">Cég</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Szerződések</th>
                <th className="px-4 py-3 font-medium hidden lg:table-cell">Utolsó aláírás</th>
                <th className="px-4 py-3 font-medium w-40"></th>
              </tr>
            </thead>
            <tbody>
              {partners.map((p) => (
                <tr key={p.id} className="border-b border-gray-200 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                  <td className="px-4 py-3">
                    <button
                      onClick={() => { setSelectedPartner(null); loadDetail(p.id); }}
                      className="text-left group"
                    >
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-[#198296] transition">{p.name}</p>
                      <p className="text-xs text-gray-400">{p.email}</p>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 hidden sm:table-cell">{p.company || "-"}</td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {p.contractCount > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[#198296]/10 text-[#198296]">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {p.contractCount}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-300">0</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400 hidden lg:table-cell">
                    {formatDate(p.lastSignedAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => loadDetail(p.id)}
                        className="text-xs px-3 py-1 rounded-lg text-[#198296] hover:bg-[#198296]/10 transition">Részletek</button>
                      <button onClick={() => startEdit(p)}
                        className="text-xs px-3 py-1 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600 transition">Szerkesztés</button>
                      <button onClick={() => handleDelete(p.id)}
                        className="text-xs px-3 py-1 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition">Törlés</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
