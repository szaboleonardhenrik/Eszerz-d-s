"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-store";
import api from "@/lib/api";
import toast from "react-hot-toast";

const ADMIN_ROLES = ["superadmin", "employee"];

interface Broadcast {
  id: string;
  title: string;
  message: string;
  type: string;
  active: boolean;
  createdBy: string;
  expiresAt: string | null;
  createdAt: string;
}

const typeOptions = [
  { value: "info", label: "Tájékoztatás", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400" },
  { value: "warning", label: "Figyelmeztetés", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400" },
  { value: "success", label: "Siker", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400" },
  { value: "maintenance", label: "Karbantartás", color: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400" },
];

const typeColorMap: Record<string, string> = Object.fromEntries(typeOptions.map((t) => [t.value, t.color]));
const typeLabelMap: Record<string, string> = Object.fromEntries(typeOptions.map((t) => [t.value, t.label]));

export default function AdminBroadcastsPage() {
  const { user } = useAuth();
  const isSuperadmin = user?.role === "superadmin";
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ title: "", message: "", type: "info", expiresAt: "" });

  useEffect(() => {
    if (!ADMIN_ROLES.includes(user?.role ?? "")) return;
    loadBroadcasts();
     
  }, [user]);

  const loadBroadcasts = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/broadcasts");
      setBroadcasts(res.data.data);
    } catch { /* */ } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      toast.error("Cím és üzenet kötelező!");
      return;
    }
    setSending(true);
    try {
      const res = await api.post("/admin/broadcasts", {
        title: form.title,
        message: form.message,
        type: form.type,
        expiresAt: form.expiresAt || undefined,
      });
      const notified = res.data.data.notifiedUsers;
      toast.success(`Értesítés kiküldve ${notified} felhasználónak!`);
      setForm({ title: "", message: "", type: "info", expiresAt: "" });
      setShowForm(false);
      loadBroadcasts();
    } catch (err: unknown) {
      const axiosMsg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      toast.error(axiosMsg || "Hiba történt");
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Biztosan archiválod ezt a közleményt?")) return;
    try {
      await api.delete(`/admin/broadcasts/${id}`);
      toast.success("Közlemény archiválva");
      loadBroadcasts();
    } catch {
      toast.error("Hiba történt");
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Rendszer közlemények</h1>
        </div>
        {isSuperadmin && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-medium transition flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Új közlemény
          </button>
        )}
      </div>

      {/* New broadcast form */}
      {showForm && isSuperadmin && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Új rendszer közlemény</h3>
          <p className="text-xs text-gray-400 mb-4">A közlemény minden felhasználó értesítési dobozába megérkezik.</p>
          <div className="space-y-3">
            <input
              placeholder="Cím *"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-violet-500"
            />
            <textarea
              placeholder="Üzenet *"
              rows={3}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-violet-500 resize-none"
            />
            <div className="flex flex-wrap gap-3">
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
              >
                {typeOptions.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <input
                type="datetime-local"
                value={form.expiresAt}
                onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                title="Lejárati idő (opcionális)"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                Mégse
              </button>
              <button
                onClick={handleSend}
                disabled={sending}
                className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
              >
                {sending ? "Küldés..." : "Küldés mindenkinek"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Broadcasts list */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600 mx-auto" /></div>
        ) : broadcasts.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-400">Még nincs közlemény.</div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {broadcasts.map((bc) => (
              <div key={bc.id} className={`p-5 ${!bc.active ? "opacity-50" : ""}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${typeColorMap[bc.type] || "bg-gray-100 text-gray-600"}`}>
                        {typeLabelMap[bc.type] || bc.type}
                      </span>
                      {!bc.active && <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-500">Archivált</span>}
                      <span className="text-xs text-gray-400">{formatDate(bc.createdAt)}</span>
                    </div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">{bc.title}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{bc.message}</p>
                    {bc.expiresAt && (
                      <p className="text-xs text-gray-400 mt-1">Lejár: {formatDate(bc.expiresAt)}</p>
                    )}
                  </div>
                  {bc.active && isSuperadmin && (
                    <button
                      onClick={() => handleDelete(bc.id)}
                      className="text-xs text-gray-400 hover:text-red-500 transition shrink-0"
                    >
                      Archiválás
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
