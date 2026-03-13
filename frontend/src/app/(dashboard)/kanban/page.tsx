"use client";

import { useEffect, useState, useCallback, DragEvent } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import api from "@/lib/api";

interface Signer {
  name: string;
  email: string;
  status: string;
}

interface Tag {
  tag: {
    id: string;
    name: string;
    color: string;
  };
}

interface Contract {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  signers: Signer[];
  tags: Tag[];
}

type ColumnStatus = "draft" | "sent" | "partially_signed" | "completed" | "declined";

interface Column {
  status: ColumnStatus;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

const COLUMNS: Column[] = [
  {
    status: "draft",
    label: "Piszkozat",
    color: "text-gray-700 dark:text-gray-300",
    bgColor: "bg-gray-100 dark:bg-gray-700",
    borderColor: "border-gray-300 dark:border-gray-600",
  },
  {
    status: "sent",
    label: "Elkuldve",
    color: "text-[#198296]",
    bgColor: "bg-teal-50 dark:bg-teal-900/20",
    borderColor: "border-[#198296]",
  },
  {
    status: "partially_signed",
    label: "Reszben alairt",
    color: "text-[#D29B01]",
    bgColor: "bg-amber-50 dark:bg-amber-900/20",
    borderColor: "border-[#D29B01]",
  },
  {
    status: "completed",
    label: "Kesz",
    color: "text-emerald-700 dark:text-emerald-400",
    bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
    borderColor: "border-emerald-400",
  },
  {
    status: "declined",
    label: "Visszautasitva",
    color: "text-red-700 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-900/20",
    borderColor: "border-red-400",
  },
];

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("hu-HU", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function ContractCard({
  contract,
  onDragStart,
}: {
  contract: Contract;
  onDragStart: (e: DragEvent<HTMLDivElement>, contract: Contract) => void;
}) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, contract)}
      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3.5 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing group"
    >
      <Link href={`/contracts/${contract.id}`} className="block">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:text-[#198296] transition-colors line-clamp-2">
          {contract.title}
        </h4>
      </Link>

      {contract.signers.length > 0 && (
        <div className="mt-2 space-y-1">
          {contract.signers.map((signer, idx) => (
            <div key={idx} className="flex items-center gap-1.5">
              <div
                className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  signer.status === "signed"
                    ? "bg-emerald-500"
                    : signer.status === "declined"
                      ? "bg-red-500"
                      : "bg-gray-300 dark:bg-gray-600"
                }`}
              />
              <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {signer.name}
              </span>
            </div>
          ))}
        </div>
      )}

      {contract.tags.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1">
          {contract.tags.map((t) => (
            <span
              key={t.tag.id}
              className="inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-full"
              style={{
                backgroundColor: t.tag.color + "20",
                color: t.tag.color,
              }}
            >
              {t.tag.name}
            </span>
          ))}
        </div>
      )}

      <p className="mt-2.5 text-[11px] text-gray-400 dark:text-gray-500">
        {formatDate(contract.updatedAt)}
      </p>
    </div>
  );
}

export default function KanbanPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragOverColumn, setDragOverColumn] = useState<ColumnStatus | null>(null);

  const fetchContracts = useCallback(async () => {
    try {
      const res = await api.get("/contracts", { params: { limit: "100" } });
      setContracts(res.data.data.items ?? []);
    } catch {
      toast.error("Nem sikerült betölteni a szerződéseket.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  const grouped = COLUMNS.reduce<Record<ColumnStatus, Contract[]>>(
    (acc, col) => {
      acc[col.status] = contracts.filter((c) => c.status === col.status);
      return acc;
    },
    {} as Record<ColumnStatus, Contract[]>,
  );

  const handleDragStart = (e: DragEvent<HTMLDivElement>, contract: Contract) => {
    e.dataTransfer.setData("text/plain", JSON.stringify({ id: contract.id, status: contract.status }));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>, status: ColumnStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverColumn(status);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>, targetStatus: ColumnStatus) => {
    e.preventDefault();
    setDragOverColumn(null);

    try {
      const data = JSON.parse(e.dataTransfer.getData("text/plain"));
      if (data.status === targetStatus) return;

      // Optimistic update
      setContracts((prev) =>
        prev.map((c) => (c.id === data.id ? { ...c, status: targetStatus } : c))
      );

      try {
        await api.patch(`/contracts/${data.id}/status`, { status: targetStatus });
        toast.success("Státusz frissítve");
      } catch {
        // Revert on failure
        setContracts((prev) =>
          prev.map((c) => (c.id === data.id ? { ...c, status: data.status } : c))
        );
        toast.error("Nem sikerült a státusz módosítása");
      }
    } catch {
      // ignore malformed drag data
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#198296]" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Kanban tabla
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Szerzod\u00e9sek \u00e1ttekint\u00e9se st\u00e1tusz szerint
          </p>
        </div>
        <span className="text-sm text-gray-400 dark:text-gray-500">
          {contracts.length} szerzod\u00e9s
        </span>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
        {COLUMNS.map((col) => {
          const items = grouped[col.status];
          const isDragOver = dragOverColumn === col.status;

          return (
            <div
              key={col.status}
              className={`flex-shrink-0 w-72 rounded-xl border-2 transition-colors ${
                isDragOver
                  ? `${col.borderColor} bg-opacity-50`
                  : "border-transparent"
              }`}
              onDragOver={(e) => handleDragOver(e, col.status)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.status)}
            >
              <div className={`rounded-t-lg px-3 py-2.5 ${col.bgColor}`}>
                <div className="flex items-center justify-between">
                  <h3 className={`text-sm font-semibold ${col.color}`}>
                    {col.label}
                  </h3>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${col.bgColor} ${col.color}`}
                  >
                    {items.length}
                  </span>
                </div>
              </div>

              <div className="p-2 space-y-2 min-h-[120px] bg-gray-50/50 dark:bg-gray-900/30 rounded-b-lg">
                {items.length === 0 ? (
                  <div className="flex items-center justify-center h-24 text-xs text-gray-400 dark:text-gray-600">
                    Nincs szerzod\u00e9s
                  </div>
                ) : (
                  items.map((contract) => (
                    <ContractCard
                      key={contract.id}
                      contract={contract}
                      onDragStart={handleDragStart}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
