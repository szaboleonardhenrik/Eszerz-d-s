"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-store";
import api from "@/lib/api";

const ADMIN_ROLES = ["superadmin", "employee"];

interface WebhookLogEntry {
  id: string;
  webhookId: string;
  event: string;
  url: string;
  statusCode: number | null;
  responseBody: string | null;
  error: string | null;
  attempt: number;
  success: boolean;
  durationMs: number | null;
  createdAt: string;
  webhook: {
    url: string;
    userId: string;
  };
}

interface WebhookLogsData {
  logs: WebhookLogEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface WebhookLogsStats {
  total: number;
  successful: number;
  failed: number;
  successRate: number;
}

export default function AdminWebhookLogsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<WebhookLogsData | null>(null);
  const [stats, setStats] = useState<WebhookLogsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/webhook-logs?page=${page}&limit=20`);
      setData(res.data.data);
    } catch { /* */ } finally {
      setLoading(false);
    }
  }, [page]);

  const loadStats = useCallback(async () => {
    try {
      const res = await api.get("/admin/webhook-logs/stats");
      setStats(res.data.data);
    } catch { /* */ }
  }, []);

  useEffect(() => {
    if (!ADMIN_ROLES.includes(user?.role ?? "")) return;
    loadLogs();
  }, [user, loadLogs]);

  useEffect(() => {
    if (!ADMIN_ROLES.includes(user?.role ?? "")) return;
    loadStats();
  }, [user, loadStats]);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("hu-HU", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (!ADMIN_ROLES.includes(user?.role ?? "")) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-gray-400">Nincs jogosultságod.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Link href="/admin" className="text-violet-600 hover:text-violet-700 dark:text-violet-400">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Webhook kézbesítési napló</h1>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">Összes kézbesítés</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{stats.total}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">Sikeres</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{stats.successful}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">Sikertelen</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{stats.failed}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">Sikerességi arány</p>
            <p className="text-2xl font-bold text-violet-600 dark:text-violet-400 mt-1">{stats.successRate}%</p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600 mx-auto" />
          </div>
        ) : !data || data.logs.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-400">Nincs webhook kézbesítési bejegyzés.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Időpont</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Webhook URL</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Esemény</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Státusz</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Kísérlet</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Időtartam</th>
                </tr>
              </thead>
              <tbody>
                {data.logs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-700 dark:text-gray-300 truncate max-w-[250px] font-mono text-xs" title={log.webhook?.url || log.url}>
                        {log.webhook?.url || log.url}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-xs text-gray-600 dark:text-gray-300 font-mono">
                        {log.event}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {log.success ? (
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                          {log.statusCode || "OK"}
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400">
                          {log.statusCode || "Hiba"}
                        </span>
                      )}
                      {log.error && (
                        <p className="text-[10px] text-red-400 mt-0.5 truncate max-w-[150px]" title={log.error}>
                          {log.error}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {log.attempt}/3
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {log.durationMs !== null ? `${log.durationMs} ms` : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-400">{data.total} bejegyzés</p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40"
              >
                Előző
              </button>
              <span className="px-3 py-1.5 text-xs text-gray-500">
                {data.page} / {data.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={page >= data.totalPages}
                className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40"
              >
                Következő
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
