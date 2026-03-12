"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-store";
import api from "@/lib/api";
import toast from "react-hot-toast";

interface AuthorizedSignerData {
  id: string;
  name: string;
  email: string;
  title: string | null;
  companyName: string | null;
  companyTaxNumber: string | null;
  companyAddress: string | null;
  isDefault: boolean;
}

interface SystemStats {
  totalUsers: number;
  totalContracts: number;
  totalQuotes: number;
  totalSigners: number;
  contractsToday: number;
  contractsThisWeek: number;
  contractsThisMonth: number;
  contractsByStatus: Record<string, number>;
  estimatedStorageMb: number;
}

interface SubscriptionData {
  breakdown: Record<string, number>;
  roles: Record<string, number>;
  total: number;
}

interface ActivityEntry {
  id: string;
  eventType: string;
  eventData: any;
  contractTitle: string | null;
  ownerName: string | null;
  ownerEmail: string | null;
  signerName: string | null;
  ipAddress: string | null;
  createdAt: string;
}

const eventLabels: Record<string, string> = {
  "contract.created": "Szerződés létrehozva",
  "contract.sent": "Szerződés elküldve",
  "contract.completed": "Szerződés befejezve",
  "contract.cancelled": "Szerződés visszavonva",
  "signer.signed": "Aláírás megtörtént",
  "signer.declined": "Aláírás elutasítva",
  "signer.viewed": "Szerződés megtekintve",
  "contract.expired": "Szerződés lejárt",
};

const eventColors: Record<string, string> = {
  "contract.created": "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
  "contract.sent": "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
  "contract.completed": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
  "contract.cancelled": "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400",
  "signer.signed": "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
  "signer.declined": "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
  "signer.viewed": "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400",
  "contract.expired": "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400",
};

const statusLabels: Record<string, string> = {
  draft: "Piszkozat",
  sent: "Elküldve",
  partially_signed: "Részben aláírt",
  completed: "Kész",
  declined: "Visszautasítva",
  expired: "Lejárt",
  cancelled: "Visszavonva",
};

const statusColors: Record<string, string> = {
  draft: "#9CA3AF",
  sent: "#F59E0B",
  partially_signed: "#F97316",
  completed: "#10B981",
  declined: "#EF4444",
  expired: "#6B7280",
  cancelled: "#D1D5DB",
};

const tierColors: Record<string, string> = {
  free: "#9CA3AF",
  starter: "#38BDF8",
  basic: "#3B82F6",
  medium: "#3B82F6",
  pro: "#8B5CF6",
  premium: "#8B5CF6",
  enterprise: "#F59E0B",
};

const tierLabel: Record<string, string> = {
  free: "Ingyenes",
  starter: "Kezdő",
  basic: "Közepes",
  medium: "Közepes",
  pro: "Prémium",
  premium: "Prémium",
  enterprise: "Nagyvállalati",
};

const roleColors: Record<string, string> = {
  superadmin: "#EF4444",
  employee: "#8B5CF6",
  user: "#9CA3AF",
};

const roleLabel: Record<string, string> = {
  superadmin: "Szuperadmin",
  employee: "Munkatárs",
  user: "Felhasználó",
};

const ADMIN_ROLES = ["superadmin", "employee"];

