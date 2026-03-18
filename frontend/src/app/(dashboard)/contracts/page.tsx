"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { useI18n } from "@/lib/i18n";

interface Signer {
  name: string;
  email: string;
  status: string;
}

interface Contract {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  expiresAt: string | null;
  pdfUrl: string | null;
  signers: Signer[];
}

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
  sent: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  partially_signed: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  declined: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  expired: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  cancelled: "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400",
  archived: "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400",
};

const STATUS_FILTER_KEYS = ["draft", "sent", "partially_signed", "completed", "declined", "expired"];

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("hu-HU", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function ContractsListPage() {
  const { t } = useI18n();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState(false);

  const loadContracts = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: "25" };
      if (statusFilter) params.status = statusFilter;
      if (search.trim()) params.search = search.trim();

      const res = await api.get("/contracts", { params });
      const data = res.data.data;
      setContracts(data.items ?? []);
      setTotalPages(data.totalPages ?? 1);
    } catch {
      toast.error(t("contracts.loadError"));
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter, search]);

  useEffect(() => {
    loadContracts();
  }, [loadContracts]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, search]);

  const allSelected = contracts.length > 0 && contracts.every((c) => selectedIds.has(c.id));

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(contracts.map((c) => c.id)));
    }
  }

  async function handleBulkExport() {
    const ids = Array.from(selectedIds).filter((id) =>
      contracts.find((c) => c.id === id && c.pdfUrl)
    );

    if (ids.length === 0) {
      toast.error(t("contracts.exportNoFiles"));
      return;
    }

    setExporting(true);
    try {
      const res = await api.post("/contracts/bulk-export", { contractIds: ids }, {
        responseType: "blob",
      });

      const blob = new Blob([res.data], { type: "application/zip" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `szerzodesek-${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(t("contracts.exportSuccess", { count: ids.length }));
    } catch {
      toast.error(t("contracts.exportError"));
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {t("contracts.title")}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t("contracts.manage")}
          </p>
        </div>
        <Link
          href="/create"
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-[#198296] hover:bg-[#146b7c] rounded-lg transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          {t("contracts.new")}
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
        <input
          type="text"
          placeholder={t("contracts.searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 sm:max-w-xs px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600
            bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
            placeholder-gray-400 dark:placeholder-gray-500
            focus:outline-none focus:ring-2 focus:ring-[#198296] focus:border-transparent text-sm"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600
            bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm
            focus:outline-none focus:ring-2 focus:ring-[#198296] focus:border-transparent"
        >
          <option value="">{t("contracts.filter.all")}</option>
          {STATUS_FILTER_KEYS.map((key) => (
            <option key={key} value={key}>{t(`contracts.status.${key}`)}</option>
          ))}
        </select>

        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {t("contracts.selected", { count: selectedIds.size })}
            </span>
            <button
              onClick={handleBulkExport}
              disabled={exporting}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white
                bg-[#198296] hover:bg-[#146b7c] rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exporting ? (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
              )}
              {exporting ? t("contracts.actions.exporting") : t("contracts.actions.exportZip")}
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
            >
              {t("contracts.actions.deselect")}
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="animate-pulse space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-14 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          ))}
        </div>
      ) : contracts.length === 0 ? (
        <div className="text-center py-16">
          <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
            {search || statusFilter ? t("contracts.emptyFiltered") : t("contracts.empty")}
          </p>
          {!search && !statusFilter && (
            <Link href="/create" className="text-sm text-[#198296] hover:underline font-medium mt-2 inline-block">
              {t("contracts.createFirst")}
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
          {/* Table header */}
          <div className="hidden sm:grid sm:grid-cols-[40px_3fr_1fr_1fr_1fr_1fr] gap-4 px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            <span className="flex items-center">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-[#198296] focus:ring-[#198296] cursor-pointer"
              />
            </span>
            <span>{t("contracts.title_column")}</span>
            <span>{t("contracts.status_column")}</span>
            <span>{t("contracts.createdAt")}</span>
            <span>{t("contracts.signers")}</span>
            <span>{t("contracts.pdf")}</span>
          </div>

          {/* Table rows */}
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {contracts.map((contract) => {
              const isSelected = selectedIds.has(contract.id);
              const signerSummary = contract.signers?.length
                ? `${contract.signers.filter((s) => s.status === "signed").length}/${contract.signers.length}`
                : "-";

              return (
                <li
                  key={contract.id}
                  className={`grid grid-cols-1 sm:grid-cols-[40px_3fr_1fr_1fr_1fr_1fr] gap-2 sm:gap-4 items-center px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                    isSelected ? "bg-[#198296]/5 dark:bg-[#198296]/10" : ""
                  }`}
                >
                  {/* Checkbox */}
                  <span className="hidden sm:flex items-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(contract.id)}
                      className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-[#198296] focus:ring-[#198296] cursor-pointer"
                    />
                  </span>

                  {/* Title */}
                  <div className="flex items-center gap-2 min-w-0">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(contract.id)}
                      className="sm:hidden w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-[#198296] focus:ring-[#198296] cursor-pointer shrink-0"
                    />
                    <Link
                      href={`/contracts/${contract.id}`}
                      className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-[#198296] dark:hover:text-[#198296] truncate transition-colors"
                    >
                      {contract.title}
                    </Link>
                  </div>

                  {/* Status */}
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium w-fit ${STATUS_COLORS[contract.status] ?? "bg-gray-100 text-gray-600"}`}>
                    {t(`contracts.status.${contract.status}`) !== `contracts.status.${contract.status}` ? t(`contracts.status.${contract.status}`) : contract.status}
                  </span>

                  {/* Date */}
                  <span className="text-xs text-gray-400 dark:text-gray-500 hidden sm:block">
                    {formatDate(contract.createdAt)}
                  </span>

                  {/* Signers */}
                  <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                    {t("contracts.signerCount", { count: signerSummary })}
                  </span>

                  {/* PDF indicator */}
                  <span className="hidden sm:block">
                    {contract.pdfUrl ? (
                      <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        PDF
                      </span>
                    ) : (
                      <span className="text-xs text-gray-300 dark:text-gray-600">-</span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            {t("common.previous")}
          </button>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            {t("common.next")}
          </button>
        </div>
      )}
    </div>
  );
}
