"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import toast from "react-hot-toast";

interface QuoteItem {
  description: string;
  quantity: number;
  unitPrice: number;
  unit: string;
  taxRate: number;
  sectionName?: string;
  isOptional: boolean;
  discount?: number;
  discountType?: string;
  sortOrder: number;
}

interface QuoteOwner {
  name: string;
  companyName?: string;
  email: string;
  brandColor?: string;
  brandLogoUrl?: string;
  phone?: string;
  taxNumber?: string;
}

interface Quote {
  id: string;
  title: string;
  clientName: string;
  clientEmail: string;
  clientCompany?: string;
  clientPhone?: string;
  clientAddress?: string;
  clientTaxNumber?: string;
  status: string;
  quoteNumber?: string;
  currency: string;
  validUntil: string | null;
  introText?: string;
  outroText?: string;
  notes?: string;
  discount?: number;
  discountType?: string;
  items: QuoteItem[];
  owner?: QuoteOwner;
  createdAt: string;
  updatedAt: string;
}

const statusLabels: Record<string, string> = {
  draft: "Piszkozat",
  sent: "Elküldve",
  accepted: "Elfogadva",
  declined: "Visszautasítva",
  expired: "Lejárt",
};

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
  sent: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
  accepted: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  declined: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  expired: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
};

function formatCurrency(value: number, currency: string) {
  const formatted = new Intl.NumberFormat("hu-HU").format(Math.round(value));
  const symbols: Record<string, string> = { HUF: " Ft", EUR: " EUR", USD: " USD" };
  return formatted + (symbols[currency] ?? ` ${currency}`);
}

function calcItemNetto(item: QuoteItem) {
  let netto = item.quantity * item.unitPrice;
  if (item.discount && item.discountType) {
    if (item.discountType === "percent") netto *= (1 - item.discount / 100);
    else netto -= item.discount;
  }
  return Math.max(0, netto);
}

