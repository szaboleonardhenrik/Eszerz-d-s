"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-store";
import { useI18n } from "@/lib/i18n";
import api from "@/lib/api";
import toast from "react-hot-toast";

const ADMIN_ROLES = ["superadmin", "employee"];

interface EmailLogEntry {
  id: string;
  to: string;
  subject: string;
  type: string;
  status: string;
  resendId: string | null;
  error: string | null;
  openedAt: string | null;
  clickedAt: string | null;
  createdAt: string;
  user: { name: string; email: string } | null;
}

interface EmailLogsData {
  logs: EmailLogEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  stats: Record<string, number>;
}

const typeLabel: Record<string, string> = {
  signing_invitation: "Aláírási meghívó",
  signed_confirmation: "Aláírás visszaigazolás",
  reminder: "Emlékeztető",
  verification: "Email megerősítés",
  password_reset: "Jelszó visszaállítás",
  quote_sent: "Ajánlat küldés",
  quote_accepted: "Ajánlat elfogadva",
  quote_declined: "Ajánlat elutasítva",
  portal_invitation: "Portál meghívó",
  signed_contract_owner: "Aláírt szerződés PDF",
  contract_expiry_warning: "Lejárati figyelmeztetés",
  otp: "OTP kód",
  custom: "Egyéni",
};

const statusLabel: Record<string, string> = {
  sent: "Elküldve",
  delivered: "Kézbesítve",
  bounced: "Visszapattant",
  complained: "Spam bejelentés",
  failed: "Sikertelen",
};

const statusColor: Record<string, string> = {
  sent: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
  delivered: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
  bounced: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
  complained: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400",
  failed: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
};

export default function AdminEmailLogsPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [data, setData] = useState<EmailLogsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [search, setSearch] = useState("");

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/admin/email-logs?page=${page}&limit=20`;
      if (statusFilter) url += `&status=${statusFilter}`;
      if (typeFilter) url += `&type=${typeFilter}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      const res = await api.get(url);
      setData(res.data.data);
    } catch { /* */ } finally {
      setLoading(false);
    }
  }, [page, statusFilter, typeFilter, search]);

  useEffect(() => {
    if (!ADMIN_ROLES.includes(user?.role ?? "")) return;
    loadLogs();
  }, [user, loadLogs]);

  useEffect(() => { setPage(1); }, [statusFilter, typeFilter, search]);

  const handleResend = async (id: string) => {
    try {
      await api.post(`/admin/email-logs/${id}/resend`);
      toast.success("Újraküldés indítva");
    } catch {
      toast.error("Hiba az újraküldésnél");
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("hu-HU", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t("admin.emailLogs.title")}</h1>
        </div>
      </div>

      {/* Stats */}
      {data?.stats && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(data.stats).map(([status, count]) => (
            <span key={status} className={`px-3 py-1.5 rounded-full text-xs font-semibold ${statusColor[status] || "bg-gray-100 text-gray-600"}`}>
              {statusLabel[status] || status}: {count}
            </span>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
        >
          <option value="">{t("admin.emailLogs.allStatuses")}</option>
          <option value="sent">Elküldve</option>
          <option value="delivered">Kézbesítve</option>
          <option value="bounced">Visszapattant</option>
          <option value="failed">Sikertelen</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
        >
          <option value="">{t("admin.emailLogs.allTypes")}</option>
          {Object.entries(typeLabel).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <div className="relative flex-1 min-w-[200px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder={t("admin.emailLogs.search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600 mx-auto" /></div>
        ) : !data || data.logs.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-400">{t("admin.emailLogs.noResults")}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">{t("admin.emailLogs.to")}</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">{t("admin.emailLogs.subject")}</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">{t("admin.emailLogs.type")}</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">{t("admin.emailLogs.status")}</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 hidden lg:table-cell">{t("admin.emailLogs.date")}</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">{t("admin.emailLogs.action")}</th>
                </tr>
              </thead>
              <tbody>
                {data.logs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-3">
                      <p className="text-gray-900 dark:text-gray-100 truncate max-w-[200px]">{log.to}</p>
                      {log.user && <p className="text-xs text-gray-400">{log.user.name}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-700 dark:text-gray-300 truncate max-w-[250px]">{log.subject}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-500">{typeLabel[log.type] || log.type}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${statusColor[log.status] || "bg-gray-100 text-gray-600"}`}>
                        {statusLabel[log.status] || log.status}
                      </span>
                      {log.openedAt && (
                        <span className="ml-1 text-[10px] text-emerald-500" title={`Megnyitva: ${formatDate(log.openedAt)}`}>
                          Megnyitva
                        </span>
                      )}
                      {log.error && (
                        <p className="text-[10px] text-red-400 mt-0.5 truncate max-w-[150px]" title={log.error}>{log.error}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs hidden lg:table-cell">{formatDate(log.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      {(log.status === "failed" || log.status === "bounced") && user?.role === "superadmin" && (
                        <button
                          onClick={() => handleResend(log.id)}
                          className="text-xs text-violet-600 hover:text-violet-700 dark:text-violet-400"
                        >
                          {t("admin.emailLogs.resend")}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-400">{data.total} {t("admin.emailLogs.entries")}</p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40">{t("admin.emailLogs.previous")}</button>
              <span className="px-3 py-1.5 text-xs text-gray-500">{data.page} / {data.totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))} disabled={page >= data.totalPages} className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40">{t("admin.emailLogs.next")}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
