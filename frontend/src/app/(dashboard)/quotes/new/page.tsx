"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

const emptyItem: LineItem = {
  description: "",
  quantity: 1,
  unitPrice: 0,
  unit: "db",
  vatPercent: 27,
};

const unitOptions = [
  { value: "db", label: "db" },
  { value: "ora", label: "ora" },
  { value: "honap", label: "honap" },
  { value: "nap", label: "nap" },
];

function formatCurrency(value: number, currency: string) {
  const formatted = new Intl.NumberFormat("hu-HU").format(Math.round(value));
  const symbols: Record<string, string> = { HUF: " Ft", EUR: " EUR", USD: " USD" };
  return formatted + (symbols[currency] ?? ` ${currency}`);
}

export default function NewQuotePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientCompany, setClientCompany] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [currency, setCurrency] = useState("HUF");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<LineItem[]>([{ ...emptyItem }]);

  const updateItem = (index: number, field: keyof LineItem, value: string | number) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const addItem = () => {
    setItems((prev) => [...prev, { ...emptyItem }]);
  };

  const calcLineNetto = (item: LineItem) => item.quantity * item.unitPrice;
  const calcLineVat = (item: LineItem) => calcLineNetto(item) * (item.vatPercent / 100);
  const calcLineBrutto = (item: LineItem) => calcLineNetto(item) + calcLineVat(item);

  const totalNetto = items.reduce((sum, item) => sum + calcLineNetto(item), 0);
  const totalVat = items.reduce((sum, item) => sum + calcLineVat(item), 0);
  const totalBrutto = totalNetto + totalVat;

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("A cim megadasa kotelezo");
      return;
    }
    if (!clientName.trim()) {
      toast.error("Az ugyfel neve kotelezo");
      return;
    }
    if (!clientEmail.trim()) {
      toast.error("Az ugyfel email cime kotelezo");
      return;
    }
    if (items.length === 0 || items.every((i) => !i.description.trim())) {
      toast.error("Legalabb egy tetel megadasa kotelezo");
      return;
    }

    setSaving(true);
    try {
      await api.post("/quotes", {
        title: title.trim(),
        clientName: clientName.trim(),
        clientEmail: clientEmail.trim(),
        clientCompany: clientCompany.trim() || undefined,
        validUntil: validUntil || undefined,
        currency,
        notes: notes.trim() || undefined,
        lineItems: items.filter((i) => i.description.trim()),
      });
      toast.success("Ajanlat letrehozva!");
      router.push("/quotes");
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message ?? "Hiba az ajanlat mentesekor");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#198296]";
  const labelClass = "block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1";

  return (
    <div>
      {/* Header */}
      <Link
        href="/quotes"
        className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-4 inline-block"
      >
        &larr; Vissza az ajanlatokhoz
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Uj ajanlat</h1>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Altalanos adatok</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className={labelClass}>Cim *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Pl. Weboldal fejlesztes ajanlat"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Ugyfel neve *</label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Pl. Kovacs Janos"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Ugyfel email *</label>
            <input
              type="email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              placeholder="Pl. kovacs@ceg.hu"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Cegnev</label>
            <input
              type="text"
              value={clientCompany}
              onChange={(e) => setClientCompany(e.target.value)}
              placeholder="Pl. Pelda Kft."
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Ervenyesseg</label>
            <input
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Penznem</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className={inputClass}
            >
              <option value="HUF">HUF (Forint)</option>
              <option value="EUR">EUR (Euro)</option>
              <option value="USD">USD (Dollar)</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Megjegyzes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Egyeb megjegyzes az ajanlathoz..."
              className={inputClass + " resize-none"}
            />
          </div>
        </div>
      </div>

      {/* Line items */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tetelek</h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                <th className="pb-2 pr-2 font-medium">Leiras</th>
                <th className="pb-2 px-2 font-medium w-20">Menny.</th>
                <th className="pb-2 px-2 font-medium w-28">Egysegar</th>
                <th className="pb-2 px-2 font-medium w-24">Egyseg</th>
                <th className="pb-2 px-2 font-medium w-20">AFA %</th>
                <th className="pb-2 px-2 font-medium w-28 hidden sm:table-cell">Netto</th>
                <th className="pb-2 px-2 font-medium w-24 hidden md:table-cell">AFA</th>
                <th className="pb-2 px-2 font-medium w-28 hidden sm:table-cell">Brutto</th>
                <th className="pb-2 pl-2 font-medium w-10"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx} className="border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <td className="py-2 pr-2">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateItem(idx, "description", e.target.value)}
                      placeholder="Tetel leirasa"
                      className={inputClass}
                    />
                  </td>
                  <td className="py-2 px-2">
                    <input
                      type="number"
                      min={0}
                      value={item.quantity}
                      onChange={(e) => updateItem(idx, "quantity", Number(e.target.value))}
                      className={inputClass + " text-right"}
                    />
                  </td>
                  <td className="py-2 px-2">
                    <input
                      type="number"
                      min={0}
                      value={item.unitPrice}
                      onChange={(e) => updateItem(idx, "unitPrice", Number(e.target.value))}
                      className={inputClass + " text-right"}
                    />
                  </td>
                  <td className="py-2 px-2">
                    <select
                      value={item.unit}
                      onChange={(e) => updateItem(idx, "unit", e.target.value)}
                      className={inputClass}
                    >
                      {unitOptions.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2 px-2">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={item.vatPercent}
                      onChange={(e) => updateItem(idx, "vatPercent", Number(e.target.value))}
                      className={inputClass + " text-right"}
                    />
                  </td>
                  <td className="py-2 px-2 text-sm text-gray-700 dark:text-gray-300 text-right hidden sm:table-cell">
                    {formatCurrency(calcLineNetto(item), currency)}
                  </td>
                  <td className="py-2 px-2 text-sm text-gray-500 dark:text-gray-400 text-right hidden md:table-cell">
                    {formatCurrency(calcLineVat(item), currency)}
                  </td>
                  <td className="py-2 px-2 text-sm font-medium text-gray-900 dark:text-white text-right hidden sm:table-cell">
                    {formatCurrency(calcLineBrutto(item), currency)}
                  </td>
                  <td className="py-2 pl-2">
                    <button
                      onClick={() => removeItem(idx)}
                      disabled={items.length <= 1}
                      className="text-gray-400 hover:text-red-500 disabled:opacity-30 transition p-1"
                      title="Sor torlese"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button
          onClick={addItem}
          className="mt-3 text-sm font-medium px-4 py-2 rounded-lg transition"
          style={{ color: "#198296" }}
          onMouseEnter={(e) => ((e.target as HTMLElement).style.backgroundColor = "rgba(25,130,150,0.08)")}
          onMouseLeave={(e) => ((e.target as HTMLElement).style.backgroundColor = "transparent")}
        >
          + Sor hozzaadasa
        </button>

        {/* Totals */}
        <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="flex flex-col items-end gap-1">
            <div className="flex justify-between w-full max-w-xs text-sm">
              <span className="text-gray-500 dark:text-gray-400">Netto osszeg:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatCurrency(totalNetto, currency)}
              </span>
            </div>
            <div className="flex justify-between w-full max-w-xs text-sm">
              <span className="text-gray-500 dark:text-gray-400">AFA:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatCurrency(totalVat, currency)}
              </span>
            </div>
            <div className="flex justify-between w-full max-w-xs text-base border-t border-gray-200 dark:border-gray-700 pt-2 mt-1">
              <span className="font-semibold text-gray-900 dark:text-white">Brutto osszeg:</span>
              <span className="font-bold text-gray-900 dark:text-white">
                {formatCurrency(totalBrutto, currency)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Link
          href="/quotes"
          className="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
        >
          Megse
        </Link>
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-white px-6 py-2.5 rounded-lg text-sm font-medium transition disabled:opacity-50"
          style={{ backgroundColor: "#198296" }}
          onMouseEnter={(e) => {
            if (!saving) (e.target as HTMLElement).style.backgroundColor = "#0e5f6e";
          }}
          onMouseLeave={(e) => {
            if (!saving) (e.target as HTMLElement).style.backgroundColor = "#198296";
          }}
        >
          {saving ? "Mentes..." : "Ajanlat mentese"}
        </button>
      </div>
    </div>
  );
}
