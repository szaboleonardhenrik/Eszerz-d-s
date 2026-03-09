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
  group?: string;
  contractCount: number;
  lastSignedAt: string | null;
}

const emptyForm = { name: "", email: "", company: "", phone: "", taxNumber: "", address: "", notes: "", group: "" };
const defaultGroups = ["Ügyfelek", "Beszállítók", "Alvállalkozók", "Partnerek", "Egyéb"];

export default function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const [groups, setGroups] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, [search, groupFilter]);
  useEffect(() => { loadGroups(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const params: any = { withStats: "true" };
      if (search) params.search = search;
      if (groupFilter) params.group = groupFilter;
      const res = await api.get("/contacts", { params });
      setPartners(res.data.data ?? []);
    } catch { toast.error("Hiba a partnerek betöltésekor"); }
    finally { setLoading(false); }
  };

  const loadGroups = async () => {
    try {
      const res = await api.get("/contacts/groups");
      setGroups(res.data.data ?? []);
    } catch {}
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
      loadGroups();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message ?? "Hiba történt");
    } finally { setSaving(false); }
  };

  const startEdit = (p: Partner) => {
    setEditingId(p.id);
    setForm({ name: p.name, email: p.email, company: p.company ?? "", phone: p.phone ?? "", taxNumber: p.taxNumber ?? "", address: p.address ?? "", notes: p.notes ?? "", group: p.group ?? "" });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Biztosan törli a partnert?")) return;
    try {
      await api.delete(`/contacts/${id}`);
      toast.success("Partner törölve!");
      load();
    } catch { toast.error("Hiba a törléskor"); }
  };

  const handleExport = async (format: "csv" | "json") => {
    try {
      const params: any = { format };
      if (groupFilter) params.group = groupFilter;
      const res = await api.get("/contacts/export", { params, responseType: "blob" });
      const blob = new Blob([res.data], { type: format === "json" ? "application/json" : "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = format === "json" ? "partnerek.json" : "partnerek.csv";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Export letöltve");
    } catch { toast.error("Hiba az exportáláskor"); }
  };

  const formatDate = (d: string | null) => {
    if (!d) return "-";
    return new Date(d).toLocaleDateString("hu-HU", { year: "numeric", month: "short", day: "numeric" });
  };

  const allGroups = [...new Set([...defaultGroups, ...groups])];

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Partnerek</h1>
          <p className="text-sm text-gray-500 mt-1">
            {partners.length} partner{groupFilter ? ` (${groupFilter})` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => handleExport("csv")}
            className="px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
            CSV
          </button>
          <button onClick={() => handleExport("json")}
            className="px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
            JSON
          </button>
          <button onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(true); }}
            className="bg-[#198296] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#146d7d] transition text-sm">
            + Új partner
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Keresés név, email vagy cég..."
          className="flex-1 min-w-[200px] max-w-md px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#41A5B9]"
        />
        <select
          value={groupFilter}
          onChange={(e) => setGroupFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        >
          <option value="">Minden csoport</option>
          {allGroups.map(g => <option key={g} value={g}>{g}</option>)}
          <option value="__none">Nincs csoport</option>
        </select>
        {(search || groupFilter) && (
          <button onClick={() => { setSearch(""); setGroupFilter(""); }}
            className="px-3 py-2 text-sm text-red-500 hover:underline">Törlés</button>
        )}
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
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Csoport</label>
                <select value={form.group} onChange={(e) => setForm({ ...form, group: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                  <option value="">Nincs</option>
                  {allGroups.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
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
              {search || groupFilter ? "Nincs találat" : "Még nincsenek partnerek"}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Az aláírók automatikusan megjelennek itt, vagy adj hozzá kézzel.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                  <th className="px-4 py-3 font-medium">Partner</th>
                  <th className="px-4 py-3 font-medium hidden sm:table-cell">Cég</th>
                  <th className="px-4 py-3 font-medium hidden md:table-cell">Csoport</th>
                  <th className="px-4 py-3 font-medium hidden md:table-cell">Szerződések</th>
                  <th className="px-4 py-3 font-medium hidden lg:table-cell">Utolsó aláírás</th>
                  <th className="px-4 py-3 font-medium w-48"></th>
                </tr>
              </thead>
              <tbody>
                {partners.map((p) => (
                  <tr key={p.id} className="border-b border-gray-200 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                    <td className="px-4 py-3">
                      <Link href={`/contacts/${p.id}`} className="group">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-[#198296] transition">{p.name}</p>
                        <p className="text-xs text-gray-400">{p.email}</p>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 hidden sm:table-cell">{p.company || "-"}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {p.group ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#198296]/10 text-[#198296]">{p.group}</span>
                      ) : (
                        <span className="text-xs text-gray-300">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {p.contractCount > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
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
                        <Link href={`/create?signerName=${encodeURIComponent(p.name)}&signerEmail=${encodeURIComponent(p.email)}${p.company ? `&signerCompany=${encodeURIComponent(p.company)}` : ""}`}
                          className="text-xs px-2 py-1 rounded-lg text-[#198296] hover:bg-[#198296]/10 transition" title="Új szerződés">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </Link>
                        <Link href={`/contacts/${p.id}`}
                          className="text-xs px-2 py-1 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-600 transition">Profil</Link>
                        <button onClick={() => startEdit(p)}
                          className="text-xs px-2 py-1 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600 transition">Szerk.</button>
                        <button onClick={() => handleDelete(p.id)}
                          className="text-xs px-2 py-1 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition">Törlés</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
