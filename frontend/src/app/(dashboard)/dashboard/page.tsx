"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { SkeletonStats, SkeletonRow } from "@/components/skeleton";
import EmptyState from "@/components/empty-state";
import ActivityFeed from "@/components/activity-feed";
import WidgetReorder from "@/components/widget-reorder";

interface MonthlyData {
  month: string;
  created: number;
  signed: number;
}

interface Usage {
  used: number;
  limit: number;
  tier: string;
}

interface Stats {
  total: number;
  draft: number;
  awaitingSignature: number;
  completed: number;
  declined: number;
  expired: number;
  monthlyStats: MonthlyData[];
  usage: Usage;
}

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface Contract {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  signers: { name: string; email: string; status: string; role: string }[];
  template?: { name: string; category: string };
  tags?: { tag: Tag }[];
}

interface Pagination {
  items: Contract[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface Widget {
  expiringContracts: { id: string; title: string; expiresAt: string; pendingSigners: number; totalSigners: number }[];
  awaitingSignature: { id: string; title: string; pendingSigners: string[]; waitingSince: string }[];
  recentlyCompleted: { id: string; title: string; updatedAt: string }[];
}

interface Folder {
  id: string;
  name: string;
  color: string;
}

const statusLabels: Record<string, string> = {
  draft: "Piszkozat",
  sent: "Elküldve",
  partially_signed: "Részben aláírt",
  completed: "Kész",
  declined: "Visszautasítva",
  expired: "Lejárt",
  cancelled: "Visszavonva",
};

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  sent: "bg-yellow-100 text-yellow-700",
  partially_signed: "bg-orange-100 text-orange-700",
  completed: "bg-green-100 text-green-700",
  declined: "bg-red-100 text-red-700",
  expired: "bg-gray-100 text-gray-500",
  cancelled: "bg-gray-100 text-gray-500",
};

function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [filter, setFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 400);
  const [loading, setLoading] = useState(true);
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [widgets, setWidgets] = useState<Widget | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTag, setSelectedTag] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState("");
  const [showFolders, setShowFolders] = useState(false);
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [widgetConfig, setWidgetConfig] = useState<Record<string, boolean>>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("dashboard_widgets");
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return { expiring: true, awaiting: true, completed: true, chart: true, usage: true };
  });

  const [widgetOrder, setWidgetOrder] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("dashboard_widget_order");
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return ["expiring", "awaiting", "completed", "activity", "chart", "usage"];
  });
  const [showReorder, setShowReorder] = useState(false);

  const toggleWidget = (key: string) => {
    setWidgetConfig((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem("dashboard_widgets", JSON.stringify(next));
      return next;
    });
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleExport = async (format: "csv" | "json") => {
    setExportOpen(false);
    try {
      const res = await api.get("/contracts/export", {
        params: { format },
        responseType: "blob",
      });
      const ext = format === "json" ? "json" : "csv";
      const blob = new Blob([res.data], {
        type: format === "json" ? "application/json" : "text/csv",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `szerzodesek.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Export sikeres!");
    } catch {
      toast.error("Hiba az exportálás során");
    }
  };

  useEffect(() => {
    api.get("/tags").then((res) => setTags(res.data.data ?? [])).catch(() => {});
    api.get("/contracts/widgets").then((res) => setWidgets(res.data.data)).catch(() => {});
    api.get("/folders").then((res) => setFolders(res.data.data ?? [])).catch(() => {});
  }, []);

  const handleDragStart = (e: React.DragEvent, contractId: string) => {
    e.dataTransfer.setData("contractId", contractId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDropOnFolder = async (e: React.DragEvent, folderId: string | null) => {
    e.preventDefault();
    setDragOverFolder(null);
    const contractId = e.dataTransfer.getData("contractId");
    if (!contractId) return;
    try {
      if (folderId) {
        await api.post(`/folders/${folderId}/contracts/${contractId}`);
      } else {
        await api.delete(`/folders/contracts/${contractId}`);
      }
      toast.success("Szerződés áthelyezve");
      loadData();
    } catch {
      toast.error("Hiba az áthelyezéskor");
    }
  };

  const createFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      const res = await api.post("/folders", { name: newFolderName.trim() });
      setFolders((prev) => [...prev, res.data.data]);
      setNewFolderName("");
      toast.success("Mappa létrehozva");
    } catch {
      toast.error("Hiba a mappa létrehozásakor");
    }
  };

  useEffect(() => {
    setPage(1);
  }, [filter, debouncedSearch, selectedTag, dateFrom, dateTo, selectedFolder]);

  useEffect(() => {
    loadData();
  }, [filter, debouncedSearch, selectedTag, page, dateFrom, dateTo, selectedFolder]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: "20" };
      if (filter) params.status = filter;
      if (debouncedSearch) params.search = debouncedSearch;
      if (selectedTag) params.tagId = selectedTag;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      if (selectedFolder) params.folderId = selectedFolder;

      const [statsRes, contractsRes] = await Promise.all([
        api.get("/contracts/stats"),
        api.get("/contracts", { params }),
      ]);
      setStats(statsRes.data.data);
      const paginationData: Pagination = contractsRes.data.data;
      setContracts(paginationData.items);
      setTotalPages(paginationData.totalPages);
      setTotal(paginationData.total);
    } catch {
      toast.error("Hiba az adatok betöltésekor");
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === contracts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(contracts.map((c) => c.id)));
    }
  };

  const selectedContracts = contracts.filter((c) => selectedIds.has(c.id));

  const handleBulkSend = async () => {
    const draftIds = selectedContracts
      .filter((c) => c.status === "draft")
      .map((c) => c.id);
    if (draftIds.length === 0) {
      toast.error("Nincs piszkozat státuszú szerződés a kiválasztottak között");
      return;
    }
    setBulkLoading("send");
    try {
      const res = await api.post("/contracts/bulk-send", { contractIds: draftIds });
      const { successCount, failureCount } = res.data.data;
      toast.success(`${successCount} szerződés elküldve${failureCount > 0 ? `, ${failureCount} sikertelen` : ""}`);
      setSelectedIds(new Set());
      loadData();
    } catch {
      toast.error("Hiba a tömeges küldés során");
    } finally {
      setBulkLoading(null);
    }
  };

  const handleBulkDownload = async () => {
    setBulkLoading("download");
    let done = 0;
    const total = selectedIds.size;
    for (const id of selectedIds) {
      try {
        const res = await api.get(`/contracts/${id}/download`);
        window.open(res.data.data.url, "_blank");
        done++;
      } catch {
        // skip failed downloads
      }
    }
    toast.success(`${done}/${total} PDF megnyitva`);
    setBulkLoading(null);
  };

  const handleBulkCancel = async () => {
    const cancellable = selectedContracts.filter(
      (c) => !["completed", "cancelled"].includes(c.status)
    );
    if (cancellable.length === 0) {
      toast.error("Nincs visszavonható szerződés a kiválasztottak között");
      return;
    }
    if (!confirm(`Biztosan visszavonsz ${cancellable.length} szerződést?`)) return;
    setBulkLoading("cancel");
    let done = 0;
    for (const c of cancellable) {
      try {
        await api.post(`/contracts/${c.id}/cancel`);
        done++;
      } catch {
        // skip
      }
    }
    toast.success(`${done} szerződés visszavonva`);
    setSelectedIds(new Set());
    loadData();
    setBulkLoading(null);
  };

  const chartMax = useMemo(() => {
    if (!stats?.monthlyStats) return 1;
    return Math.max(...stats.monthlyStats.map((m) => Math.max(m.created, m.signed)), 1);
  }, [stats]);

  const daysUntil = (date: string) => {
    const diff = new Date(date).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  return (
    <div>
      {/* Usage Warning */}
      {stats && stats.usage.limit > 0 && stats.usage.used / stats.usage.limit >= 0.8 && (
        <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-3 ${
          stats.usage.used >= stats.usage.limit
            ? "bg-red-50 text-red-700 border border-red-200"
            : "bg-yellow-50 text-yellow-700 border border-yellow-200"
        }`}>
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          {stats.usage.used >= stats.usage.limit
            ? `Elérted a havi limitedet (${stats.usage.used}/${stats.usage.limit}). Válts magasabb csomagra!`
            : `${stats.usage.limit - stats.usage.used} szerződésed maradt ebben a hónapban (${stats.usage.used}/${stats.usage.limit}).`}
          <Link href="/settings/billing" className="ml-auto underline whitespace-nowrap">Csomag váltás</Link>
        </div>
      )}

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Kezdőlap</h1>
        <div className="flex items-center gap-3">
          {/* Widget toggle */}
          <div className="relative">
            <button
              onClick={() => {
                const el = document.getElementById("widget-config");
                if (el) el.classList.toggle("hidden");
              }}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg font-medium border text-gray-500 hover:bg-gray-50 transition text-sm"
              title="Widgetek testreszabása"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <div id="widget-config" className="hidden absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-lg border dark:border-gray-700 z-50 py-2">
              <div className="px-4 py-1.5 flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-400 uppercase">Widgetek</p>
                <button
                  onClick={() => setShowReorder(true)}
                  className="text-xs text-[#198296] hover:underline font-medium"
                >
                  Sorrend
                </button>
              </div>
              {[
                { key: "expiring", label: "Lejáró szerződések" },
                { key: "awaiting", label: "Aláírásra vár" },
                { key: "completed", label: "Nemrég kész" },
                { key: "activity", label: "Tevekenyseg" },
                { key: "chart", label: "Havi grafikon" },
                { key: "usage", label: "Használat" },
              ].map((w) => (
                <label key={w.key} className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={widgetConfig[w.key] !== false}
                    onChange={() => toggleWidget(w.key)}
                    className="rounded border-gray-300 text-[#198296] focus:ring-[#198296]"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{w.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="relative" ref={exportRef}>
            <button
              onClick={() => setExportOpen((v) => !v)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium border border-[#198296] text-[#198296] hover:bg-[#198296] hover:text-white transition text-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Exportálás
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {exportOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-50 py-1">
                <button
                  onClick={() => handleExport("csv")}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition flex items-center gap-2"
                >
                  <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  CSV letöltés
                </button>
                <button
                  onClick={() => handleExport("json")}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition flex items-center gap-2"
                >
                  <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  JSON letöltés
                </button>
              </div>
            )}
          </div>
          <Link
            href="/create"
            className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition"
          >
            + Új szerződés
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      {loading && !stats ? (
        <div className="mb-8">
          <SkeletonStats />
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard label="Összes" value={stats.total} icon="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          <StatCard label="Piszkozat" value={stats.draft} color="gray" icon="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          <StatCard label="Aláírásra vár" value={stats.awaitingSignature} color="yellow" icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          <StatCard label="Kész" value={stats.completed} color="green" icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </div>
      ) : null}

      {/* Widgets Row */}
      {widgets && (widgets.expiringContracts.length > 0 || widgets.awaitingSignature.length > 0 || widgets.recentlyCompleted.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
          {/* Expiring contracts widget */}
          {widgetConfig.expiring !== false && widgets.expiringContracts.length > 0 && (
            <div className="bg-white rounded-xl border p-5">
              <h3 className="text-sm font-semibold text-red-600 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Hamarosan lejáró szerződések
              </h3>
              <div className="space-y-2">
                {widgets.expiringContracts.map((c) => (
                  <Link
                    key={c.id}
                    href={`/contracts/${c.id}`}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-red-50 transition text-sm"
                  >
                    <span className="font-medium text-gray-900 truncate mr-3">{c.title}</span>
                    <span className="text-red-500 text-xs font-medium whitespace-nowrap">
                      {daysUntil(c.expiresAt)} nap
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Awaiting signature widget */}
          {widgetConfig.awaiting !== false && widgets.awaitingSignature.length > 0 && (
            <div className="bg-white rounded-xl border p-5">
              <h3 className="text-sm font-semibold text-yellow-600 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Aláírásra vár
              </h3>
              <div className="space-y-2">
                {widgets.awaitingSignature.map((c) => (
                  <Link
                    key={c.id}
                    href={`/contracts/${c.id}`}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-yellow-50 transition text-sm"
                  >
                    <div className="min-w-0">
                      <span className="font-medium text-gray-900 truncate block">{c.title}</span>
                      <span className="text-xs text-gray-400">{c.pendingSigners.join(", ")}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Recently completed widget */}
          {widgetConfig.completed !== false && widgets.recentlyCompleted.length > 0 && (
            <div className="bg-white rounded-xl border p-5">
              <h3 className="text-sm font-semibold text-green-600 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Nemrég elkészült
              </h3>
              <div className="space-y-2">
                {widgets.recentlyCompleted.map((c) => (
                  <Link
                    key={c.id}
                    href={`/contracts/${c.id}`}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-green-50 transition text-sm"
                  >
                    <span className="font-medium text-gray-900 truncate mr-3">{c.title}</span>
                    <span className="text-green-500 text-xs whitespace-nowrap">
                      {new Date(c.updatedAt).toLocaleDateString("hu-HU")}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Activity Feed */}
      {widgetConfig.activity !== false && (
        <div className="mb-8 bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Legutobb tevekenyse</h3>
          <ActivityFeed limit={8} />
        </div>
      )}

      {/* Analytics Row */}
      {stats && stats.monthlyStats && (widgetConfig.chart !== false || widgetConfig.usage !== false) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          {/* Mini Chart */}
          {widgetConfig.chart !== false && (
          <div className={`${widgetConfig.usage !== false ? "lg:col-span-2" : "lg:col-span-3"} bg-white rounded-xl border p-6`}>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Utolsó 6 hónap</h3>
            <div className="flex items-end gap-3 h-40">
              {stats.monthlyStats.map((m, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex gap-1 items-end justify-center h-32">
                    <div
                      className="w-5 bg-blue-500 rounded-t transition-all"
                      style={{ height: `${Math.max((m.created / chartMax) * 100, 4)}%` }}
                      title={`Létrehozott: ${m.created}`}
                    />
                    <div
                      className="w-5 bg-green-500 rounded-t transition-all"
                      style={{ height: `${Math.max((m.signed / chartMax) * 100, 4)}%` }}
                      title={`Aláírt: ${m.signed}`}
                    />
                  </div>
                  <span className="text-xs text-gray-400 truncate w-full text-center">{m.month}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-6 mt-4 text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-blue-500 rounded-sm inline-block" /> Létrehozott
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-green-500 rounded-sm inline-block" /> Aláírt
              </span>
            </div>
          </div>
          )}

          {/* Usage Card */}
          {widgetConfig.usage !== false && (
          <div className={`bg-white rounded-xl border p-6 ${widgetConfig.chart === false ? "lg:col-span-3" : ""}`}>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Havi használat</h3>
            <div className="text-center mb-4">
              <p className="text-4xl font-bold text-gray-900">{stats.usage.used}</p>
              <p className="text-sm text-gray-400 mt-1">
                {stats.usage.limit > 0 ? `/ ${stats.usage.limit} szerződés` : "korlátlan"}
              </p>
            </div>
            {stats.usage.limit > 0 && (
              <div className="space-y-2">
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      stats.usage.used / stats.usage.limit > 0.8 ? "bg-red-500" : "bg-blue-500"
                    }`}
                    style={{ width: `${Math.min((stats.usage.used / stats.usage.limit) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 text-center">
                  {stats.usage.limit - stats.usage.used} szerződés maradt
                </p>
              </div>
            )}
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Csomag</span>
                <span className="font-medium text-gray-900 capitalize">{stats.usage.tier}</span>
              </div>
              {stats.usage.tier !== "pro" && (
                <Link
                  href="/settings/billing"
                  className="block mt-3 text-center text-sm bg-blue-50 text-blue-600 py-2 rounded-lg hover:bg-blue-100 transition font-medium"
                >
                  Csomag váltás
                </Link>
              )}
            </div>
          </div>
          )}
        </div>
      )}

      {/* Contract List with Folder Sidebar */}
      <div className="flex gap-4">
      {/* Folder Sidebar */}
      {folders.length > 0 && (
        <div className={`${showFolders ? "w-56" : "w-0"} shrink-0 transition-all overflow-hidden`}>
          <div className="bg-white rounded-xl border p-3 space-y-1 min-w-[14rem]">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-400 uppercase">Mappák</p>
            </div>
            <button
              onClick={() => { setSelectedFolder(""); }}
              onDrop={(e) => handleDropOnFolder(e, null)}
              onDragOver={(e) => { e.preventDefault(); setDragOverFolder("none"); }}
              onDragLeave={() => setDragOverFolder(null)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                !selectedFolder
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-gray-600 hover:bg-gray-50"
              } ${dragOverFolder === "none" ? "ring-2 ring-blue-400" : ""}`}
            >
              Összes
            </button>
            <button
              onClick={() => setSelectedFolder("none")}
              onDrop={(e) => handleDropOnFolder(e, null)}
              onDragOver={(e) => { e.preventDefault(); setDragOverFolder("unassigned"); }}
              onDragLeave={() => setDragOverFolder(null)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                selectedFolder === "none"
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-gray-600 hover:bg-gray-50"
              } ${dragOverFolder === "unassigned" ? "ring-2 ring-blue-400" : ""}`}
            >
              Mappa nélkül
            </button>
            {folders.map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedFolder(f.id)}
                onDrop={(e) => handleDropOnFolder(e, f.id)}
                onDragOver={(e) => { e.preventDefault(); setDragOverFolder(f.id); }}
                onDragLeave={() => setDragOverFolder(null)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition flex items-center gap-2 ${
                  selectedFolder === f.id
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "text-gray-600 hover:bg-gray-50"
                } ${dragOverFolder === f.id ? "ring-2 ring-blue-400 bg-blue-50" : ""}`}
              >
                <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: f.color }} />
                <span className="truncate">{f.name}</span>
              </button>
            ))}
            <div className="pt-2 border-t mt-2">
              <div className="flex gap-1">
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && createFolder()}
                  placeholder="Új mappa..."
                  className="flex-1 px-2 py-1.5 border rounded text-xs outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  onClick={createFolder}
                  disabled={!newFolderName.trim()}
                  className="px-2 py-1.5 bg-blue-600 text-white rounded text-xs disabled:opacity-40"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="flex-1 bg-white rounded-xl shadow-sm border">
        <div className="p-4 border-b flex flex-col sm:flex-row gap-3">
          <div className="flex gap-2 flex-wrap flex-1">
            {["", "draft", "sent", "partially_signed", "completed", "declined", "expired"].map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  filter === s
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                {s === "" ? "Összes" : statusLabels[s]}
              </button>
            ))}
          </div>
          <div className="flex gap-2 items-center flex-wrap">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-2 py-1.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
              title="Dátumtól"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-2 py-1.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
              title="Dátumig"
            />
            {(dateFrom || dateTo) && (
              <button onClick={() => { setDateFrom(""); setDateTo(""); }}
                className="text-xs text-gray-400 hover:text-gray-600 px-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            {tags.length > 0 && (
              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="px-3 py-1.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Összes címke</option>
                {tags.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            )}
            {folders.length > 0 && (
              <button
                onClick={() => setShowFolders((v) => !v)}
                className={`px-3 py-1.5 border rounded-lg text-sm transition ${showFolders ? "bg-blue-100 text-blue-700 border-blue-300" : "text-gray-500 hover:bg-gray-50"}`}
                title="Mappák megjelenítése"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </button>
            )}
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Keresés cím, tartalom, aláíró..."
              className="px-3 py-1.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 w-60"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput("")}
                className="px-2 py-1.5 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {loading && contracts.length === 0 ? (
          <div className="divide-y">
            {[0, 1, 2, 3, 4].map((i) => (
              <SkeletonRow key={i} />
            ))}
          </div>
        ) : contracts.length === 0 ? (
          <EmptyState
            icon="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            title={searchInput ? "Nincs találat" : "Még nincs szerződésed"}
            description={
              searchInput
                ? `Nincs "${searchInput}" keresésre illeszkedő szerződés.`
                : "Hozd létre az első szerződésedet egy sablonból vagy nulláról."
            }
            actionLabel={searchInput ? undefined : "Első szerződés létrehozása"}
            actionHref={searchInput ? undefined : "/create"}
          />
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 border-b">
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={contracts.length > 0 && selectedIds.size === contracts.length}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300 text-[#198296] focus:ring-[#198296]"
                    />
                  </th>
                  <th className="px-4 py-3 font-medium">Szerződés</th>
                  <th className="px-4 py-3 font-medium">Státusz</th>
                  <th className="px-4 py-3 font-medium hidden sm:table-cell">Felek</th>
                  <th className="px-4 py-3 font-medium hidden md:table-cell">Dátum</th>
                </tr>
              </thead>
              <tbody>
                {contracts.map((c) => (
                  <tr key={c.id} draggable onDragStart={(e) => handleDragStart(e, c.id)} className={`border-b last:border-0 hover:bg-gray-50 transition cursor-grab active:cursor-grabbing ${selectedIds.has(c.id) ? "bg-blue-50" : ""}`}>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(c.id)}
                        onChange={() => toggleSelect(c.id)}
                        className="rounded border-gray-300 text-[#198296] focus:ring-[#198296]"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/contracts/${c.id}`}
                        className="font-medium text-gray-900 hover:text-blue-600 transition"
                      >
                        {c.title}
                      </Link>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {c.template && (
                          <span className="text-xs text-gray-400">
                            {c.template.name}
                          </span>
                        )}
                        {c.tags && c.tags.length > 0 && (
                          <div className="flex gap-1 ml-1">
                            {c.tags.map((ct) => (
                              <span
                                key={ct.tag.id}
                                className="inline-block px-1.5 py-0 rounded text-[10px] font-medium text-white"
                                style={{ backgroundColor: ct.tag.color }}
                              >
                                {ct.tag.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          statusColors[c.status] ?? "bg-gray-100"
                        }`}
                      >
                        {statusLabels[c.status] ?? c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-sm text-gray-600">
                      {c.signers.map((s) => s.name).join(", ")}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-sm text-gray-400">
                      {new Date(c.updatedAt).toLocaleDateString("hu-HU")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <p className="text-sm text-gray-500">
                  Összesen {total} szerződés
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="px-3 py-1.5 rounded-lg text-sm border disabled:opacity-40 hover:bg-gray-50 transition"
                  >
                    Előző
                  </button>
                  <span className="text-sm text-gray-600">
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="px-3 py-1.5 rounded-lg text-sm border disabled:opacity-40 hover:bg-gray-50 transition"
                  >
                    Következő
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      </div>

      {/* Floating Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-4">
          <span className="text-sm font-medium whitespace-nowrap">
            {selectedIds.size} kiválasztva
          </span>
          <div className="h-5 w-px bg-gray-600" />
          <button
            onClick={handleBulkSend}
            disabled={bulkLoading !== null}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition disabled:opacity-50"
            style={{ backgroundColor: "#198296" }}
          >
            {bulkLoading === "send" ? (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            )}
            Elküldés
          </button>
          <button
            onClick={handleBulkDownload}
            disabled={bulkLoading !== null}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition disabled:opacity-50"
            style={{ backgroundColor: "#D29B01" }}
          >
            {bulkLoading === "download" ? (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            )}
            Letöltés
          </button>
          <button
            onClick={handleBulkCancel}
            disabled={bulkLoading !== null}
            className="flex items-center gap-2 px-4 py-1.5 bg-red-600 rounded-lg text-sm font-medium transition disabled:opacity-50 hover:bg-red-700"
          >
            {bulkLoading === "cancel" ? (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            )}
            Törlés
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="ml-1 p-1.5 rounded-lg hover:bg-gray-700 transition"
            title="Kijelölés törlése"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <WidgetReorder
        open={showReorder}
        onClose={() => setShowReorder(false)}
        order={widgetOrder}
        onSave={(newOrder) => {
          setWidgetOrder(newOrder);
          localStorage.setItem("dashboard_widget_order", JSON.stringify(newOrder));
          setShowReorder(false);
        }}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  color = "blue",
  icon,
}: {
  label: string;
  value: number;
  color?: string;
  icon: string;
}) {
  const colors: Record<string, string> = {
    blue: "bg-blue-50 text-blue-700",
    gray: "bg-gray-50 text-gray-700",
    yellow: "bg-yellow-50 text-yellow-700",
    green: "bg-green-50 text-green-700",
  };
  return (
    <div className={`rounded-xl p-5 ${colors[color]} transition hover:shadow-sm`}>
      <div className="flex items-center justify-between">
        <p className="text-sm opacity-70">{label}</p>
        <svg className="w-5 h-5 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={icon} />
        </svg>
      </div>
      <p className="text-3xl font-bold mt-1">{value}</p>
    </div>
  );
}