function timeAgo(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "most";
  if (diffMin < 60) return `${diffMin} perce`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH} órája`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 30) return `${diffD} napja`;
  const diffM = Math.floor(diffD / 30);
  return `${diffM} hónapja`;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [subs, setSubs] = useState<SubscriptionData | null>(null);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Authorized signers state
  const [authSigners, setAuthSigners] = useState<AuthorizedSignerData[]>([]);
  const [signerForm, setSignerForm] = useState({ name: "", email: "", title: "", companyName: "", companyTaxNumber: "", companyAddress: "", isDefault: false });
  const [editingSignerId, setEditingSignerId] = useState<string | null>(null);
  const [signerFormOpen, setSignerFormOpen] = useState(false);

  useEffect(() => {
    if (!ADMIN_ROLES.includes(user?.role ?? "")) return;
    loadData();
    loadAuthSigners();
  }, [user]);

  const loadAuthSigners = async () => {
    try {
      const res = await api.get("/admin/authorized-signers");
      setAuthSigners(res.data.data);
    } catch {}
  };

  const saveAuthorizedSigner = async () => {
    if (!signerForm.name || !signerForm.email) return toast.error("Név és email kötelező!");
    try {
      if (editingSignerId) {
        await api.patch(`/admin/authorized-signers/${editingSignerId}`, signerForm);
        toast.success("Aláíró frissítve!");
      } else {
        await api.post("/admin/authorized-signers", signerForm);
        toast.success("Aláíró hozzáadva!");
      }
      setSignerForm({ name: "", email: "", title: "", companyName: "", companyTaxNumber: "", companyAddress: "", isDefault: false });
      setEditingSignerId(null);
      setSignerFormOpen(false);
      loadAuthSigners();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message ?? "Hiba");
    }
  };

  const deleteAuthorizedSigner = async (id: string) => {
    if (!confirm("Biztosan törlöd ezt az aláírót?")) return;
    try {
      await api.delete(`/admin/authorized-signers/${id}`);
      toast.success("Aláíró törölve!");
      loadAuthSigners();
    } catch { toast.error("Hiba a törlés során"); }
  };

  const editAuthorizedSigner = (s: AuthorizedSignerData) => {
    setSignerForm({
      name: s.name,
      email: s.email,
      title: s.title || "",
      companyName: s.companyName || "",
      companyTaxNumber: s.companyTaxNumber || "",
      companyAddress: s.companyAddress || "",
      isDefault: s.isDefault,
    });
    setEditingSignerId(s.id);
    setSignerFormOpen(true);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, subsRes, actRes] = await Promise.all([
        api.get("/admin/stats"),
        api.get("/admin/subscriptions"),
        api.get("/admin/activity?limit=15"),
      ]);
      setStats(statsRes.data.data);
      setSubs(subsRes.data.data);
      setActivity(actRes.data.data);
    } catch (err) {
      console.error("Admin data load failed", err);
    } finally {
      setLoading(false);
    }
  };

  if (!ADMIN_ROLES.includes(user?.role ?? "")) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Nincs jogosultságod</h2>
          <p className="text-gray-500 dark:text-gray-400">Ez az oldal csak adminisztrátorok számára érhető el.</p>
          <Link href="/dashboard" className="inline-block mt-4 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition">
            Vissza a kezdőlapra
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-600 mx-auto" />
          <p className="mt-4 text-sm text-gray-400">Admin panel betöltése...</p>
        </div>
      </div>
    );
  }

  const totalSubs = subs?.total || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Admin panel</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Rendszer áttekintés és felhasználókezelés</p>
        </div>
        <Link
          href="/admin/users"
          className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-medium transition flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          Felhasználók kezelése
        </Link>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Összes felhasználó"
            value={stats.totalUsers}
            icon="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            color="violet"
          />
          <StatCard
            label="Összes szerződés"
            value={stats.totalContracts}
            icon="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            color="indigo"
          />
          <StatCard
            label="Mai szerződés"
            value={stats.contractsToday}
            sub={`Heti: ${stats.contractsThisWeek} | Havi: ${stats.contractsThisMonth}`}
            icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            color="blue"
          />
          <StatCard
            label="Tárolt fájlok"
            value={`${stats.estimatedStorageMb} MB`}
            sub={`${stats.totalQuotes} ajánlat | ${stats.totalSigners} aláíró`}
            icon="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
            color="emerald"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contract Status Breakdown */}
        {stats && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Szerződések státusz szerint</h3>
            <div className="space-y-3">
              {Object.entries(stats.contractsByStatus).map(([status, count]) => {
                const pct = stats.totalContracts > 0 ? (count / stats.totalContracts) * 100 : 0;
                return (
                  <div key={status}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600 dark:text-gray-400">{statusLabels[status] || status}</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{count} ({pct.toFixed(0)}%)</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: statusColors[status] || "#6B7280" }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Subscription Breakdown */}
        {subs && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Előfizetési szintek</h3>
            <div className="space-y-4">
              {Object.entries(subs.breakdown).map(([tier, count]) => {
                const pct = totalSubs > 0 ? (count / totalSubs) * 100 : 0;
                return (
                  <div key={tier}>
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block w-3 h-3 rounded-full"
                          style={{ backgroundColor: tierColors[tier] || "#6B7280" }}
                        />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{tierLabel[tier] || tier}</span>
                      </div>
                      <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{count} felhasználó</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5">
                      <div
                        className="h-2.5 rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: tierColors[tier] || "#6B7280" }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Role Breakdown */}
            {subs.roles && (
              <>
                <div className="mt-5 pt-4 border-t dark:border-gray-700">
                  <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase">Szerepkörök</h4>
                  <div className="space-y-2">
                    {Object.entries(subs.roles).map(([role, count]) => (
                      <div key={role} className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: roleColors[role] || "#6B7280" }} />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{roleLabel[role] || role}</span>
                        </div>
                        <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
            <div className="mt-4 pt-4 border-t dark:border-gray-700">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Összes felhasználó</span>
                <span className="font-bold text-gray-900 dark:text-gray-100">{subs.total}</span>
              </div>
            </div>
          </div>
        )}

        {/* System Health */}
        {stats && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Rendszer állapot</h3>
            <div className="space-y-3">
              <HealthItem label="Adatbázis" status="ok" detail="Kapcsolódva" />
              <HealthItem label="API" status="ok" detail="Működőképes" />
              <HealthItem
                label="Tárolás"
                status={stats.estimatedStorageMb > 5000 ? "warning" : "ok"}
                detail={`${stats.estimatedStorageMb} MB használva`}
              />
              <HealthItem
                label="Aktivitás"
                status={stats.contractsToday > 0 ? "ok" : "info"}
                detail={`${stats.contractsToday} szerződés ma`}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Authorized Signers ── */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 pb-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Kibocsátói aláírók</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Előre megadott személyek, akik a cég nevében aláírhatnak</p>
            </div>
          </div>
          <button
            onClick={() => { setSignerFormOpen(!signerFormOpen); setEditingSignerId(null); setSignerForm({ name: "", email: "", title: "", companyName: "", companyTaxNumber: "", companyAddress: "", isDefault: false }); }}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Új aláíró
          </button>
        </div>

        {/* Add/Edit form */}
        {signerFormOpen && (
          <div className="p-6 bg-teal-50/50 dark:bg-teal-900/10 border-b border-gray-100 dark:border-gray-700">
            <h4 className="text-sm font-semibold text-teal-800 dark:text-teal-300 mb-4">
              {editingSignerId ? "Aláíró szerkesztése" : "Új aláíró hozzáadása"}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <input
                placeholder="Név *"
                value={signerForm.name}
                onChange={(e) => setSignerForm({ ...signerForm, name: e.target.value })}
                className="px-3 py-2.5 border border-teal-200 dark:border-teal-700 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-teal-500"
              />
              <input
                placeholder="Email *"
                type="email"
                value={signerForm.email}
                onChange={(e) => setSignerForm({ ...signerForm, email: e.target.value })}
                className="px-3 py-2.5 border border-teal-200 dark:border-teal-700 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-teal-500"
              />
              <input
                placeholder="Beosztás (pl. Ügyvezető)"
                value={signerForm.title}
                onChange={(e) => setSignerForm({ ...signerForm, title: e.target.value })}
                className="px-3 py-2.5 border border-teal-200 dark:border-teal-700 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-teal-500"
              />
              <input
                placeholder="Cégnév"
                value={signerForm.companyName}
                onChange={(e) => setSignerForm({ ...signerForm, companyName: e.target.value })}
                className="px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-teal-500"
              />
              <input
                placeholder="Adószám"
                value={signerForm.companyTaxNumber}
                onChange={(e) => setSignerForm({ ...signerForm, companyTaxNumber: e.target.value })}
                className="px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-teal-500"
              />
              <input
                placeholder="Cím"
                value={signerForm.companyAddress}
                onChange={(e) => setSignerForm({ ...signerForm, companyAddress: e.target.value })}
                className="px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div className="flex items-center justify-between mt-4">
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={signerForm.isDefault}
                  onChange={(e) => setSignerForm({ ...signerForm, isDefault: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                />
                Alapértelmezett aláíró
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => { setSignerFormOpen(false); setEditingSignerId(null); }}
                  className="px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Mégse
                </button>
                <button
                  onClick={saveAuthorizedSigner}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition"
                >
                  {editingSignerId ? "Mentés" : "Hozzáadás"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Signers list */}
        <div className="p-6">
          {authSigners.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-gray-300 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Még nincs kibocsátói aláíró.</p>
              <p className="text-xs text-gray-400 mt-1">Add hozzá azokat, akik a cég nevében írják alá a szerződéseket.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {authSigners.map((s) => (
                <div key={s.id} className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-teal-200 dark:hover:border-teal-700 transition group">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {s.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{s.name}</span>
                      {s.isDefault && (
                        <span className="px-2 py-0.5 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 rounded-full text-[10px] font-semibold uppercase">Alapértelmezett</span>
                      )}
                      {s.title && (
                        <span className="text-xs text-gray-400">{s.title}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                      {s.email}
                      {s.companyName && <span className="ml-2">| {s.companyName}</span>}
                      {s.companyTaxNumber && <span className="ml-2">| {s.companyTaxNumber}</span>}
                    </p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={() => editAuthorizedSigner(s)}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600"
                      title="Szerkesztés"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => deleteAuthorizedSigner(s.id)}
                      className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500"
                      title="Törlés"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Legutolsó tevékenységek</h3>
        {activity.length === 0 ? (
          <p className="text-sm text-gray-400">Nincs újabb tevékenység.</p>
        ) : (
          <div className="space-y-3">
            {activity.map((entry) => (
              <div key={entry.id} className="flex items-start gap-3 py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap mt-0.5 ${eventColors[entry.eventType] || "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"}`}>
                  {eventLabels[entry.eventType] || entry.eventType}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 dark:text-gray-200 truncate">
                    {entry.contractTitle || "Ismeretlen szerződés"}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {entry.ownerName || entry.signerName || "-"}
                    {entry.ipAddress && <span className="ml-2">({entry.ipAddress})</span>}
                  </p>
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap">{timeAgo(entry.createdAt)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: string;
  color: "violet" | "indigo" | "blue" | "emerald";
}) {
  const colors = {
    violet: "bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400",
    indigo: "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400",
    blue: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400",
    emerald: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400",
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[color]}`}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={icon} />
          </svg>
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{label}</p>
      {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function HealthItem({
  label,
  status,
  detail,
}: {
  label: string;
  status: "ok" | "warning" | "error" | "info";
  detail: string;
}) {
  const dot = {
    ok: "bg-emerald-500",
    warning: "bg-amber-500",
    error: "bg-red-500",
    info: "bg-blue-500",
  };

  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${dot[status]}`} />
        <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
      </div>
      <span className="text-xs text-gray-400">{detail}</span>
    </div>
  );
}
