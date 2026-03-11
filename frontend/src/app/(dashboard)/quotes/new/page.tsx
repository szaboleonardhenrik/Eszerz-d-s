"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import toast from "react-hot-toast";

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  unit: string;
  taxRate: number;
  sectionName: string;
  isOptional: boolean;
  discount: number;
  discountType: string;
  sortOrder: number;
}

interface Contact {
  id: string;
  name: string;
  email: string;
  company?: string;
  phone?: string;
  taxNumber?: string;
  address?: string;
}

interface QuoteTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  currency: string;
  introText?: string;
  outroText?: string;
  itemsJson: string;
  variables?: string;
}

interface TemplateVariable {
  key: string;
  label: string;
  type: string;
  defaultValue: string;
}

const emptyItem: LineItem = {
  description: "",
  quantity: 1,
  unitPrice: 0,
  unit: "db",
  taxRate: 27,
  sectionName: "",
  isOptional: false,
  discount: 0,
  discountType: "",
  sortOrder: 0,
};

const unitOptions = [
  { value: "db", label: "db" },
  { value: "ora", label: "ora" },
  { value: "honap", label: "honap" },
  { value: "nap", label: "nap" },
  { value: "projekt", label: "projekt" },
  { value: "oldal", label: "oldal" },
  { value: "km", label: "km" },
];

const categoryLabels: Record<string, string> = {
  altalanos: "Általános",
  it: "IT / Szoftverfejlesztés",
  marketing: "Marketing",
  epiteszet: "Építészet / Kivitelezés",
  tanacsadas: "Tanácsadás",
  design: "Design / Kreatív",
  oktatas: "Oktatás / Képzés",
  karbantartas: "Karbantartás / Üzemeltetés",
};

function formatCurrency(value: number, currency: string) {
  const formatted = new Intl.NumberFormat("hu-HU").format(Math.round(value));
  const symbols: Record<string, string> = { HUF: " Ft", EUR: " EUR", USD: " USD" };
  return formatted + (symbols[currency] ?? ` ${currency}`);
}

