"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import api from "@/lib/api";
import toast from "react-hot-toast";

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
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [restoringIds, setRestoringIds] = useState<Set<string>>(new Set());

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

  async function handleRestore(id: string) {
    setRestoringIds((prev) => new Set(prev).add(id));
    try {
      await api.post(`/contracts/${id}/unarchive`);
      setContracts((prev) => prev.filter((c) => c.id !== id));
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
          Archívum
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Archivált szerződések
        </p>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Keresés cím alapján..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-80 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600
            bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
            placeholder-gray-400 dark:placeholder-gray-500
            focus:outline-none focus:ring-2 focus:ring-[#198296] focus:border-transparent
            text-sm"
        />
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
            Nincs archivált szerződés
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
          <div className="hidden sm:grid sm:grid-cols-[3fr_1fr_1fr_1fr_auto] gap-4 px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
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
              const signerNames = contract.signers
                ?.map((s) => s.name)
                .filter(Boolean)
                .join(", ");
              const statusLabel =
                STATUS_LABELS[contract.status] ?? contract.status;

              return (
                <li
                  key={contract.id}
                  className="grid grid-cols-1 sm:grid-cols-[3fr_1fr_1fr_1fr_auto] gap-2 sm:gap-4 items-center px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  {/* Title */}
                  <Link
                    href={`/contracts/${contract.id}`}
                    className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-[#198296] dark:hover:text-[#198296] truncate transition-colors"
                  >
                    {contract.title}
                  </Link>

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
                    Visszaállítás
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
