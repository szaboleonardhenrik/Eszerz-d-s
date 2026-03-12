"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-store";
import api from "@/lib/api";

const ADMIN_ROLES = ["superadmin", "employee"];

type InvoiceStatus = "paid" | "pending" | "overdue" | "cancelled";

interface Invoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  status: InvoiceStatus;
  createdAt: string;
  dueDate: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface StatusStat {
  count: number;
  total: number;
}

interface InvoicesResponse {
  invoices: Invoice[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  stats: Record<string, StatusStat>;
}

const statusLabel: Record<InvoiceStatus, string> = {
  paid: "Fizetve",
  pending: "Függőben",
  overdue: "Lejárt",
  cancelled: "Törölve",
};

const statusBadge: Record<InvoiceStatus, string> = {
  paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
  overdue: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
  cancelled: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400",
};

const statusCardColor: Record<InvoiceStatus, { bg: string; icon: string }> = {
  paid: {
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    icon: "text-emerald-600 dark:text-emerald-400",
  },
  pending: {
    bg: "bg-amber-50 dark:bg-amber-900/20",
    icon: "text-amber-600 dark:text-amber-400",
  },
  overdue: {
    bg: "bg-red-50 dark:bg-red-900/20",
    icon: "text-red-600 dark:text-red-400",
  },
  cancelled: {
    bg: "bg-gray-50 dark:bg-gray-800/50",
    icon: "text-gray-500 dark:text-gray-400",
  },
};

function formatHuf(amount: number): string {
  return new Intl.NumberFormat("hu-HU", {
    style: "currency",
    currency: "HUF",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("hu-HU", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export default function AdminInvoicesPage() {
  const { user } = useAuth();
  const [data, setData] = useState<InvoicesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const limit = 20;

  const loadInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (statusFilter !== "all") {
        params.set("status", statusFilter);
      }
      const res = await api.get(`/admin/invoices?${params.toString()}`);
      setData(res.data.data ?? res.data);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    if (!ADMIN_ROLES.includes(user?.role ?? "")) return;
    loadInvoices();
  }, [user, loadInvoices]);

  if (!ADMIN_ROLES.includes(user?.role ?? "")) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-gray-400">Nincs jogosultságod.</p>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600 mx-auto" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center text-gray-400 py-20">
        Nem sikerült betölteni a számlákat.
      </div>
    );
  }

  const statuses: InvoiceStatus[] = ["paid", "pending", "overdue", "cancelled"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <Link
          href="/admin"
          className="text-violet-600 hover:text-violet-700 dark:text-violet-400"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Számla kezelés
        </h1>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statuses.map((status) => {
          const stat = data.stats?.[status] ?? { count: 0, total: 0 };
          const colors = statusCardColor[status];
          return (
            <div
              key={status}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5"
            >
              <div
                className={`inline-block px-2 py-1 rounded-lg text-[10px] font-semibold uppercase mb-3 ${colors.bg} ${colors.icon}`}
              >
                {statusLabel[status]}
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stat.count} db
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {formatHuf(stat.total)}
              </p>
            </div>
          );
        })}
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Státusz:
        </label>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
        >
          <option value="all">Összes</option>
          <option value="paid">Fizetve</option>
          <option value="pending">Függőben</option>
          <option value="overdue">Lejárt</option>
          <option value="cancelled">Törölve</option>
        </select>
        {loading && (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-violet-500" />
        )}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <th className="text-left px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">
                  Számla szám
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">
                  Felhasználó
                </th>
                <th className="text-right px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">
                  Összeg
                </th>
                <th className="text-center px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">
                  Státusz
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">
                  Létrehozva
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">
                  Fizetési határidő
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {data.invoices.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-12 text-gray-400"
                  >
                    Nincs találat.
                  </td>
                </tr>
              ) : (
                data.invoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-gray-900 dark:text-gray-100">
                      {inv.invoiceNumber}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-gray-900 dark:text-gray-100 font-medium">
                        {inv.user.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {inv.user.email}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                      {formatHuf(inv.amount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          statusBadge[inv.status] ?? statusBadge.pending
                        }`}
                      >
                        {statusLabel[inv.status] ?? inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {formatDate(inv.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {formatDate(inv.dueDate)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Összesen {data.total} számla, {data.totalPages} oldal
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Előző
            </button>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {page} / {data.totalPages}
            </span>
            <button
              disabled={page >= data.totalPages}
              onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
              className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Következő
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
