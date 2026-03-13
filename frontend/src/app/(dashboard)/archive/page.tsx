"use client";

import { useEffect, useState, useMemo } from "react";
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
  updatedAt: string;
  pdfUrl: string | null;
  signers: Signer[];
}

function SkeletonTable() {
  return (
    <div className="animate-pulse">
      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 py-3 border-b border-gray-100 dark:border-gray-800"
        >
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded flex-[3]" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded flex-1" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded flex-1 hidden sm:block" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded flex-1 hidden md:block" />
          <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      ))}
    </div>
  );
}

const STATUS_LABELS: Record<string, string> = {
  draft: "Piszkozat",
  sent: "Elküldve",
  completed: "Aláírva",
  declined: "Visszautasítva",
  partially_signed: "Részben aláírt",
  archived: "Archivált",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("hu-HU", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function ArchivePage() {
  const { t } = useI18n();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [restoringIds, setRestoringIds] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    api
      .get("/contracts", { params: { status: "archived", limit: 50 } })
      .then((res) => {
        setContracts(res.data.data.items ?? []);
      })
      .catch(() => {
        toast.error("Nem sikerült betölteni az archivált szerződéseket.");
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return contracts;
    const q = search.toLowerCase();
    return contracts.filter((c) => c.title.toLowerCase().includes(q));
  }, [contracts, search]);

  const allSelected = filtered.length > 0 && filtered.every((c) => selectedIds.has(c.id));

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
      setSelectedIds(new Set(filtered.map((c) => c.id)));
    }
  }

  async function handleBulkExport() {
    const ids = Array.from(selectedIds).filter((id) =>
      contracts.find((c) => c.id === id && c.pdfUrl)
    );

    if (ids.length === 0) {
      toast.error("Nincs letölthető PDF a kiválasztott szerződésekhez.");
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
      a.download = `szerzodesek-archiv-${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`${ids.length} szerződés letöltve ZIP-ben.`);
    } catch {
      toast.error("Hiba a ZIP exportálás során.");
    } finally {
      setExporting(false);
    }
  }

  async function handleRestore(id: string) {
    setRestoringIds((prev) => new Set(prev).add(id));
    try {
      await api.post(`/contracts/${id}/unarchive`);
      setContracts((prev) => prev.filter((c) => c.id !== id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      toast.success("Szerződés visszaállítva.");
    } catch {
      toast.error("Nem sikerült visszaállítani a szerződést.");
    } finally {
      setRestoringIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {t("archive.title")}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {t("archive.subtitle")}
        </p>
      </div>

      {/* Search + Bulk Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
        <input
          type="text"
          placeholder="Keresés cím alapján..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 sm:max-w-xs px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600
            bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
            placeholder-gray-400 dark:placeholder-gray-500
            focus:outline-none focus:ring-2 focus:ring-[#198296] focus:border-transparent
            text-sm"
        />

        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {selectedIds.size} kiválasztva
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
              {exporting ? "Exportálás..." : "ZIP letöltés"}
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
            >
              Mégsem
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <SkeletonTable />
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <svg
            className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
            />
          </svg>
          <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
            {t("archive.empty")}
          </p>
          {search && (
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
              Próbáld más keresési feltétellel.
            </p>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
          {/* Table header */}
          <div className="hidden sm:grid sm:grid-cols-[40px_3fr_1fr_1fr_1fr_auto] gap-4 px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            <span className="flex items-center">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-[#198296] focus:ring-[#198296] cursor-pointer"
              />
            </span>
            <span>Cím</span>
            <span>Státusz</span>
            <span>Archiválva</span>
            <span>Aláírók</span>
            <span className="w-28" />
          </div>

          {/* Table rows */}
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {filtered.map((contract) => {
              const isRestoring = restoringIds.has(contract.id);
              const isSelected = selectedIds.has(contract.id);
              const signerNames = contract.signers
                ?.map((s) => s.name)
                .filter(Boolean)
                .join(", ");
              const statusLabel =
                STATUS_LABELS[contract.status] ?? contract.status;

              return (
                <li
                  key={contract.id}
                  className={`grid grid-cols-1 sm:grid-cols-[40px_3fr_1fr_1fr_1fr_auto] gap-2 sm:gap-4 items-center px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
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
                  <div className="flex items-center gap-2">
                    {/* Mobile checkbox */}
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
                    {contract.pdfUrl && (
                      <svg className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                    )}
                  </div>

                  {/* Status */}
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {statusLabel}
                  </span>

                  {/* Archived date */}
                  <span className="text-xs text-gray-400 dark:text-gray-500 hidden sm:block">
                    {formatDate(contract.updatedAt)}
                  </span>

                  {/* Signers */}
                  <span
                    className="text-xs text-gray-400 dark:text-gray-500 truncate hidden md:block"
                    title={signerNames}
                  >
                    {signerNames || "-"}
                  </span>

                  {/* Restore button */}
                  <button
                    onClick={() => handleRestore(contract.id)}
                    disabled={isRestoring}
                    className="w-28 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium
                      rounded-lg border border-[#198296] text-[#198296] dark:text-[#198296]
                      hover:bg-[#198296] hover:text-white dark:hover:bg-[#198296] dark:hover:text-white
                      disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isRestoring ? (
                      <svg
                        className="animate-spin h-3.5 w-3.5"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"
                        />
                      </svg>
                    )}
                    {t("archive.restore")}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
