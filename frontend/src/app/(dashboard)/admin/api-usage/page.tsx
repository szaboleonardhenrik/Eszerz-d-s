"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-store";
import api from "@/lib/api";

const ADMIN_ROLES = ["superadmin", "employee"];

interface ApiUsageData {
  totalCalls: number;
  errorRate: number;
  topUsers: Array<{ userId: string; name: string; email: string; calls: number; avgMs: number }>;
  topEndpoints: Array<{ method: string; path: string; calls: number; avgMs: number }>;
  dailyStats: Array<{ date: string; calls: number; avg_ms: number }>;
}

const methodColors: Record<string, string> = {
  GET: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
  POST: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
  PATCH: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
  PUT: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400",
  DELETE: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
};

export default function AdminApiUsagePage() {
  const { user } = useAuth();
  const [data, setData] = useState<ApiUsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    if (!ADMIN_ROLES.includes(user?.role ?? "")) return;
    setLoading(true);
    api.get(`/admin/api-usage?days=${days}`).then((res) => {
      setData(res.data.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user, days]);

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">API használat</h1>
        </div>
        <select
          value={days}
          onChange={(e) => setDays(parseInt(e.target.value))}
          className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
        >
          <option value={7}>Utolsó 7 nap</option>
          <option value={30}>Utolsó 30 nap</option>
          <option value={90}>Utolsó 90 nap</option>
        </select>
      </div>

      {loading ? (
        <div className="min-h-[40vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-600" />
        </div>
      ) : !data ? (
        <div className="text-center text-gray-400 py-20">Nem sikerült betölteni.</div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <p className="text-xs text-gray-400 uppercase font-semibold mb-2">Összes hívás</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{data.totalCalls.toLocaleString("hu-HU")}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <p className="text-xs text-gray-400 uppercase font-semibold mb-2">Hibaarány</p>
              <p className={`text-3xl font-bold ${data.errorRate > 5 ? "text-red-500" : "text-emerald-500"}`}>{data.errorRate}%</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <p className="text-xs text-gray-400 uppercase font-semibold mb-2">Aktív API felhasználók</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{data.topUsers.length}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top users */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Top API felhasználók</h3>
              {data.topUsers.length === 0 ? (
                <p className="text-sm text-gray-400 py-4">Nincs API hívás ebben az időszakban.</p>
              ) : (
                <div className="space-y-3">
                  {data.topUsers.map((u, i) => (
                    <div key={u.userId} className="flex items-center gap-3 py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                      <span className="w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 flex items-center justify-center text-xs font-bold">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{u.name}</p>
                        <p className="text-xs text-gray-400 truncate">{u.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{u.calls.toLocaleString("hu-HU")}</p>
                        <p className="text-xs text-gray-400">{u.avgMs} ms átlag</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top endpoints */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Top végpontok</h3>
              {data.topEndpoints.length === 0 ? (
                <p className="text-sm text-gray-400 py-4">Nincs API hívás ebben az időszakban.</p>
              ) : (
                <div className="space-y-2">
                  {data.topEndpoints.map((e, i) => (
                    <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${methodColors[e.method] || "bg-gray-100 text-gray-600"}`}>{e.method}</span>
                      <p className="flex-1 text-sm text-gray-700 dark:text-gray-300 font-mono truncate">{e.path}</p>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{e.calls.toLocaleString("hu-HU")}</p>
                        <p className="text-xs text-gray-400">{e.avgMs} ms</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Daily chart */}
          {data.dailyStats.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Napi hívások</h3>
              <div className="flex items-end gap-1 h-32">
                {data.dailyStats.slice().reverse().map((d, i) => {
                  const maxCalls = Math.max(...data.dailyStats.map((s) => s.calls), 1);
                  const pct = (d.calls / maxCalls) * 100;
                  return (
                    <div key={i} className="flex-1 group relative">
                      <div
                        className="w-full bg-violet-500/80 dark:bg-violet-400/80 rounded-t transition-all hover:bg-violet-600"
                        style={{ height: `${Math.max(pct, 2)}%` }}
                        title={`${d.date}: ${d.calls} hívás, ${d.avg_ms} ms átlag`}
                      />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-gray-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-10">
                        {d.date}: {d.calls} hívás
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
