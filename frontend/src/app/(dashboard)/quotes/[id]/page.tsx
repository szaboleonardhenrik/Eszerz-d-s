"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import toast from "react-hot-toast";

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  unit: string;
  vatPercent: number;
}

interface Quote {
  id: string;
  title: string;
  clientName: string;
  clientEmail: string;
  clientCompany?: string;
  status: string;
  currency: string;
  validUntil: string | null;
  notes?: string;
  lineItems: LineItem[];
  createdAt: string;
  updatedAt: string;
}

const statusLabels: Record<string, string> = {
  draft: "Piszkozat",
  sent: "Elkuldve",
  accepted: "Elfogadva",
  declined: "Visszautasitva",
  expired: "Lejart",
};

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
  sent: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
  accepted: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  declined: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  expired: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
};

const unitLabels: Record<string, string> = {
  db: "db",
  ora: "ora",
  honap: "honap",
  nap: "nap",
};

function formatCurrency(value: number, currency: string) {
  const formatted = new Intl.NumberFormat("hu-HU").format(Math.round(value));
  const symbols: Record<string, string> = { HUF: " Ft", EUR: " EUR", USD: " USD" };
  return formatted + (symbols[currency] ?? ` ${currency}`);
}

export default function QuoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadQuote();
  }, [id]);

  const loadQuote = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/quotes/${id}`);
      setQuote(res.data.data);
    } catch {
      toast.error("Hiba az ajanlat betoltesekor");
      router.push("/quotes");
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    setActionLoading("send");
    try {
      await api.post(`/quotes/${id}/send`);
      toast.success("Ajanlat elkuldve!");
      loadQuote();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message ?? "Hiba az ajanlat kuldesekor");
    } finally {
      setActionLoading(null);
    }
  };

  const handleAccept = async () => {
    setActionLoading("accept");
    try {
      await api.post(`/quotes/${id}/accept`);
      toast.success("Ajanlat elfogadva!");
      loadQuote();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message ?? "Hiba az elfogadaskor");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecline = async () => {
    if (!confirm("Biztosan visszautasitja az ajanlatot?")) return;
    setActionLoading("decline");
    try {
      await api.post(`/quotes/${id}/decline`);
      toast.success("Ajanlat visszautasitva");
      loadQuote();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message ?? "Hiba a visszautasitaskor");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDuplicate = async () => {
    setActionLoading("duplicate");
    try {
      const res = await api.post(`/quotes/${id}/duplicate`);
      toast.success("Ajanlat duplikalva!");
      const newId = res.data.data?.id;
      if (newId) {
        router.push(`/quotes/${newId}`);
      } else {
        router.push("/quotes");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message ?? "Hiba a duplikalaskor");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Biztosan torli az ajanlatot?")) return;
    setActionLoading("delete");
    try {
      await api.delete(`/quotes/${id}`);
      toast.success("Ajanlat torolve!");
      router.push("/quotes");
    } catch {
      toast.error("Hiba a torleskor");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div>
        <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4" />
        <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
        <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-8" />
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="space-y-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4 animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded flex-1" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!quote) return null;

  const items = quote.lineItems ?? [];
  const totalNetto = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
  const totalVat = items.reduce(
    (sum, i) => sum + i.quantity * i.unitPrice * (i.vatPercent / 100),
    0
  );
  const totalBrutto = totalNetto + totalVat;

  const brandBtn =
    "text-white px-5 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50";

  return (
    <div>
      <Link
        href="/quotes"
        className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-4 inline-block"
      >
        &larr; Vissza az ajanlatokhoz
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{quote.title}</h1>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span
              className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[quote.status] ?? "bg-gray-100 text-gray-700"}`}
            >
              {statusLabels[quote.status] ?? quote.status}
            </span>
            <span className="text-sm text-gray-400 dark:text-gray-500">
              Letrehozva: {new Date(quote.createdAt).toLocaleDateString("hu-HU")}
            </span>
            {quote.updatedAt !== quote.createdAt && (
              <span className="text-sm text-gray-400 dark:text-gray-500">
                Modositva: {new Date(quote.updatedAt).toLocaleDateString("hu-HU")}
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Link
            href={`/quotes/new?edit=${quote.id}`}
            className="border border-gray-300 dark:border-gray-600 px-5 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            Szerkesztes
          </Link>

          {quote.status === "draft" && (
            <button
              onClick={handleSend}
              disabled={actionLoading === "send"}
              className={brandBtn}
              style={{ backgroundColor: "#198296" }}
              onMouseEnter={(e) => {
                if (actionLoading !== "send")
                  (e.target as HTMLElement).style.backgroundColor = "#0e5f6e";
              }}
              onMouseLeave={(e) => {
                if (actionLoading !== "send")
                  (e.target as HTMLElement).style.backgroundColor = "#198296";
              }}
            >
              {actionLoading === "send" ? "Kuldes..." : "Kuldes"}
            </button>
          )}

          {quote.status === "sent" && (
            <>
              <button
                onClick={handleAccept}
                disabled={actionLoading === "accept"}
                className={brandBtn + " bg-green-600 hover:bg-green-700"}
              >
                {actionLoading === "accept" ? "Elfogadas..." : "Elfogadas"}
              </button>
              <button
                onClick={handleDecline}
                disabled={actionLoading === "decline"}
                className="border border-red-200 dark:border-red-800 px-5 py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition disabled:opacity-50"
              >
                {actionLoading === "decline" ? "Visszautasitas..." : "Visszautasitas"}
              </button>
            </>
          )}

          <button
            onClick={handleDuplicate}
            disabled={actionLoading === "duplicate"}
            className="border border-gray-300 dark:border-gray-600 px-5 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50"
          >
            {actionLoading === "duplicate" ? "Duplikalas..." : "Duplikalas"}
          </button>

          <button
            onClick={handleDelete}
            disabled={actionLoading === "delete"}
            className="border border-red-200 dark:border-red-800 px-5 py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition disabled:opacity-50"
          >
            {actionLoading === "delete" ? "Torles..." : "Torles"}
          </button>
        </div>
      </div>

      {/* Client info */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Ugyfel adatok</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Nev</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{quote.clientName}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Email</p>
            <p className="text-sm text-gray-900 dark:text-white">{quote.clientEmail}</p>
          </div>
          {quote.clientCompany && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Ceg</p>
              <p className="text-sm text-gray-900 dark:text-white">{quote.clientCompany}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Ervenyesseg</p>
            <p className="text-sm text-gray-900 dark:text-white">
              {quote.validUntil
                ? new Date(quote.validUntil).toLocaleDateString("hu-HU")
                : "Nincs megadva"}
            </p>
          </div>
        </div>
        {quote.notes && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Megjegyzes</p>
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {quote.notes}
            </p>
          </div>
        )}
      </div>

      {/* Line items */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tetelek</h2>

        {items.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500">Nincsenek tetelek</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                    <th className="pb-2 pr-2 font-medium">Leiras</th>
                    <th className="pb-2 px-2 font-medium text-right">Mennyiseg</th>
                    <th className="pb-2 px-2 font-medium">Egyseg</th>
                    <th className="pb-2 px-2 font-medium text-right">Egysegar</th>
                    <th className="pb-2 px-2 font-medium text-right">AFA %</th>
                    <th className="pb-2 px-2 font-medium text-right">Netto</th>
                    <th className="pb-2 px-2 font-medium text-right hidden sm:table-cell">AFA</th>
                    <th className="pb-2 pl-2 font-medium text-right">Brutto</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => {
                    const lineNetto = item.quantity * item.unitPrice;
                    const lineVat = lineNetto * (item.vatPercent / 100);
                    const lineBrutto = lineNetto + lineVat;
                    return (
                      <tr
                        key={idx}
                        className="border-b border-gray-100 dark:border-gray-700 last:border-0"
                      >
                        <td className="py-3 pr-2 text-sm text-gray-900 dark:text-white">
                          {item.description}
                        </td>
                        <td className="py-3 px-2 text-sm text-gray-700 dark:text-gray-300 text-right">
                          {item.quantity}
                        </td>
                        <td className="py-3 px-2 text-sm text-gray-500 dark:text-gray-400">
                          {unitLabels[item.unit] ?? item.unit}
                        </td>
                        <td className="py-3 px-2 text-sm text-gray-700 dark:text-gray-300 text-right">
                          {formatCurrency(item.unitPrice, quote.currency)}
                        </td>
                        <td className="py-3 px-2 text-sm text-gray-500 dark:text-gray-400 text-right">
                          {item.vatPercent}%
                        </td>
                        <td className="py-3 px-2 text-sm text-gray-700 dark:text-gray-300 text-right">
                          {formatCurrency(lineNetto, quote.currency)}
                        </td>
                        <td className="py-3 px-2 text-sm text-gray-500 dark:text-gray-400 text-right hidden sm:table-cell">
                          {formatCurrency(lineVat, quote.currency)}
                        </td>
                        <td className="py-3 pl-2 text-sm font-medium text-gray-900 dark:text-white text-right">
                          {formatCurrency(lineBrutto, quote.currency)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="flex flex-col items-end gap-1">
                <div className="flex justify-between w-full max-w-xs text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Netto osszeg:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatCurrency(totalNetto, quote.currency)}
                  </span>
                </div>
                <div className="flex justify-between w-full max-w-xs text-sm">
                  <span className="text-gray-500 dark:text-gray-400">AFA:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatCurrency(totalVat, quote.currency)}
                  </span>
                </div>
                <div className="flex justify-between w-full max-w-xs text-base border-t border-gray-200 dark:border-gray-700 pt-2 mt-1">
                  <span className="font-semibold text-gray-900 dark:text-white">Brutto osszeg:</span>
                  <span className="font-bold" style={{ color: "#198296" }}>
                    {formatCurrency(totalBrutto, quote.currency)}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
