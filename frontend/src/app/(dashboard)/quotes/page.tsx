"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import toast from "react-hot-toast";
import FeatureGate from "@/components/feature-gate";
import { useI18n } from "@/lib/i18n";

interface QuoteItem {
  description: string;
  quantity: number;
  unitPrice: number;
  unit: string;
  taxRate: number;
  isOptional: boolean;
  discount?: number;
  discountType?: string;
}

interface Quote {
  id: string;
  title: string;
  clientName: string;
  clientEmail: string;
  clientCompany?: string;
  status: string;
  quoteNumber?: string;
  currency: string;
  validUntil: string;
  discount?: number;
  discountType?: string;
  items: QuoteItem[];
  createdAt: string;
  updatedAt: string;
}

interface QuoteStats {
  total: number;
  draft: number;
  sent: number;
  accepted: number;
  declined: number;
  totalRevenue: number;
}


const STATUS_KEYS = ["draft", "sent", "accepted", "declined", "expired"];

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
  sent: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
  accepted: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  declined: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  expired: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
};

function formatCurrency(value: number, currency: string) {
  const formatted = new Intl.NumberFormat("hu-HU").format(value);
  const symbols: Record<string, string> = { HUF: " Ft", EUR: " EUR", USD: " USD" };
  return formatted + (symbols[currency] ?? ` ${currency}`);
}

function calcTotals(items: QuoteItem[], currency: string, globalDiscount?: number, globalDiscountType?: string) {
  let netto = 0;
  let vat = 0;
  for (const item of items) {
    if (item.isOptional) continue;
    let lineNetto = item.quantity * item.unitPrice;
    if (item.discount && item.discountType) {
      if (item.discountType === "percent") lineNetto *= (1 - item.discount / 100);
      else lineNetto -= item.discount;
    }
    lineNetto = Math.max(0, lineNetto);
    netto += lineNetto;
    vat += lineNetto * (item.taxRate / 100);
  }
  if (globalDiscount && globalDiscountType) {
    const discAmount = globalDiscountType === "percent" ? netto * (globalDiscount / 100) : globalDiscount;
    const ratio = netto > 0 ? (netto - discAmount) / netto : 0;
    netto = Math.max(0, netto - discAmount);
    vat = Math.max(0, vat * ratio);
  }
  return {
    netto,
    vat,
    brutto: netto + vat,
    nettoStr: formatCurrency(netto, currency),
    vatStr: formatCurrency(vat, currency),
    bruttoStr: formatCurrency(netto + vat, currency),
  };
}