export default function NewQuotePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  const [saving, setSaving] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(!!editId);
  const [templates, setTemplates] = useState<QuoteTemplate[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [showContacts, setShowContacts] = useState(false);
  const [contactSearch, setContactSearch] = useState("");
  const [showTemplates, setShowTemplates] = useState(!editId);

  // Form state
  const [title, setTitle] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientCompany, setClientCompany] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [clientTaxNumber, setClientTaxNumber] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [currency, setCurrency] = useState("HUF");
  const [language, setLanguage] = useState("hu");
  const [introText, setIntroText] = useState("");
  const [outroText, setOutroText] = useState("");
  const [notes, setNotes] = useState("");
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState("");
  const [items, setItems] = useState<LineItem[]>([{ ...emptyItem }]);
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [variablesData, setVariablesData] = useState<Record<string, string>>({});
  const [templateVariables, setTemplateVariables] = useState<TemplateVariable[]>([]);

  // Sections
  const [showSections, setShowSections] = useState(false);

  useEffect(() => {
    loadTemplates();
    loadContacts();
    if (editId) loadExisting();
  }, [editId]);

  useEffect(() => {
    const hasSections = items.some((i) => i.sectionName);
    if (hasSections) setShowSections(true);
  }, [items]);

  const loadContacts = async () => {
    try {
      const res = await api.get("/contacts");
      setContacts(res.data.data ?? []);
    } catch { /* contacts are optional */ }
  };

  const applyContact = (c: Contact) => {
    setClientName(c.name);
    setClientEmail(c.email);
    setClientCompany(c.company ?? "");
    setClientPhone(c.phone ?? "");
    setClientAddress(c.address ?? "");
    setClientTaxNumber(c.taxNumber ?? "");
    setShowContacts(false);
    toast.success(`Kontakt betöltve: ${c.name}`);
  };

  const filteredContacts = contacts.filter((c) => {
    if (!contactSearch) return true;
    const q = contactSearch.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || (c.company?.toLowerCase().includes(q));
  });

  const loadTemplates = async () => {
    try {
      const res = await api.get("/quotes/templates");
      setTemplates(res.data.data ?? []);
    } catch {
      // templates are optional
    }
  };

  const loadExisting = async () => {
    try {
      const res = await api.get(`/quotes/${editId}`);
      const q = res.data.data;
      setTitle(q.title);
      setClientName(q.clientName);
      setClientEmail(q.clientEmail);
      setClientCompany(q.clientCompany ?? "");
      setClientPhone(q.clientPhone ?? "");
      setClientAddress(q.clientAddress ?? "");
      setClientTaxNumber(q.clientTaxNumber ?? "");
      setValidUntil(q.validUntil ? q.validUntil.split("T")[0] : "");
      setCurrency(q.currency);
      setLanguage(q.language ?? "hu");
      setIntroText(q.introText ?? "");
      setOutroText(q.outroText ?? "");
      setNotes(q.notes ?? "");
      setDiscount(q.discount ?? 0);
      setDiscountType(q.discountType ?? "");
      setTemplateId(q.templateId ?? null);
      if (q.variablesData) {
        try { setVariablesData(JSON.parse(q.variablesData)); } catch { /* ignore */ }
      }
      setItems(
        (q.items ?? []).map((item: any) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          unit: item.unit,
          taxRate: item.taxRate,
          sectionName: item.sectionName ?? "",
          isOptional: item.isOptional ?? false,
          discount: item.discount ?? 0,
          discountType: item.discountType ?? "",
          sortOrder: item.sortOrder ?? 0,
        }))
      );
      setShowTemplates(false);
    } catch {
      toast.error("Hiba az ajánlat betöltésekor");
    } finally {
      setLoadingEdit(false);
    }
  };

  const applyTemplate = (t: QuoteTemplate) => {
    setTemplateId(t.id);
    if (!title) setTitle(t.name);
    setCurrency(t.currency);
    setIntroText(t.introText ?? "");
    setOutroText(t.outroText ?? "");

    try {
      const parsedItems = JSON.parse(t.itemsJson) as LineItem[];
      setItems(
        parsedItems.map((item, idx) => ({
          ...emptyItem,
          ...item,
          sortOrder: idx,
        }))
      );
    } catch {
      // keep current items
    }

    if (t.variables) {
      try {
        const vars = JSON.parse(t.variables) as TemplateVariable[];
        setTemplateVariables(vars);
        const defaults: Record<string, string> = {};
        vars.forEach((v) => { defaults[v.key] = v.defaultValue ?? ""; });
        setVariablesData(defaults);
      } catch { /* ignore */ }
    }

    setShowTemplates(false);
    toast.success(`Sablon alkalmazva: ${t.name}`);
  };

  const updateItem = (index: number, field: keyof LineItem, value: string | number | boolean) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const addItem = (sectionName = "") => {
    setItems((prev) => [...prev, { ...emptyItem, sectionName, sortOrder: prev.length }]);
  };

  const moveItem = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= items.length) return;
    setItems((prev) => {
      const copy = [...prev];
      [copy[index], copy[newIndex]] = [copy[newIndex], copy[index]];
      return copy.map((item, i) => ({ ...item, sortOrder: i }));
    });
  };

  const calcLineNetto = (item: LineItem) => {
    let netto = item.quantity * item.unitPrice;
    if (item.discount && item.discountType) {
      if (item.discountType === "percent") netto *= (1 - item.discount / 100);
      else netto -= item.discount;
    }
    return Math.max(0, netto);
  };
  const calcLineVat = (item: LineItem) => calcLineNetto(item) * (item.taxRate / 100);
  const calcLineBrutto = (item: LineItem) => calcLineNetto(item) + calcLineVat(item);

  const activeItems = items.filter((i) => !i.isOptional && i.description.trim());
  const optionalItems = items.filter((i) => i.isOptional && i.description.trim());

  let totalNetto = activeItems.reduce((sum, item) => sum + calcLineNetto(item), 0);
  let totalVat = activeItems.reduce((sum, item) => sum + calcLineVat(item), 0);

  // Global discount
  if (discount && discountType) {
    const discAmount = discountType === "percent" ? totalNetto * (discount / 100) : discount;
    const ratio = totalNetto > 0 ? (totalNetto - discAmount) / totalNetto : 0;
    totalNetto = Math.max(0, totalNetto - discAmount);
    totalVat = Math.max(0, totalVat * ratio);
  }
  const totalBrutto = totalNetto + totalVat;

  const replaceVariables = (text: string) => {
    return text.replace(/\{\{(\w+)\}\}/g, (_, key) => variablesData[key] || `{{${key}}}`);
  };

  const handleSave = async () => {
    if (!title.trim()) { toast.error("A cím megadása kötelező"); return; }
    if (!clientName.trim()) { toast.error("Az ügyfél neve kötelező"); return; }
    if (!clientEmail.trim()) { toast.error("Az ügyfél email címe kötelező"); return; }
    if (items.length === 0 || items.every((i) => !i.description.trim())) { toast.error("Legalább egy tétel megadása kötelező"); return; }

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        clientName: clientName.trim(),
        clientEmail: clientEmail.trim(),
        clientCompany: clientCompany.trim() || undefined,
        clientPhone: clientPhone.trim() || undefined,
        clientAddress: clientAddress.trim() || undefined,
        clientTaxNumber: clientTaxNumber.trim() || undefined,
        validUntil: validUntil || undefined,
        currency,
        language,
        introText: replaceVariables(introText.trim()) || undefined,
        outroText: replaceVariables(outroText.trim()) || undefined,
        notes: notes.trim() || undefined,
        discount: discount || undefined,
        discountType: discountType || undefined,
        templateId: templateId || undefined,
        variablesData: Object.keys(variablesData).length > 0 ? JSON.stringify(variablesData) : undefined,
        items: items
          .filter((i) => i.description.trim())
          .map((i, idx) => ({
            description: replaceVariables(i.description),
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            unit: i.unit,
            taxRate: i.taxRate,
            sectionName: i.sectionName || undefined,
            isOptional: i.isOptional || undefined,
            discount: i.discount || undefined,
            discountType: i.discountType || undefined,
            sortOrder: idx,
          })),
      };

      if (editId) {
        await api.put(`/quotes/${editId}`, payload);
        toast.success("Ajánlat frissítve!");
        router.push(`/quotes/${editId}`);
      } else {
        const res = await api.post("/quotes", payload);
        toast.success("Ajánlat létrehozva!");
        router.push(`/quotes/${res.data.data.id}`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message ?? "Hiba az ajánlat mentésekor");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#198296]";
  const labelClass = "block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1";

  if (loadingEdit) {
    return (
      <div className="animate-pulse">
        <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
        <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded mb-6" />
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="space-y-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Group items by section for display
  const sections = new Map<string, number[]>();
  items.forEach((item, idx) => {
    const sec = item.sectionName || "";
    if (!sections.has(sec)) sections.set(sec, []);
    sections.get(sec)!.push(idx);
  });

  return (
    <div>
      <Link
        href="/quotes"
        className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-4 inline-block"
      >
        &larr; Vissza az ajánlatokhoz
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        {editId ? "Ajánlat szerkesztése" : "Új ajánlat"}
      </h1>

      {/* Template selector */}
      {showTemplates && templates.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Sablon választás</h2>
            <button
              onClick={() => setShowTemplates(false)}
              className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              Kihagyás
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {templates.map((t) => (
              <button
                key={t.id}
                onClick={() => applyTemplate(t)}
                className="text-left p-4 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-[#198296] hover:bg-[#198296]/5 dark:hover:bg-[#198296]/10 transition group"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-[#198296] text-sm">
                      {t.name}
                    </h3>
                    {t.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                        {t.description}
                      </p>
                    )}
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 whitespace-nowrap ml-2">
                    {categoryLabels[t.category] ?? t.category}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Template variables */}
      {templateVariables.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Változók kitöltése</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Ezek a változók automatikusan behelyettesítődnek az ajánlat szövegébe ({"{{változó_név}}"} formában).
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {templateVariables.map((v) => (
              <div key={v.key}>
                <label className={labelClass}>{v.label}</label>
                <input
                  type={v.type === "number" ? "number" : "text"}
                  value={variablesData[v.key] ?? ""}
                  onChange={(e) =>
                    setVariablesData((prev) => ({ ...prev, [v.key]: e.target.value }))
                  }
                  placeholder={v.defaultValue}
                  className={inputClass}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* General info */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Általános adatok</h2>
          {contacts.length > 0 && (
            <button
              onClick={() => setShowContacts(!showContacts)}
              className="text-sm px-3 py-1.5 rounded-lg border border-[#198296] text-[#198296] hover:bg-[#198296]/5 transition font-medium"
            >
              Kontaktból betöltés
            </button>
          )}
        </div>

        {/* Contact picker dropdown */}
        {showContacts && (
          <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
            <input
              type="text"
              value={contactSearch}
              onChange={(e) => setContactSearch(e.target.value)}
              placeholder="Kontakt keresése..."
              className={inputClass + " mb-2"}
            />
            <div className="max-h-48 overflow-y-auto space-y-1">
              {filteredContacts.length === 0 ? (
                <p className="text-sm text-gray-400 py-2">Nincs találat</p>
              ) : (
                filteredContacts.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => applyContact(c)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-white dark:hover:bg-gray-600 transition flex justify-between items-center"
                  >
                    <div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{c.name}</span>
                      <span className="text-xs text-gray-400 ml-2">{c.email}</span>
                    </div>
                    {c.company && <span className="text-xs text-gray-400">{c.company}</span>}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="sm:col-span-2 lg:col-span-3">
            <label className={labelClass}>Cím *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Pl. Weboldal fejlesztés ajánlat"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Ügyfél neve *</label>
            <input type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Pl. Kovács János" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Ügyfél email *</label>
            <input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="Pl. kovacs@ceg.hu" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Cégnév</label>
            <input type="text" value={clientCompany} onChange={(e) => setClientCompany(e.target.value)} placeholder="Pl. Példa Kft." className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Telefon</label>
            <input type="text" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder="+36 30 123 4567" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Cím</label>
            <input type="text" value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} placeholder="1234 Budapest, Példa u. 1." className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Adószám</label>
            <input type="text" value={clientTaxNumber} onChange={(e) => setClientTaxNumber(e.target.value)} placeholder="12345678-1-23" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Érvényesség</label>
            <input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Pénznem</label>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={inputClass}>
              <option value="HUF">HUF (Forint)</option>
              <option value="EUR">EUR (Euro)</option>
              <option value="USD">USD (Dollar)</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Nyelv / Language</label>
            <select value={language} onChange={(e) => setLanguage(e.target.value)} className={inputClass}>
              <option value="hu">Magyar (HU)</option>
              <option value="en">English (EN)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Intro text */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Bevezető szöveg</h2>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">Megjelenik az ajánlat első oldalon a tételek előtt.</p>
        <textarea
          value={introText}
          onChange={(e) => setIntroText(e.target.value)}
          rows={3}
          placeholder="Pl. Köszönjük az érdeklődést! Az alábbiakban részletezzük ajánlatunkat..."
          className={inputClass + " resize-none"}
        />
      </div>

      {/* Line items */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Tételek</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowSections(!showSections)}
              className={`text-xs px-3 py-1.5 rounded-lg transition border ${
                showSections
                  ? "border-[#198296] text-[#198296] bg-[#198296]/5"
                  : "border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-[#198296]"
              }`}
            >
              Szekciók
            </button>
          </div>
        </div>

        <div className="space-y-1">
          {items.map((item, idx) => {
            const isNewSection = showSections && idx > 0 && item.sectionName !== items[idx - 1]?.sectionName;

            return (
              <div key={idx}>
                {/* Section header */}
                {showSections && (idx === 0 || isNewSection) && (
                  <div className="flex items-center gap-2 pt-3 pb-1">
                    <input
                      type="text"
                      value={item.sectionName}
                      onChange={(e) => {
                        const oldSection = item.sectionName;
                        setItems((prev) =>
                          prev.map((it) =>
                            it.sectionName === oldSection ? { ...it, sectionName: e.target.value } : it
                          )
                        );
                      }}
                      placeholder="Szekció neve (pl. Fejlesztés)"
                      className="text-sm font-semibold bg-transparent border-b-2 border-[#198296] text-[#198296] outline-none px-1 py-0.5 w-64"
                    />
                  </div>
                )}

                {/* Item row */}
                <div className="grid grid-cols-12 gap-2 items-center py-1.5 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  {/* Move buttons */}
                  <div className="col-span-1 flex flex-col items-center gap-0.5">
                    <button onClick={() => moveItem(idx, -1)} className="text-gray-300 hover:text-gray-500 dark:hover:text-gray-300 transition" title="Fel">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
                    </button>
                    <button onClick={() => moveItem(idx, 1)} className="text-gray-300 hover:text-gray-500 dark:hover:text-gray-300 transition" title="Le">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                    </button>
                  </div>

                  {/* Description */}
                  <div className="col-span-3">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateItem(idx, "description", e.target.value)}
                      placeholder="Tétel leírása"
                      className={inputClass}
                    />
                  </div>

                  {/* Quantity */}
                  <div className="col-span-1">
                    <input
                      type="number"
                      min={0}
                      value={item.quantity}
                      onChange={(e) => updateItem(idx, "quantity", Number(e.target.value))}
                      className={inputClass + " text-right"}
                    />
                  </div>

                  {/* Unit */}
                  <div className="col-span-1">
                    <select value={item.unit} onChange={(e) => updateItem(idx, "unit", e.target.value)} className={inputClass}>
                      {unitOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>

                  {/* Unit price */}
                  <div className="col-span-2">
                    <input
                      type="number"
                      min={0}
                      value={item.unitPrice}
                      onChange={(e) => updateItem(idx, "unitPrice", Number(e.target.value))}
                      placeholder="Egységár"
                      className={inputClass + " text-right"}
                    />
                  </div>

                  {/* Tax */}
                  <div className="col-span-1">
                    <select value={item.taxRate} onChange={(e) => updateItem(idx, "taxRate", Number(e.target.value))} className={inputClass}>
                      <option value={27}>27%</option>
                      <option value={18}>18%</option>
                      <option value={5}>5%</option>
                      <option value={0}>0%</option>
                    </select>
                  </div>

                  {/* Brutto */}
                  <div className="col-span-2 text-right text-sm font-medium text-gray-900 dark:text-white">
                    {formatCurrency(calcLineBrutto(item), currency)}
                  </div>

                  {/* Actions */}
                  <div className="col-span-1 flex items-center gap-1 justify-end">
                    {/* Optional toggle */}
                    <button
                      onClick={() => updateItem(idx, "isOptional", !item.isOptional)}
                      className={`p-1 rounded transition text-xs ${
                        item.isOptional
                          ? "text-amber-500 bg-amber-50 dark:bg-amber-900/30"
                          : "text-gray-300 hover:text-amber-400"
                      }`}
                      title={item.isOptional ? "Kötelezővé tétel" : "Opcionálissá tétel"}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                    </button>

                    {/* Item discount */}
                    <button
                      onClick={() => {
                        if (item.discountType) {
                          updateItem(idx, "discount", 0);
                          updateItem(idx, "discountType", "");
                        } else {
                          updateItem(idx, "discountType", "percent");
                        }
                      }}
                      className={`p-1 rounded transition text-xs ${
                        item.discountType
                          ? "text-red-500 bg-red-50 dark:bg-red-900/30"
                          : "text-gray-300 hover:text-red-400"
                      }`}
                      title="Kedvezmény"
                    >
                      %
                    </button>

                    {/* Remove */}
                    <button
                      onClick={() => removeItem(idx)}
                      disabled={items.length <= 1}
                      className="text-gray-400 hover:text-red-500 disabled:opacity-30 transition p-1"
                      title="Sor törlése"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                </div>

                {/* Inline item discount */}
                {item.discountType && (
                  <div className="flex items-center gap-2 pl-12 pb-1">
                    <span className="text-xs text-red-500">Kedvezmény:</span>
                    <input
                      type="number"
                      min={0}
                      value={item.discount}
                      onChange={(e) => updateItem(idx, "discount", Number(e.target.value))}
                      className="w-20 px-2 py-1 border border-red-200 dark:border-red-800 rounded text-xs text-right bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none"
                    />
                    <select
                      value={item.discountType}
                      onChange={(e) => updateItem(idx, "discountType", e.target.value)}
                      className="px-2 py-1 border border-red-200 dark:border-red-800 rounded text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none"
                    >
                      <option value="percent">%</option>
                      <option value="fixed">{currency}</option>
                    </select>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex gap-2 mt-3">
          <button onClick={() => addItem(showSections && items.length > 0 ? items[items.length - 1].sectionName : "")} className="text-sm font-medium px-4 py-2 rounded-lg transition text-[#198296] hover:bg-[#198296]/5">
            + Sor hozzáadása
          </button>
          {showSections && (
            <button onClick={() => addItem("")} className="text-sm font-medium px-4 py-2 rounded-lg transition text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20">
              + Új szekció
            </button>
          )}
        </div>

        {/* Global discount */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Összesített kedvezmény</label>
            <select
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value)}
              className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none"
            >
              <option value="">Nincs</option>
              <option value="percent">Százalékos (%)</option>
              <option value="fixed">Fix összeg ({currency})</option>
            </select>
            {discountType && (
              <input
                type="number"
                min={0}
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
                className="w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm text-right bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none"
              />
            )}
          </div>
        </div>

        {/* Totals */}
        <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="flex flex-col items-end gap-1">
            <div className="flex justify-between w-full max-w-xs text-sm">
              <span className="text-gray-500 dark:text-gray-400">Nettó összeg:</span>
              <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(totalNetto, currency)}</span>
            </div>
            {discount > 0 && discountType && (
              <div className="flex justify-between w-full max-w-xs text-sm text-red-500">
                <span>Kedvezmény ({discountType === "percent" ? `${discount}%` : formatCurrency(discount, currency)}):</span>
                <span>-{formatCurrency(discountType === "percent" ? (activeItems.reduce((s, i) => s + calcLineNetto(i), 0) * discount / 100) : discount, currency)}</span>
              </div>
            )}
            <div className="flex justify-between w-full max-w-xs text-sm">
              <span className="text-gray-500 dark:text-gray-400">AFA:</span>
              <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(totalVat, currency)}</span>
            </div>
            <div className="flex justify-between w-full max-w-xs text-base border-t border-gray-200 dark:border-gray-700 pt-2 mt-1">
              <span className="font-semibold text-gray-900 dark:text-white">Bruttó összeg:</span>
              <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(totalBrutto, currency)}</span>
            </div>
            {optionalItems.length > 0 && (
              <div className="flex justify-between w-full max-w-xs text-sm mt-2 text-amber-600">
                <span>Opcionális tételek:</span>
                <span>{formatCurrency(optionalItems.reduce((s, i) => s + calcLineNetto(i), 0), currency)} netto</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Outro + notes */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Záró szöveg</label>
            <textarea
              value={outroText}
              onChange={(e) => setOutroText(e.target.value)}
              rows={3}
              placeholder="Pl. Reméljük ajánlatunk elnyerte tetszését. Kérjük, jelezze, ha kérdései vannak..."
              className={inputClass + " resize-none"}
            />
          </div>
          <div>
            <label className={labelClass}>Belső megjegyzés (nem jelenik meg a PDF-ben)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Belső megjegyzés..."
              className={inputClass + " resize-none"}
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          {!editId && templates.length > 0 && !showTemplates && (
            <button
              onClick={() => setShowTemplates(true)}
              className="px-4 py-2.5 rounded-lg text-sm font-medium text-[#198296] border border-[#198296] hover:bg-[#198296]/5 transition"
            >
              Sablon választás
            </button>
          )}
        </div>
        <div className="flex gap-3">
          <Link
            href="/quotes"
            className="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            Mégse
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="text-white px-6 py-2.5 rounded-lg text-sm font-medium transition disabled:opacity-50"
            style={{ backgroundColor: "#198296" }}
            onMouseEnter={(e) => { if (!saving) (e.target as HTMLElement).style.backgroundColor = "#0e5f6e"; }}
            onMouseLeave={(e) => { if (!saving) (e.target as HTMLElement).style.backgroundColor = "#198296"; }}
          >
            {saving ? "Mentés..." : editId ? "Ajánlat frissítése" : "Ajánlat mentése"}
          </button>
        </div>
      </div>
    </div>
  );
}
