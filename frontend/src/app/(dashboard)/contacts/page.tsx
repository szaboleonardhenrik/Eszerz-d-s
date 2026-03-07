"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import toast from "react-hot-toast";

interface Contact {
  id: string;
  name: string;
  email: string;
  company?: string;
  phone?: string;
  taxNumber?: string;
  address?: string;
  notes?: string;
}

const emptyForm = { name: "", email: "", company: "", phone: "", taxNumber: "", address: "", notes: "" };

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, [search]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/contacts", { params: search ? { search } : {} });
      setContacts(res.data.data ?? []);
    } catch { toast.error("Hiba a névjegyek betöltésekor"); }
    finally { setLoading(false); }
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.email.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/contacts/${editingId}`, form);
        toast.success("Névjegy frissítve!");
      } else {
        await api.post("/contacts", form);
        toast.success("Névjegy létrehozva!");
      }
      setForm(emptyForm);
      setShowForm(false);
      setEditingId(null);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message ?? "Hiba történt");
    } finally { setSaving(false); }
  };

  const startEdit = (c: Contact) => {
    setEditingId(c.id);
    setForm({ name: c.name, email: c.email, company: c.company ?? "", phone: c.phone ?? "", taxNumber: c.taxNumber ?? "", address: c.address ?? "", notes: c.notes ?? "" });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Biztosan törli a névjegyet?")) return;
    try {
      await api.delete(`/contacts/${id}`);
      toast.success("Névjegy törölve!");
      load();
    } catch { toast.error("Hiba a törléskor"); }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Névjegyek</h1>
        <button
          onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(true); }}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition text-sm"
        >
          + Új névjegy
        </button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Keresés név, email vagy cég szerint..."
          className="w-full max-w-md px-4 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {editingId ? "Névjegy szerkesztése" : "Új névjegy"}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs text-gray-500 mb-1">Név *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs text-gray-500 mb-1">Email *</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Cégnév</label>
                <input type="text" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Telefon</label>
                <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Adószám</label>
                <input type="text" value={form.taxNumber} onChange={(e) => setForm({ ...form, taxNumber: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Cím</label>
                <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-gray-500 mb-1">Megjegyzés</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2} className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => { setShowForm(false); setEditingId(null); }}
                className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-lg transition">Mégse</button>
              <button onClick={handleSubmit} disabled={saving || !form.name.trim() || !form.email.trim()}
                className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition disabled:opacity-50">
                {saving ? "Mentés..." : editingId ? "Frissítés" : "Létrehozás"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contact list */}
      <div className="bg-white rounded-xl border">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto" />
          </div>
        ) : contacts.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            {search ? "Nincs találat" : "Még nincs névjegyed. Hozz létre egyet!"}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b">
                <th className="px-4 py-3 font-medium">Név</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium hidden sm:table-cell">Cég</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Telefon</th>
                <th className="px-4 py-3 font-medium w-32"></th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((c) => (
                <tr key={c.id} className="border-b last:border-0 hover:bg-gray-50 transition">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{c.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{c.email}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 hidden sm:table-cell">{c.company || "-"}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 hidden md:table-cell">{c.phone || "-"}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => startEdit(c)}
                        className="text-xs px-3 py-1 rounded-lg text-gray-500 hover:bg-gray-100 transition">Szerkesztés</button>
                      <button onClick={() => handleDelete(c.id)}
                        className="text-xs px-3 py-1 rounded-lg text-red-500 hover:bg-red-50 transition">Törlés</button>
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