export default function QuoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => { loadQuote(); }, [id]);

  const loadQuote = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/quotes/${id}`);
      setQuote(res.data.data);
    } catch {
      toast.error("Hiba az ajánlat betöltésekor");
      router.push("/quotes");
    } finally {
      setLoading(false);
    }
  };

  const doAction = async (action: string, successMsg: string, method: "post" | "delete" = "post") => {
    setActionLoading(action);
    try {
      if (method === "delete") {
        await api.delete(`/quotes/${id}`);
      } else {
        await api.post(`/quotes/${id}/${action}`);
      }
      toast.success(successMsg);
      if (action === "delete" || method === "delete") router.push("/quotes");
      else loadQuote();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message ?? "Hiba történt");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDuplicate = async () => {
    setActionLoading("duplicate");
    try {
      const res = await api.post(`/quotes/${id}/duplicate`);
      toast.success("Ajánlat duplikálva!");
      router.push(`/quotes/${res.data.data?.id ?? ""}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message ?? "Hiba a duplikáláskor");
    } finally {
      setActionLoading(null);
    }
  };

  const handlePdfDownload = async () => {
    setPdfLoading(true);
    try {
      const res = await api.get(`/quotes/${id}/pdf`, { responseType: "blob" });
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${quote?.quoteNumber || "ajanlat"}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Hiba a PDF generálásakor");
    } finally {
      setPdfLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
        <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
        <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-8" />
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="space-y-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded flex-1" /><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" /></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!quote) return null;

  const items = quote.items ?? [];
  const activeItems = items.filter((i) => !i.isOptional);
  const optionalItems = items.filter((i) => i.isOptional);

  let totalNetto = activeItems.reduce((sum, i) => sum + calcItemNetto(i), 0);
  let totalVat = activeItems.reduce((sum, i) => sum + calcItemNetto(i) * (i.taxRate / 100), 0);

  if (quote.discount && quote.discountType) {
    const discAmount = quote.discountType === "percent" ? totalNetto * (quote.discount / 100) : quote.discount;
    const ratio = totalNetto > 0 ? (totalNetto - discAmount) / totalNetto : 0;
    totalNetto = Math.max(0, totalNetto - discAmount);
    totalVat = Math.max(0, totalVat * ratio);
  }
  const totalBrutto = totalNetto + totalVat;

  // Group items by section
  const sections = new Map<string, QuoteItem[]>();
  for (const item of items) {
    const sec = item.sectionName || "";
    if (!sections.has(sec)) sections.set(sec, []);
    sections.get(sec)!.push(item);
  }

  const brandColor = quote.owner?.brandColor || "#198296";
  const brandBtn = "text-white px-5 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50";

  return (
    <div>
      <Link href="/quotes" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-4 inline-block">
        &larr; Vissza az ajánlatokhoz
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{quote.title}</h1>
          {quote.quoteNumber && <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">{quote.quoteNumber}</p>}
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[quote.status] ?? "bg-gray-100 text-gray-700"}`}>
              {statusLabels[quote.status] ?? quote.status}
            </span>
            <span className="text-sm text-gray-400 dark:text-gray-500">
              Létrehozva: {new Date(quote.createdAt).toLocaleDateString("hu-HU")}
            </span>
            {quote.updatedAt !== quote.createdAt && (
              <span className="text-sm text-gray-400 dark:text-gray-500">
                Módosítva: {new Date(quote.updatedAt).toLocaleDateString("hu-HU")}
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          {quote.status === "draft" && (
            <Link
              href={`/quotes/new?edit=${quote.id}`}
              className="border border-gray-300 dark:border-gray-600 px-5 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              Szerkesztés
            </Link>
          )}

          {quote.status === "draft" && (
            <button onClick={() => doAction("send", "Ajánlat elküldve!")} disabled={actionLoading === "send"} className={brandBtn} style={{ backgroundColor: brandColor }}>
              {actionLoading === "send" ? "Küldés..." : "Küldés"}
            </button>
          )}

          {quote.status === "sent" && (
            <>
              <button onClick={() => doAction("accept", "Ajánlat elfogadva!")} disabled={actionLoading === "accept"} className={brandBtn + " bg-green-600 hover:bg-green-700"}>
                {actionLoading === "accept" ? "Elfogadás..." : "Elfogadás"}
              </button>
              <button onClick={() => { if (confirm("Biztosan visszautasítja?")) doAction("decline", "Ajánlat visszautasítva"); }} disabled={actionLoading === "decline"} className="border border-red-200 dark:border-red-800 px-5 py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition disabled:opacity-50">
                {actionLoading === "decline" ? "Visszautasítás..." : "Visszautasítás"}
              </button>
            </>
          )}

          <button onClick={handlePdfDownload} disabled={pdfLoading} className="border border-gray-300 dark:border-gray-600 px-5 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50 flex items-center gap-2">
            {pdfLoading ? (
              <><div className="w-3.5 h-3.5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />PDF...</>
            ) : (
              <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>PDF letöltés</>
            )}
          </button>

          {quote.status === "accepted" && (
            <button
              onClick={async () => {
                setActionLoading("convert");
                try {
                  const res = await api.post(`/quotes/${id}/convert-to-contract`);
                  toast.success("Szerződés létrehozva az ajánlatból!");
                  router.push(`/contracts/${res.data.data?.id}`);
                } catch (err: any) {
                  toast.error(err.response?.data?.error?.message ?? "Hiba a konverziókor");
                } finally {
                  setActionLoading(null);
                }
              }}
              disabled={actionLoading === "convert"}
              className={brandBtn + " bg-purple-600 hover:bg-purple-700"}
            >
              {actionLoading === "convert" ? "Létrehozás..." : "Szerződés létrehozása"}
            </button>
          )}

          <button onClick={handleDuplicate} disabled={actionLoading === "duplicate"} className="border border-gray-300 dark:border-gray-600 px-5 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50">
            {actionLoading === "duplicate" ? "Duplikálás..." : "Duplikálás"}
          </button>

          <button onClick={() => { if (confirm("Biztosan törli az ajánlatot?")) doAction("", "Ajánlat törölve!", "delete"); }} disabled={actionLoading === "delete"} className="border border-red-200 dark:border-red-800 px-5 py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition disabled:opacity-50">
            {actionLoading === "delete" ? "Törlés..." : "Törlés"}
          </button>
        </div>
      </div>

      {/* Client info */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Ügyfél adatok</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Név</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{quote.clientName}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Email</p>
            <p className="text-sm text-gray-900 dark:text-white">{quote.clientEmail}</p>
          </div>
          {quote.clientCompany && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Cég</p>
              <p className="text-sm text-gray-900 dark:text-white">{quote.clientCompany}</p>
            </div>
          )}
          {quote.clientPhone && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Telefon</p>
              <p className="text-sm text-gray-900 dark:text-white">{quote.clientPhone}</p>
            </div>
          )}
          {quote.clientAddress && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Cím</p>
              <p className="text-sm text-gray-900 dark:text-white">{quote.clientAddress}</p>
            </div>
          )}
          {quote.clientTaxNumber && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Adószám</p>
              <p className="text-sm text-gray-900 dark:text-white">{quote.clientTaxNumber}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Érvényesség</p>
            <p className="text-sm text-gray-900 dark:text-white">
              {quote.validUntil ? new Date(quote.validUntil).toLocaleDateString("hu-HU") : "Nincs megadva"}
            </p>
          </div>
        </div>
      </div>

      {/* Intro text */}
      {quote.introText && (
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium">Bevezető</p>
          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{quote.introText}</p>
        </div>
      )}

      {/* Line items */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tételek</h2>

        {items.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500">Nincsenek tételek</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                    <th className="pb-2 pr-2 font-medium">Leírás</th>
                    <th className="pb-2 px-2 font-medium text-right">Mennyiség</th>
                    <th className="pb-2 px-2 font-medium">Egység</th>
                    <th className="pb-2 px-2 font-medium text-right">Egységár</th>
                    <th className="pb-2 px-2 font-medium text-right">ÁFA</th>
                    <th className="pb-2 px-2 font-medium text-right">Nettó</th>
                    <th className="pb-2 pl-2 font-medium text-right">Bruttó</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from(sections.entries()).map(([sectionName, sectionItems]) => (
                    <SectionBlock key={sectionName} name={sectionName} items={sectionItems} currency={quote.currency} brandColor={brandColor} />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="flex flex-col items-end gap-1">
                <div className="flex justify-between w-full max-w-xs text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Nettó összeg:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(totalNetto, quote.currency)}</span>
                </div>
                {quote.discount && quote.discountType && (
                  <div className="flex justify-between w-full max-w-xs text-sm text-red-500">
                    <span>Kedvezmény ({quote.discountType === "percent" ? `${quote.discount}%` : formatCurrency(quote.discount, quote.currency)}):</span>
                    <span>-{formatCurrency(
                      quote.discountType === "percent"
                        ? activeItems.reduce((s, i) => s + calcItemNetto(i), 0) * quote.discount / 100
                        : quote.discount,
                      quote.currency
                    )}</span>
                  </div>
                )}
                <div className="flex justify-between w-full max-w-xs text-sm">
                  <span className="text-gray-500 dark:text-gray-400">AFA:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(totalVat, quote.currency)}</span>
                </div>
                <div className="flex justify-between w-full max-w-xs text-base border-t border-gray-200 dark:border-gray-700 pt-2 mt-1">
                  <span className="font-semibold text-gray-900 dark:text-white">Bruttó összeg:</span>
                  <span className="font-bold" style={{ color: brandColor }}>{formatCurrency(totalBrutto, quote.currency)}</span>
                </div>
                {optionalItems.length > 0 && (
                  <div className="flex justify-between w-full max-w-xs text-sm mt-2 text-amber-600">
                    <span>Opcionális tételek:</span>
                    <span>{formatCurrency(optionalItems.reduce((s, i) => s + calcItemNetto(i), 0), quote.currency)} netto</span>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Outro text */}
      {quote.outroText && (
        <div className="rounded-xl border-l-4 p-6 mb-6 bg-green-50 dark:bg-green-900/10" style={{ borderColor: brandColor }}>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium">Záró szöveg</p>
          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{quote.outroText}</p>
        </div>
      )}

      {/* Notes */}
      {quote.notes && (
        <div className="bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-200 dark:border-amber-800 p-6">
          <p className="text-xs text-amber-600 dark:text-amber-400 mb-2 font-medium">Belső megjegyzés</p>
          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{quote.notes}</p>
        </div>
      )}
    </div>
  );
}

function SectionBlock({ name, items, currency, brandColor }: { name: string; items: QuoteItem[]; currency: string; brandColor: string }) {
  return (
    <>
      {name && (
        <tr>
          <td colSpan={7} className="pt-4 pb-1">
            <span className="text-sm font-semibold" style={{ color: brandColor }}>{name}</span>
          </td>
        </tr>
      )}
      {items.map((item, idx) => {
        const lineNetto = calcItemNetto(item);
        const lineVat = lineNetto * (item.taxRate / 100);
        return (
          <tr key={idx} className={`border-b border-gray-100 dark:border-gray-700 last:border-0 ${item.isOptional ? "opacity-60" : ""}`}>
            <td className="py-3 pr-2 text-sm text-gray-900 dark:text-white">
              {item.description}
              {item.isOptional && <span className="ml-2 text-xs px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded">opcionális</span>}
              {item.discount && item.discountType && (
                <span className="ml-2 text-xs text-red-500">
                  ({item.discountType === "percent" ? `-${item.discount}%` : `-${formatCurrency(item.discount, currency)}`})
                </span>
              )}
            </td>
            <td className="py-3 px-2 text-sm text-gray-700 dark:text-gray-300 text-right">{item.quantity}</td>
            <td className="py-3 px-2 text-sm text-gray-500 dark:text-gray-400">{item.unit}</td>
            <td className="py-3 px-2 text-sm text-gray-700 dark:text-gray-300 text-right">{formatCurrency(item.unitPrice, currency)}</td>
            <td className="py-3 px-2 text-sm text-gray-500 dark:text-gray-400 text-right">{item.taxRate}%</td>
            <td className="py-3 px-2 text-sm text-gray-700 dark:text-gray-300 text-right">{formatCurrency(lineNetto, currency)}</td>
            <td className="py-3 pl-2 text-sm font-medium text-gray-900 dark:text-white text-right">{formatCurrency(lineNetto + lineVat, currency)}</td>
          </tr>
        );
      })}
    </>
  );
}