export default function QuotesPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [stats, setStats] = useState<QuoteStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  useEffect(() => {
    loadStats();
  }, []);

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    loadQuotes();
  }, [search, statusFilter, page]);
  /* eslint-enable react-hooks/exhaustive-deps */

  const loadStats = async () => {
    try {
      const res = await api.get("/quotes/stats");
      setStats(res.data.data);
    } catch {
      // stats are optional
    }
  };

  const loadQuotes = async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await api.get("/quotes", { params });
      const data = res.data.data;
      setQuotes(data?.quotes ?? []);
      setTotalPages(data?.totalPages ?? 1);
      setTotal(data?.total ?? 0);
    } catch {
      toast.error(t("quotes.loadError"));
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const res = await api.post(`/quotes/${id}/duplicate`);
      toast.success(t("quotes.duplicateSuccess"));
      const newId = res.data.data?.id;
      if (newId) {
        router.push(`/quotes/${newId}`);
      } else {
        loadQuotes();
        loadStats();
      }
    } catch (err: unknown) {
      const axiosMsg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      toast.error(axiosMsg ?? t("quotes.duplicateError"));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("quotes.deleteConfirm"))) return;
    try {
      await api.delete(`/quotes/${id}`);
      toast.success(t("quotes.deleteSuccess"));
      loadQuotes();
      loadStats();
    } catch {
      toast.error(t("quotes.deleteError"));
    }
  };

  const statCards = stats
    ? [
        { label: t("quotes.stats.total"), value: stats.total, color: "bg-white dark:bg-gray-800" },
        { label: t("quotes.stats.draft"), value: stats.draft, color: "bg-gray-50 dark:bg-gray-800" },
        { label: t("quotes.stats.sent"), value: stats.sent, color: "bg-teal-50 dark:bg-teal-900/20" },
        { label: t("quotes.stats.accepted"), value: stats.accepted, color: "bg-green-50 dark:bg-green-900/20" },
        { label: t("quotes.stats.declined"), value: stats.declined, color: "bg-red-50 dark:bg-red-900/20" },
        { label: t("quotes.stats.totalRevenue"), value: formatCurrency(stats.totalRevenue, "HUF"), color: "bg-white dark:bg-gray-800", isRevenue: true },
      ]
    : null;

  return (
    <FeatureGate featureKey="quote_management" featureName="Árajánlat kezelés">
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("quotes.title")}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t("quotes.subtitle")}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/quotes/templates"
            className="px-4 py-2.5 rounded-lg font-medium transition text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            {t("quotes.templates")}
          </Link>
          <Link
            href="/quotes/new"
            className="text-white px-5 py-2.5 rounded-lg font-medium transition text-sm"
            style={{ backgroundColor: "#198296" }}
            onMouseEnter={(e) => ((e.target as HTMLElement).style.backgroundColor = "#0e5f6e")}
            onMouseLeave={(e) => ((e.target as HTMLElement).style.backgroundColor = "#198296")}
          >
            + {t("quotes.new")}
          </Link>
        </div>
      </div>

      {/* Stats */}
      {stats ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          {statCards!.map((card) => (
            <div
              key={card.label}
              className={`${card.color} rounded-xl border border-gray-200 dark:border-gray-700 p-4`}
            >
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">{card.label}</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {typeof card.value === "number" ? card.value : card.value}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="rounded-xl p-4 bg-gray-100 dark:bg-gray-800 animate-pulse">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-3" />
              <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
            </div>
          ))}
        </div>
      )}

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder={t("quotes.searchPlaceholder")}
          className="flex-1 max-w-md px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#198296]"
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#198296]"
        >
          <option value="">{t("quotes.allStatuses")}</option>
          {STATUS_KEYS.map((key) => (
            <option key={key} value={key}>{t(`quotes.status.${key}`)}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-4 animate-pulse">
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/5" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                </div>
                <div className="h-5 w-20 bg-gray-200 dark:bg-gray-700 rounded-full" />
                <div className="hidden sm:block h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="hidden md:block h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            ))}
          </div>
        ) : quotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-gray-300 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{t("quotes.empty")}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 text-center max-w-sm">
              {search || statusFilter ? t("quotes.emptyFiltered") : t("quotes.emptyDesc")}
            </p>
            {!search && !statusFilter && (
              <Link
                href="/quotes/new"
                className="text-white px-6 py-2.5 rounded-lg font-medium transition text-sm"
                style={{ backgroundColor: "#198296" }}
              >
                + {t("quotes.new")}
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                    <th className="px-4 py-3 font-medium">{t("quotes.table.title")}</th>
                    <th className="px-4 py-3 font-medium">{t("quotes.table.client")}</th>
                    <th className="px-4 py-3 font-medium hidden md:table-cell">{t("quotes.table.amount")}</th>
                    <th className="px-4 py-3 font-medium">{t("quotes.table.status")}</th>
                    <th className="px-4 py-3 font-medium hidden lg:table-cell">{t("quotes.table.validUntil")}</th>
                    <th className="px-4 py-3 font-medium w-32 sm:w-40 md:w-48">{t("quotes.table.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {quotes.map((q) => {
                    const totals = calcTotals(q.items ?? [], q.currency, q.discount, q.discountType);
                    return (
                      <tr
                        key={q.id}
                        className="border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
                      >
                        <td className="px-4 py-3">
                          <Link
                            href={`/quotes/${q.id}`}
                            className="text-sm font-medium text-gray-900 dark:text-white hover:text-[#198296] dark:hover:text-[#2ab4cc] transition"
                          >
                            {q.title}
                          </Link>
                          {q.quoteNumber && (
                            <p className="text-xs text-gray-400">{q.quoteNumber}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-gray-900 dark:text-gray-200">{q.clientName}</p>
                          {q.clientCompany && (
                            <p className="text-xs text-gray-400">{q.clientCompany}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {totals.bruttoStr}
                          </p>
                          <p className="text-xs text-gray-400">
                            {t("quotes.table.netto")}: {totals.nettoStr}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[q.status] ?? "bg-gray-100 text-gray-700"}`}
                          >
                            {t(`quotes.status.${q.status}`) !== `quotes.status.${q.status}` ? t(`quotes.status.${q.status}`) : q.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {q.validUntil
                              ? new Date(q.validUntil).toLocaleDateString("hu-HU")
                              : "-"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            <Link
                              href={`/quotes/${q.id}`}
                              className="text-xs px-3 py-1 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition"
                            >
                              {t("quotes.actions.edit")}
                            </Link>
                            <button
                              onClick={() => handleDuplicate(q.id)}
                              className="text-xs px-3 py-1 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600 transition"
                            >
                              {t("quotes.actions.duplicate")}
                            </button>
                            <button
                              onClick={() => handleDelete(q.id)}
                              className="text-xs px-3 py-1 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition"
                            >
                              {t("quotes.actions.delete")}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t("quotes.total", { count: total })}
                </p>
                <div className="flex gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="px-3 py-1 rounded-lg text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 transition"
                  >
                    {t("common.previous")}
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`px-3 py-1 rounded-lg text-sm transition ${
                        p === page
                          ? "text-white"
                          : "border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                      style={p === page ? { backgroundColor: "#198296" } : {}}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="px-3 py-1 rounded-lg text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 transition"
                  >
                    {t("common.next")}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
    </FeatureGate>
  );
}
