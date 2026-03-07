"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { sanitizeHtml } from "@/lib/sanitize";

interface ContractListItem {
  id: string;
  title: string;
  status: string;
  createdAt: string;
}

interface Signer {
  id: string;
  name: string;
  email: string;
  status: string;
}

interface ContractDetail {
  id: string;
  title: string;
  status: string;
  contentHtml: string;
  createdAt: string;
  signers: Signer[];
}

const statusLabels: Record<string, string> = {
  draft: "Piszkozat",
  sent: "Elkuld\u00f6tt",
  partially_signed: "R\u00e9szben al\u00e1\u00edrt",
  completed: "Teljes\u00edtve",
  declined: "Visszautas\u00edtva",
  expired: "Lej\u00e1rt",
  cancelled: "Visszavonva",
};

const statusBadgeClass: Record<string, string> = {
  draft:
    "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
  sent:
    "bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300",
  completed:
    "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  declined:
    "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  partially_signed:
    "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  expired:
    "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400",
  cancelled:
    "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
        statusBadgeClass[status] ?? "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
      }`}
    >
      {statusLabels[status] ?? status}
    </span>
  );
}

export default function ContractComparePage() {
  const [contracts, setContracts] = useState<ContractListItem[]>([]);
  const [listLoading, setListLoading] = useState(true);

  const [idA, setIdA] = useState<string>("");
  const [idB, setIdB] = useState<string>("");

  const [contractA, setContractA] = useState<ContractDetail | null>(null);
  const [contractB, setContractB] = useState<ContractDetail | null>(null);
  const [loadingA, setLoadingA] = useState(false);
  const [loadingB, setLoadingB] = useState(false);

  // Fetch contract list
  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/contracts", { params: { limit: 100 } });
        setContracts(res.data.data.items ?? []);
      } catch {
        // silently fail
      } finally {
        setListLoading(false);
      }
    };
    load();
  }, []);

  // Fetch contract A details
  useEffect(() => {
    if (!idA) {
      setContractA(null);
      return;
    }
    const load = async () => {
      setLoadingA(true);
      try {
        const res = await api.get(`/contracts/${idA}`);
        setContractA(res.data.data);
      } catch {
        setContractA(null);
      } finally {
        setLoadingA(false);
      }
    };
    load();
  }, [idA]);

  // Fetch contract B details
  useEffect(() => {
    if (!idB) {
      setContractB(null);
      return;
    }
    const load = async () => {
      setLoadingB(true);
      try {
        const res = await api.get(`/contracts/${idB}`);
        setContractB(res.data.data);
      } catch {
        setContractB(null);
      } finally {
        setLoadingB(false);
      }
    };
    load();
  }, [idB]);

  const handleSwap = () => {
    const tmpA = idA;
    setIdA(idB);
    setIdB(tmpA);
  };

  const bothSelected = contractA && contractB && !loadingA && !loadingB;

  const metaRows = bothSelected
    ? [
        {
          label: "C\u00edm",
          a: contractA.title,
          b: contractB.title,
        },
        {
          label: "St\u00e1tusz",
          a: statusLabels[contractA.status] ?? contractA.status,
          b: statusLabels[contractB.status] ?? contractB.status,
        },
        {
          label: "L\u00e9trehozva",
          a: new Date(contractA.createdAt).toLocaleString("hu-HU"),
          b: new Date(contractB.createdAt).toLocaleString("hu-HU"),
        },
        {
          label: "Al\u00e1\u00edr\u00f3k sz\u00e1ma",
          a: String(contractA.signers?.length ?? 0),
          b: String(contractB.signers?.length ?? 0),
        },
      ]
    : [];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <h1
        className="text-2xl font-bold mb-6 dark:text-white"
        style={{ color: "#198296" }}
      >
        Szerz\u0151d\u00e9s \u00f6sszehasonl\u00edt\u00e1s
      </h1>

      {/* Selectors */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-6 mb-6">
        {listLoading ? (
          <div className="flex justify-center py-4">
            <div
              className="animate-spin rounded-full h-6 w-6 border-b-2"
              style={{ borderColor: "#198296" }}
            />
          </div>
        ) : contracts.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">
            Nincsenek szerz\u0151d\u00e9sek az \u00f6sszehasonl\u00edt\u00e1shoz.
          </p>
        ) : (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
            {/* Contract A */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Szerz\u0151d\u00e9s A
              </label>
              <select
                value={idA}
                onChange={(e) => setIdA(e.target.value)}
                className="w-full border dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2"
                style={{
                  focusRingColor: "#198296",
                } as React.CSSProperties}
              >
                <option value="">V\u00e1lasszon szerz\u0151d\u00e9st...</option>
                {contracts.map((c) => (
                  <option key={c.id} value={c.id} disabled={c.id === idB}>
                    {c.title} ({statusLabels[c.status] ?? c.status})
                  </option>
                ))}
              </select>
            </div>

            {/* Swap button */}
            <button
              onClick={handleSwap}
              disabled={!idA && !idB}
              className="self-center sm:self-end shrink-0 p-2.5 rounded-lg border dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Csere"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
                />
              </svg>
            </button>

            {/* Contract B */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Szerz\u0151d\u00e9s B
              </label>
              <select
                value={idB}
                onChange={(e) => setIdB(e.target.value)}
                className="w-full border dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2"
              >
                <option value="">V\u00e1lasszon szerz\u0151d\u00e9st...</option>
                {contracts.map((c) => (
                  <option key={c.id} value={c.id} disabled={c.id === idA}>
                    {c.title} ({statusLabels[c.status] ?? c.status})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Loading state */}
      {(loadingA || loadingB) && (
        <div className="flex justify-center py-12">
          <div
            className="animate-spin rounded-full h-8 w-8 border-b-2"
            style={{ borderColor: "#198296" }}
          />
        </div>
      )}

      {/* Empty state: waiting for selection */}
      {!loadingA && !loadingB && (!idA || !idB) && contracts.length > 0 && (
        <div className="text-center py-16 text-gray-400 dark:text-gray-500">
          <svg
            className="mx-auto h-12 w-12 mb-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7.5 3.75H6A2.25 2.25 0 003.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0120.25 6v1.5m0 9V18A2.25 2.25 0 0118 20.25h-1.5m-9 0H6A2.25 2.25 0 013.75 18v-1.5M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <p className="text-sm">
            V\u00e1lasszon ki k\u00e9t szerz\u0151d\u00e9st az \u00f6sszehasonl\u00edt\u00e1shoz.
          </p>
        </div>
      )}

      {/* Side-by-side content comparison */}
      {bothSelected && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Contract A panel */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 overflow-hidden">
              <div className="px-6 py-4 border-b dark:border-gray-700 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-semibold text-gray-900 dark:text-white truncate">
                    {contractA.title}
                  </h2>
                </div>
                <StatusBadge status={contractA.status} />
              </div>
              <div
                className="p-6 prose prose-sm dark:prose-invert max-w-none overflow-auto"
                style={{ maxHeight: "600px" }}
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(contractA.contentHtml) }}
              />
            </div>

            {/* Contract B panel */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 overflow-hidden">
              <div className="px-6 py-4 border-b dark:border-gray-700 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-semibold text-gray-900 dark:text-white truncate">
                    {contractB.title}
                  </h2>
                </div>
                <StatusBadge status={contractB.status} />
              </div>
              <div
                className="p-6 prose prose-sm dark:prose-invert max-w-none overflow-auto"
                style={{ maxHeight: "600px" }}
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(contractB.contentHtml) }}
              />
            </div>
          </div>

          {/* Metadata comparison table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-6">
            <h2
              className="text-lg font-semibold mb-4 dark:text-white"
              style={{ color: "#198296" }}
            >
              Metaadatok \u00f6sszehasonl\u00edt\u00e1sa
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400 w-1/4">
                      Mez\u0151
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400 w-[37.5%]">
                      Szerz\u0151d\u00e9s A
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400 w-[37.5%]">
                      Szerz\u0151d\u00e9s B
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {metaRows.map((row) => {
                    const isDifferent = row.a !== row.b;
                    return (
                      <tr
                        key={row.label}
                        className={`border-b last:border-b-0 dark:border-gray-700 ${
                          isDifferent
                            ? "bg-amber-50 dark:bg-amber-950/30"
                            : ""
                        }`}
                      >
                        <td className="py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                          {row.label}
                        </td>
                        <td className="py-3 px-4 text-gray-900 dark:text-gray-100">
                          {row.a}
                        </td>
                        <td className="py-3 px-4 text-gray-900 dark:text-gray-100">
                          {row.b}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
