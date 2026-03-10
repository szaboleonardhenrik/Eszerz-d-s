"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import toast from "react-hot-toast";

interface Invoice {
  id: string;
  quoteId: string | null;
  invoiceNumber: string | null;
  amount: number;
  currency: string;
  buyerName: string;
  buyerEmail: string;
  status: string;
  pdfUrl: string | null;
  errorMessage: string | null;
  createdAt: string;
}

export default function InvoicingSettings() {
  const [enabled, setEnabled] = useState(false);
  const [autoInvoice, setAutoInvoice] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    try {
      const { data } = await api.get("/invoicing/settings");
      setEnabled(data.data.enabled);
      setAutoInvoice(data.data.autoInvoice);
    } catch {
      /* ignore */
    }
  }, []);

  const loadInvoices = useCallback(async () => {
    try {
      const { data } = await api.get(`/invoicing/invoices?page=${page}&limit=15`);
      setInvoices(data.data.invoices);
      setTotalPages(data.data.pagination.pages);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadSettings();
    loadInvoices();
  }, [loadSettings, loadInvoices]);

  const toggleAutoInvoice = async () => {
    try {
      await api.patch("/invoicing/settings", { autoInvoice: !autoInvoice });
      setAutoInvoice(!autoInvoice);
      toast.success(autoInvoice ? "Automatikus számlázás kikapcsolva" : "Automatikus számlázás bekapcsolva");
    } catch {
      toast.error("Hiba a beállítás mentésekor");
    }
  };

  const retryInvoice = async (id: string) => {
    setRetrying(id);
    try {
      const { data } = await api.post(`/invoicing/retry/${id}`);
      if (data.data.success) {
        toast.success(`Számla kiállítva: ${data.data.invoiceNumber}`);
        loadInvoices();
      } else {
        toast.error(`Hiba: ${data.data.error}`);
      }
    } catch {
      toast.error("Hiba az újrapróbálásnál");
    } finally {
      setRetrying(null);
    }
  };

  const statusLabel: Record<string, { text: string; color: string }> = {
    pending: { text: "Folyamatban", color: "bg-yellow-100 text-yellow-800" },
    issued: { text: "Kiállítva", color: "bg-green-100 text-green-800" },
    failed: { text: "Sikertelen", color: "bg-red-100 text-red-800" },
    cancelled: { text: "Visszavonva", color: "bg-gray-100 text-gray-600" },
  };

  const formatCurrency = (amount: number, currency: string) => {
    const rounded = Math.round(amount);
    const formatted = new Intl.NumberFormat("hu-HU").format(rounded);
    return currency === "HUF" ? `${formatted} Ft` : `${formatted} ${currency}`;
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Settings card */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Számlázz.hu integráció</h2>

        <div className="flex items-center gap-3 mb-4">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
              enabled ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${enabled ? "bg-green-500" : "bg-gray-400"}`} />
            {enabled ? "Aktív" : "Nincs konfigurálva"}
          </span>
        </div>

        {!enabled && (
          <p className="text-sm text-gray-500 mb-4">
            A Számlázz.hu integráció aktiválásához állítsd be a <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">SZAMLAZZ_AGENT_KEY</code> környezeti változót a szerveren.
          </p>
        )}

        <div className="flex items-center justify-between py-3 border-t">
          <div>
            <p className="text-sm font-medium text-gray-900">Automatikus számlázás</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Elfogadott ajánlatokhoz automatikusan számla kiállítása
            </p>
          </div>
          <button
            onClick={toggleAutoInvoice}
            disabled={!enabled}
            className={`relative w-11 h-6 rounded-full transition ${
              autoInvoice && enabled ? "bg-brand-teal" : "bg-gray-200"
            } ${!enabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition ${
                autoInvoice && enabled ? "translate-x-5" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* Invoice list */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Kiállított számlák</h2>

        {loading ? (
          <div className="text-center py-8 text-gray-400">Betöltés...</div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-8 text-gray-400">Még nincsenek számlák</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="pb-2 font-medium">Számla</th>
                    <th className="pb-2 font-medium">Vevő</th>
                    <th className="pb-2 font-medium text-right">Összeg</th>
                    <th className="pb-2 font-medium">Státusz</th>
                    <th className="pb-2 font-medium">Dátum</th>
                    <th className="pb-2" />
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {invoices.map((inv) => {
                    const st = statusLabel[inv.status] ?? statusLabel.pending;
                    return (
                      <tr key={inv.id} className="hover:bg-gray-50">
                        <td className="py-2.5 font-mono text-xs">
                          {inv.invoiceNumber ?? "—"}
                        </td>
                        <td className="py-2.5">
                          <div className="font-medium text-gray-900">{inv.buyerName}</div>
                          <div className="text-xs text-gray-500">{inv.buyerEmail}</div>
                        </td>
                        <td className="py-2.5 text-right font-medium">
                          {formatCurrency(inv.amount, inv.currency)}
                        </td>
                        <td className="py-2.5">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${st.color}`}>
                            {st.text}
                          </span>
                          {inv.errorMessage && (
                            <p className="text-xs text-red-500 mt-0.5">{inv.errorMessage}</p>
                          )}
                        </td>
                        <td className="py-2.5 text-gray-500 text-xs">
                          {new Date(inv.createdAt).toLocaleDateString("hu-HU")}
                        </td>
                        <td className="py-2.5 text-right">
                          {inv.status === "failed" && (
                            <button
                              onClick={() => retryInvoice(inv.id)}
                              disabled={retrying === inv.id}
                              className="text-xs text-brand-teal hover:underline disabled:opacity-50"
                            >
                              {retrying === inv.id ? "..." : "Újrapróbálás"}
                            </button>
                          )}
                          {inv.pdfUrl && (
                            <a
                              href={inv.pdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-brand-teal hover:underline ml-3"
                            >
                              PDF
                            </a>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 text-sm border rounded-lg disabled:opacity-30 hover:bg-gray-50"
                >
                  Előző
                </button>
                <span className="px-3 py-1 text-sm text-gray-500">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 text-sm border rounded-lg disabled:opacity-30 hover:bg-gray-50"
                >
                  Következő
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
