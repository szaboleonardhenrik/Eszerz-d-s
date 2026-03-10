"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-store";
import api from "@/lib/api";
import toast from "react-hot-toast";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  companyName: string | null;
  role: string;
  subscriptionTier: string;
  createdAt: string;
  phone: string | null;
  contractCount: number;
  quoteCount: number;
  lastLogin: string | null;
}

interface UsersResponse {
  users: AdminUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const tierBadge: Record<string, string> = {
  free: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400",
  basic: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
  pro: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400",
};

const roleBadge: Record<string, string> = {
  owner: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400",
  admin: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400",
  member: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400",
  viewer: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400",
};

export default function AdminUsersPage() {
  const { user } = useAuth();
  const [data, setData] = useState<UsersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState("");
  const [editTier, setEditTier] = useState("");
  const [saving, setSaving] = useState(false);
  const limit = 20;

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/users?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`);
      setData(res.data.data);
    } catch (err) {
      console.error("Failed to load users", err);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    if (user?.role !== "admin") return;
    loadUsers();
  }, [user, loadUsers]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const startEdit = (u: AdminUser) => {
    setEditingId(u.id);
    setEditRole(u.role);
    setEditTier(u.subscriptionTier);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async (userId: string) => {
    setSaving(true);
    try {
      await api.patch(`/admin/users/${userId}`, {
        role: editRole,
        subscriptionTier: editTier,
      });
      toast.success("Felhasználó frissítve");
      setEditingId(null);
      loadUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || "Hiba történt");
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("hu-HU", { year: "numeric", month: "2-digit", day: "2-digit" });
  };

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleDateString("hu-HU", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (user?.role !== "admin") {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/admin" className="text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Felhasználók kezelése</h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Összes felhasználó: {data?.total ?? "..."}
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Kereses nev, email vagy ceg szerint..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600 mx-auto" />
            <p className="mt-3 text-sm text-gray-400">Betoltes...</p>
          </div>
        ) : !data || data.users.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-400">Nincs talalat</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Felhasználó</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Szint</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Szerepkor</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Szerzodesek</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 hidden lg:table-cell">Regisztracio</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 hidden xl:table-cell">Utolso belepes</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Muveletek</th>
                </tr>
              </thead>
              <tbody>
                {data.users.map((u) => {
                  const isEditing = editingId === u.id;
                  return (
                    <tr key={u.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                            {u.name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{u.name}</p>
                            <p className="text-xs text-gray-400 truncate">{u.email}</p>
                            {u.companyName && <p className="text-xs text-gray-400 truncate">{u.companyName}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <select
                            value={editTier}
                            onChange={(e) => setEditTier(e.target.value)}
                            className="text-xs px-2 py-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-violet-500 outline-none"
                          >
                            <option value="free">Free</option>
                            <option value="basic">Basic</option>
                            <option value="pro">Pro</option>
                          </select>
                        ) : (
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${tierBadge[u.subscriptionTier] || tierBadge.free}`}>
                            {u.subscriptionTier}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <select
                            value={editRole}
                            onChange={(e) => setEditRole(e.target.value)}
                            className="text-xs px-2 py-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-violet-500 outline-none"
                          >
                            <option value="owner">Owner</option>
                            <option value="admin">Admin</option>
                            <option value="member">Member</option>
                            <option value="viewer">Viewer</option>
                          </select>
                        ) : (
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${roleBadge[u.role] || roleBadge.viewer}`}>
                            {u.role}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-gray-700 dark:text-gray-300 font-medium">{u.contractCount}</span>
                        <span className="text-gray-400 text-xs ml-1">/ {u.quoteCount} aj.</span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 hidden lg:table-cell">
                        {formatDate(u.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs hidden xl:table-cell">
                        {formatDateTime(u.lastLogin)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => saveEdit(u.id)}
                              disabled={saving}
                              className="px-3 py-1.5 bg-violet-600 text-white text-xs rounded-lg hover:bg-violet-700 disabled:opacity-50 transition"
                            >
                              {saving ? "..." : "Mentes"}
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                            >
                              Megse
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEdit(u)}
                            className="px-3 py-1.5 text-xs text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-lg transition"
                          >
                            Szerkesztes
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-400">
              {((data.page - 1) * data.limit) + 1} - {Math.min(data.page * data.limit, data.total)} / {data.total} felhasznalo
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 transition"
              >
                Elozo
              </button>
              <span className="px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400">
                {data.page} / {data.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={page >= data.totalPages}
                className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 transition"
              >
                Kovetkezo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
