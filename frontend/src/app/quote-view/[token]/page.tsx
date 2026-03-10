"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";

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

interface QuoteComment {
  id: string;
  author: string;
  isOwner: boolean;
  content: string;
  createdAt: string;
}

interface Quote {
  id: string;
  title: string;
  quoteNumber?: string;
  clientName: string;
  clientEmail: string;
  clientCompany?: string;
  clientPhone?: string;
  clientAddress?: string;
  clientTaxNumber?: string;
  status: string;
  currency: string;
  validUntil: string | null;
  introText?: string;
  outroText?: string;
  discount?: number;
  discountType?: string;
  items: QuoteItem[];
  owner?: QuoteOwner;
  createdAt: string;
}

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

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

export default function QuoteViewPage() {
  const { token } = useParams<{ token: string }>();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionDone, setActionDone] = useState<"accepted" | "declined" | null>(null);
  const [acting, setActing] = useState(false);
  const [showDecline, setShowDecline] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [comments, setComments] = useState<QuoteComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [commentAuthor, setCommentAuthor] = useState("");
  const [sendingComment, setSendingComment] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => { loadQuote(); loadComments(); }, [token]);

  const loadQuote = async () => {
    try {
      const res = await axios.get(`${API}/quote-view/${token}`);
      setQuote(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Az ajanlat nem talalhato vagy mar nem ervenyes.");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    setActing(true);
    try {
      await axios.post(`${API}/quote-view/${token}/accept`);
      setActionDone("accepted");
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Hiba tortent");
    } finally {
      setActing(false);
    }
  };

  const handleDecline = async () => {
    setActing(true);
    try {
      await axios.post(`${API}/quote-view/${token}/decline`, { reason: declineReason });
      setActionDone("declined");
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Hiba tortent");
    } finally {
      setActing(false);
    }
  };

  const loadComments = async () => {
    try {
      const res = await axios.get(`${API}/quote-view/${token}/comments`);
      setComments(res.data.data ?? []);
    } catch {
      // silently fail - comments are non-critical
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !commentAuthor.trim()) return;
    setSendingComment(true);
    try {
      await axios.post(`${API}/quote-view/${token}/comments`, {
        author: commentAuthor.trim(),
        content: commentText.trim(),
      });
      setCommentText("");
      await loadComments();
    } catch {
      // silently fail
    } finally {
      setSendingComment(false);
    }
  };

  const handlePdfDownload = async () => {
    setPdfLoading(true);
    try {
      const res = await axios.get(`${API}/quote-view/${token}/pdf`, { responseType: "blob" });
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
      // silently fail for public page
    } finally {
      setPdfLoading(false);
    }
  };

  const brandColor = quote?.owner?.brandColor || "#198296";

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: "#198296" }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Hiba</h2>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  if (actionDone) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${actionDone === "accepted" ? "bg-green-100" : "bg-red-100"}`}>
            {actionDone === "accepted" ? (
              <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            ) : (
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            )}
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {actionDone === "accepted" ? "Ajanlat elfogadva!" : "Ajanlat visszautasitva"}
          </h2>
          <p className="text-gray-500">
            {actionDone === "accepted"
              ? "Koszonjuk! Az ajanlat keszitoje ertesitest kapott az elfogadasrol."
              : "Az ajanlat keszitoje ertesitest kapott a visszautasitasrol."}
          </p>
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
    const d = quote.discountType === "percent" ? totalNetto * (quote.discount / 100) : quote.discount;
    const ratio = totalNetto > 0 ? (totalNetto - d) / totalNetto : 0;
    totalNetto = Math.max(0, totalNetto - d);
    totalVat = Math.max(0, totalVat * ratio);
  }
  const totalBrutto = totalNetto + totalVat;

  const isExpired = quote.validUntil && new Date(quote.validUntil) < new Date();
  const canAct = quote.status === "sent" && !isExpired;

  // Group items by section
  const sections = new Map<string, QuoteItem[]>();
  for (const item of items) {
    const sec = item.sectionName || "";
    if (!sections.has(sec)) sections.set(sec, []);
    sections.get(sec)!.push(item);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header bar */}
      <div className="w-full py-4 px-6" style={{ backgroundColor: brandColor }}>
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            {quote.owner?.brandLogoUrl && (
              <img src={quote.owner.brandLogoUrl} alt="Logo" className="h-8 object-contain" />
            )}
            <span className="text-white font-semibold text-lg">
              {quote.owner?.companyName || quote.owner?.name || ""}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {quote.quoteNumber && (
              <span className="text-white/80 text-sm">{quote.quoteNumber}</span>
            )}
            <button
              onClick={handlePdfDownload}
              disabled={pdfLoading}
              className="flex items-center gap-1.5 text-white/90 hover:text-white text-sm bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              {pdfLoading ? "..." : "PDF"}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Status banner */}
        {quote.status !== "sent" && (
          <div className={`rounded-xl p-4 mb-6 text-center font-medium ${
            quote.status === "accepted" ? "bg-green-100 text-green-800" :
            quote.status === "declined" ? "bg-red-100 text-red-800" :
            quote.status === "expired" ? "bg-amber-100 text-amber-800" :
            "bg-gray-100 text-gray-700"
          }`}>
            {quote.status === "accepted" && "Ez az ajanlat mar elfogadasra kerult."}
            {quote.status === "declined" && "Ez az ajanlat visszautasitasra kerult."}
            {quote.status === "expired" && "Ez az ajanlat lejart."}
            {quote.status === "draft" && "Ez az ajanlat meg piszkozat allapotban van."}
          </div>
        )}

        {isExpired && quote.status === "sent" && (
          <div className="rounded-xl p-4 mb-6 text-center font-medium bg-amber-100 text-amber-800">
            Ez az ajanlat {new Date(quote.validUntil!).toLocaleDateString("hu-HU")}-en lejart.
          </div>
        )}

        {/* Title */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{quote.title}</h1>
          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
            <span>Letrehozva: {new Date(quote.createdAt).toLocaleDateString("hu-HU")}</span>
            {quote.validUntil && (
              <span>Ervenyes: {new Date(quote.validUntil).toLocaleDateString("hu-HU")}-ig</span>
            )}
            <span>Penznem: {quote.currency}</span>
          </div>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: brandColor }}>Felado</h3>
            <p className="font-semibold text-gray-900">{quote.owner?.companyName || quote.owner?.name}</p>
            {quote.owner?.email && <p className="text-sm text-gray-500">{quote.owner.email}</p>}
            {quote.owner?.phone && <p className="text-sm text-gray-500">{quote.owner.phone}</p>}
            {quote.owner?.taxNumber && <p className="text-sm text-gray-500">Adoszam: {quote.owner.taxNumber}</p>}
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: brandColor }}>Cimzett</h3>
            <p className="font-semibold text-gray-900">{quote.clientName}</p>
            {quote.clientCompany && <p className="text-sm text-gray-500">{quote.clientCompany}</p>}
            <p className="text-sm text-gray-500">{quote.clientEmail}</p>
            {quote.clientPhone && <p className="text-sm text-gray-500">{quote.clientPhone}</p>}
            {quote.clientAddress && <p className="text-sm text-gray-500">{quote.clientAddress}</p>}
            {quote.clientTaxNumber && <p className="text-sm text-gray-500">Adoszam: {quote.clientTaxNumber}</p>}
          </div>
        </div>

        {/* Intro */}
        {quote.introText && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{quote.introText}</p>
          </div>
        )}

        {/* Items */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Tetelek</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs uppercase tracking-wider border-b-2" style={{ color: brandColor, borderColor: brandColor }}>
                  <th className="text-left pb-3 pr-2">Leiras</th>
                  <th className="text-center pb-3 px-2">Menny.</th>
                  <th className="text-right pb-3 px-2">Egysegar</th>
                  <th className="text-center pb-3 px-2">AFA</th>
                  <th className="text-right pb-3 px-2">Netto</th>
                  <th className="text-right pb-3 pl-2">Brutto</th>
                </tr>
              </thead>
              <tbody>
                {Array.from(sections.entries()).map(([secName, secItems]) => (
                  <SectionRows key={secName} name={secName} items={secItems} currency={quote.currency} brandColor={brandColor} />
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="mt-6 pt-4 border-t-2" style={{ borderColor: brandColor }}>
            <div className="flex flex-col items-end gap-1">
              <Row label="Netto osszeg" value={formatCurrency(totalNetto, quote.currency)} />
              {quote.discount && quote.discountType && (
                <Row
                  label={`Kedvezmeny (${quote.discountType === "percent" ? `${quote.discount}%` : formatCurrency(quote.discount, quote.currency)})`}
                  value={`-${formatCurrency(quote.discountType === "percent" ? activeItems.reduce((s, i) => s + calcItemNetto(i), 0) * quote.discount / 100 : quote.discount, quote.currency)}`}
                  className="text-red-500"
                />
              )}
              <Row label="AFA" value={formatCurrency(totalVat, quote.currency)} />
              <div className="flex justify-between w-full max-w-sm text-lg border-t-2 pt-3 mt-2" style={{ borderColor: brandColor }}>
                <span className="font-bold text-gray-900">Brutto osszeg</span>
                <span className="font-bold" style={{ color: brandColor }}>{formatCurrency(totalBrutto, quote.currency)}</span>
              </div>
              {optionalItems.length > 0 && (
                <div className="flex justify-between w-full max-w-sm text-sm mt-2 text-amber-600">
                  <span>Opcionalis tetelek:</span>
                  <span>{formatCurrency(optionalItems.reduce((s, i) => s + calcItemNetto(i), 0), quote.currency)} netto</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Outro */}
        {quote.outroText && (
          <div className="bg-white rounded-2xl shadow-sm border-l-4 p-6 mb-6" style={{ borderColor: brandColor }}>
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{quote.outroText}</p>
          </div>
        )}

        {/* Action buttons */}
        {canAct && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-6">
            {!showDecline ? (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={handleAccept}
                  disabled={acting}
                  className="text-white px-8 py-3 rounded-xl text-base font-semibold transition disabled:opacity-50 shadow-lg"
                  style={{ backgroundColor: "#22c55e" }}
                >
                  {acting ? "Feldolgozas..." : "Ajanlat elfogadasa"}
                </button>
                <button
                  onClick={() => setShowDecline(true)}
                  disabled={acting}
                  className="px-8 py-3 rounded-xl text-base font-semibold border-2 border-red-200 text-red-600 hover:bg-red-50 transition disabled:opacity-50"
                >
                  Visszautasitas
                </button>
              </div>
            ) : (
              <div className="max-w-md mx-auto">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Ajanlat visszautasitasa</h3>
                <textarea
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  placeholder="Indok (opcionalis)..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-300 resize-none mb-4"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDecline(false)}
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
                  >
                    Megse
                  </button>
                  <button
                    onClick={handleDecline}
                    disabled={acting}
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-50"
                  >
                    {acting ? "Feldolgozas..." : "Visszautasitas"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Comments section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Kerdesek, megjegyzesek</h2>

          {/* Comments timeline */}
          {comments.length > 0 && (
            <div className="space-y-4 mb-6">
              {comments.map((c) => (
                <div
                  key={c.id}
                  className={`flex ${c.isOwner ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                      c.isOwner
                        ? "rounded-br-sm text-white"
                        : "bg-gray-100 text-gray-900 rounded-bl-sm"
                    }`}
                    style={c.isOwner ? { backgroundColor: brandColor } : undefined}
                  >
                    <div className={`text-xs font-semibold mb-1 ${c.isOwner ? "text-white/80" : "text-gray-500"}`}>
                      {c.author}
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{c.content}</p>
                    <div className={`text-xs mt-1 ${c.isOwner ? "text-white/60" : "text-gray-400"}`}>
                      {new Date(c.createdAt).toLocaleString("hu-HU", {
                        year: "numeric", month: "2-digit", day: "2-digit",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {comments.length === 0 && (
            <p className="text-sm text-gray-400 mb-6">Meg nincsenek hozzaszolasok. Tegyen fel kerdest az ajanlat kapcsanl!</p>
          )}

          {/* Add comment form */}
          <div className="border-t border-gray-100 pt-4">
            <div className="mb-3">
              <input
                type="text"
                value={commentAuthor}
                onChange={(e) => setCommentAuthor(e.target.value)}
                placeholder="Az On neve"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:border-transparent"
                style={{ "--tw-ring-color": brandColor } as React.CSSProperties}
              />
            </div>
            <div className="mb-3">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Irja le kerdeset vagy megjegyzeset..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:border-transparent resize-none"
                style={{ "--tw-ring-color": brandColor } as React.CSSProperties}
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleAddComment}
                disabled={sendingComment || !commentText.trim() || !commentAuthor.trim()}
                className="text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-50"
                style={{ backgroundColor: brandColor }}
              >
                {sendingComment ? "Kuldes..." : "Kerdes kuldese"}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-400 py-6">
          Legitas · {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div className={`flex justify-between w-full max-w-sm text-sm ${className}`}>
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}

function SectionRows({ name, items, currency, brandColor }: { name: string; items: QuoteItem[]; currency: string; brandColor: string }) {
  return (
    <>
      {name && (
        <tr>
          <td colSpan={6} className="pt-5 pb-2">
            <span className="text-sm font-bold" style={{ color: brandColor }}>{name}</span>
          </td>
        </tr>
      )}
      {items.map((item, idx) => {
        const netto = calcItemNetto(item);
        const vat = netto * (item.taxRate / 100);
        return (
          <tr key={idx} className={`border-b border-gray-100 last:border-0 ${item.isOptional ? "opacity-50" : ""}`}>
            <td className="py-3 pr-2 text-sm text-gray-900">
              {item.description}
              {item.isOptional && <span className="ml-2 text-xs px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded">opcionalis</span>}
              {item.discount && item.discountType && (
                <span className="ml-2 text-xs text-red-500">({item.discountType === "percent" ? `-${item.discount}%` : `-${formatCurrency(item.discount, currency)}`})</span>
              )}
            </td>
            <td className="py-3 px-2 text-sm text-gray-700 text-center">{item.quantity} {item.unit}</td>
            <td className="py-3 px-2 text-sm text-gray-700 text-right">{formatCurrency(item.unitPrice, currency)}</td>
            <td className="py-3 px-2 text-sm text-gray-500 text-center">{item.taxRate}%</td>
            <td className="py-3 px-2 text-sm text-gray-700 text-right">{formatCurrency(netto, currency)}</td>
            <td className="py-3 pl-2 text-sm font-medium text-gray-900 text-right">{formatCurrency(netto + vat, currency)}</td>
          </tr>
        );
      })}
    </>
  );
}
