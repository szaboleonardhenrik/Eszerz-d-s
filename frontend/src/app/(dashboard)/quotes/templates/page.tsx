"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import toast from "react-hot-toast";

interface TemplateItem {
  description: string;
  quantity: number;
  unitPrice: number;
  unit: string;
  taxRate: number;
  sectionName?: string;
  isOptional?: boolean;
}

interface TemplateVariable {
  key: string;
  label: string;
  type: string;
  defaultValue: string;
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
  isPublic: boolean;
  createdAt: string;
}

const categoryLabels: Record<string, string> = {
  altalanos: "Általános",
  it: "IT / Szoftverfejlesztés",
  marketing: "Marketing",
  epiteszet: "Építészet",
  tanacsadas: "Tanácsadás",
  design: "Design",
  oktatas: "Oktatás",
  karbantartas: "Karbantartás",
};

const categoryOptions = Object.entries(categoryLabels);

const emptyItem: TemplateItem = { description: "", quantity: 1, unitPrice: 0, unit: "db", taxRate: 27 };
const emptyVar: TemplateVariable = { key: "", label: "", type: "text", defaultValue: "" };

export default function QuoteTemplatesPage() {
  const [templates, setTemplates] = useState<QuoteTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("altalanos");
  const [currency, setCurrency] = useState("HUF");
  const [introText, setIntroText] = useState("");
  const [outroText, setOutroText] = useState("");
  const [items, setItems] = useState<TemplateItem[]>([{ ...emptyItem }]);
  const [variables, setVariables] = useState<TemplateVariable[]>([]);

  useEffect(() => { loadTemplates(); }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const res = await api.get("/quotes/templates");
      setTemplates(res.data.data ?? []);
    } catch {
      toast.error("Hiba a sablonok betöltésekor");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName(""); setDescription(""); setCategory("altalanos"); setCurrency("HUF");
    setIntroText(""); setOutroText(""); setItems([{ ...emptyItem }]); setVariables([]);
    setEditId(null);
  };

  const openEdit = (t: QuoteTemplate) => {
    setEditId(t.id);
    setName(t.name);
    setDescription(t.description ?? "");
    setCategory(t.category);
    setCurrency(t.currency);
    setIntroText(t.introText ?? "");
    setOutroText(t.outroText ?? "");
    try { setItems(JSON.parse(t.itemsJson)); } catch { setItems([{ ...emptyItem }]); }
    try { setVariables(t.variables ? JSON.parse(t.variables) : []); } catch { setVariables([]); }
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!name.trim()) { toast.error("A sablon neve kötelező"); return; }
    if (items.length === 0 || items.every((i) => !i.description.trim())) { toast.error("Legalább egy tétel szükséges"); return; }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        category,
        currency,
        introText: introText.trim() || undefined,
        outroText: outroText.trim() || undefined,
        itemsJson: JSON.stringify(items.filter((i) => i.description.trim())),
        variables: variables.length > 0 ? JSON.stringify(variables.filter((v) => v.key.trim())) : undefined,
      };

      if (editId) {
        await api.put(`/quotes/templates/${editId}`, payload);
        toast.success("Sablon frissítve!");
      } else {
        await api.post("/quotes/templates", payload);
        toast.success("Sablon létrehozva!");
      }
      resetForm();
      setShowForm(false);
      loadTemplates();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message ?? "Hiba a mentés során");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Biztosan törli a sablont?")) return;
    try {
      await api.delete(`/quotes/templates/${id}`);
      toast.success("Sablon törölve!");
      loadTemplates();
    } catch {
      toast.error("Hiba a törléskor");
    }
  };

  const inputClass = "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#198296]";
  const labelClass = "block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1";

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link href="/quotes" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">&larr; Ajánlatok</Link>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ajánlat sablonok</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Készíts előre konfigurált sablonokat a gyorsabb ajánlatadás érdekében.</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="text-white px-5 py-2.5 rounded-lg font-medium transition text-sm"
          style={{ backgroundColor: "#198296" }}
        >
          {showForm ? "Mégse" : "+ Új sablon"}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{editId ? "Sablon szerkesztése" : "Új sablon"}</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div className="sm:col-span-2 lg:col-span-3">
              <label className={labelClass}>Sablon neve *</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Pl. Webfejlesztés ajánlat" className={inputClass} />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className={labelClass}>Leírás</label>
              <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Rövid leírás a sablonról" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Kategória</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
                {categoryOptions.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Pénznem</label>
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={inputClass}>
                <option value="HUF">HUF</option>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>

          {/* Intro/Outro */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div>
              <label className={labelClass}>Bevezető szöveg</label>
              <textarea value={introText} onChange={(e) => setIntroText(e.target.value)} rows={3} placeholder="Bevezető szöveg a tételsor előtt..." className={inputClass + " resize-none"} />
            </div>
            <div>
              <label className={labelClass}>Záró szöveg</label>
              <textarea value={outroText} onChange={(e) => setOutroText(e.target.value)} rows={3} placeholder="Záró szöveg a tételsor után..." className={inputClass + " resize-none"} />
            </div>
          </div>

          {/* Template items */}
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Alap tételek</h3>
          <div className="space-y-2 mb-4">
            {items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-4">
                  <input type="text" value={item.description} onChange={(e) => setItems((p) => p.map((it, i) => i === idx ? { ...it, description: e.target.value } : it))} placeholder="Tétel leírása" className={inputClass} />
                </div>
                <div className="col-span-1">
                  <input type="number" min={0} value={item.quantity} onChange={(e) => setItems((p) => p.map((it, i) => i === idx ? { ...it, quantity: Number(e.target.value) } : it))} className={inputClass + " text-right"} />
                </div>
                <div className="col-span-2">
                  <input type="number" min={0} value={item.unitPrice} onChange={(e) => setItems((p) => p.map((it, i) => i === idx ? { ...it, unitPrice: Number(e.target.value) } : it))} placeholder="Ár" className={inputClass + " text-right"} />
                </div>
                <div className="col-span-1">
                  <select value={item.unit} onChange={(e) => setItems((p) => p.map((it, i) => i === idx ? { ...it, unit: e.target.value } : it))} className={inputClass}>
                    <option value="db">db</option>
                    <option value="ora">ora</option>
                    <option value="honap">honap</option>
                    <option value="nap">nap</option>
                    <option value="projekt">projekt</option>
                  </select>
                </div>
                <div className="col-span-1">
                  <select value={item.taxRate} onChange={(e) => setItems((p) => p.map((it, i) => i === idx ? { ...it, taxRate: Number(e.target.value) } : it))} className={inputClass}>
                    <option value={27}>27%</option>
                    <option value={18}>18%</option>
                    <option value={5}>5%</option>
                    <option value={0}>0%</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <input type="text" value={item.sectionName ?? ""} onChange={(e) => setItems((p) => p.map((it, i) => i === idx ? { ...it, sectionName: e.target.value } : it))} placeholder="Szekció" className={inputClass} />
                </div>
                <div className="col-span-1 flex justify-end">
                  <button onClick={() => items.length > 1 && setItems((p) => p.filter((_, i) => i !== idx))} disabled={items.length <= 1} className="text-gray-400 hover:text-red-500 disabled:opacity-30 p-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => setItems((p) => [...p, { ...emptyItem }])} className="text-sm font-medium px-4 py-1.5 rounded-lg text-[#198296] hover:bg-[#198296]/5 transition mb-6">+ Tétel hozzáadása</button>

          {/* Variables */}
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Változók</h3>
          <p className="text-xs text-gray-400 mb-3">Használja a {"{{valtozo_kulcs}}"} formában a leírásokban, bevezető/záró szövegben. Ajánlat létrehozásakor a felhasználó kitölti őket.</p>
          <div className="space-y-2 mb-4">
            {variables.map((v, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-3">
                  <input type="text" value={v.key} onChange={(e) => setVariables((p) => p.map((vv, i) => i === idx ? { ...vv, key: e.target.value.replace(/\s/g, "_") } : vv))} placeholder="kulcs (pl. projekt_nev)" className={inputClass} />
                </div>
                <div className="col-span-3">
                  <input type="text" value={v.label} onChange={(e) => setVariables((p) => p.map((vv, i) => i === idx ? { ...vv, label: e.target.value } : vv))} placeholder="Megjelenő név" className={inputClass} />
                </div>
                <div className="col-span-2">
                  <select value={v.type} onChange={(e) => setVariables((p) => p.map((vv, i) => i === idx ? { ...vv, type: e.target.value } : vv))} className={inputClass}>
                    <option value="text">Szöveg</option>
                    <option value="number">Szám</option>
                    <option value="date">Dátum</option>
                  </select>
                </div>
                <div className="col-span-3">
                  <input type="text" value={v.defaultValue} onChange={(e) => setVariables((p) => p.map((vv, i) => i === idx ? { ...vv, defaultValue: e.target.value } : vv))} placeholder="Alapérték" className={inputClass} />
                </div>
                <div className="col-span-1 flex justify-end">
                  <button onClick={() => setVariables((p) => p.filter((_, i) => i !== idx))} className="text-gray-400 hover:text-red-500 p-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => setVariables((p) => [...p, { ...emptyVar }])} className="text-sm font-medium px-4 py-1.5 rounded-lg text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition mb-6">+ Változó hozzáadása</button>

          {/* Save */}
          <div className="flex justify-end gap-3 border-t border-gray-200 dark:border-gray-700 pt-4">
            <button onClick={() => { setShowForm(false); resetForm(); }} className="px-5 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
              Mégse
            </button>
            <button onClick={handleSave} disabled={saving} className="text-white px-6 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50" style={{ backgroundColor: "#198296" }}>
              {saving ? "Mentés..." : editId ? "Sablon frissítése" : "Sablon mentése"}
            </button>
          </div>
        </div>
      )}

      {/* Template list */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 animate-pulse">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : templates.length === 0 && !showForm ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-300 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Nincsenek sablonok</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Hozz létre egy sablont a gyorsabb ajánlatadás érdekében.</p>
          <button onClick={() => setShowForm(true)} className="text-white px-5 py-2.5 rounded-lg font-medium text-sm" style={{ backgroundColor: "#198296" }}>+ Új sablon</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((t) => {
            let itemCount = 0;
            try { itemCount = JSON.parse(t.itemsJson).length; } catch { /* ignore */ }
            let varCount = 0;
            try { varCount = t.variables ? JSON.parse(t.variables).length : 0; } catch { /* ignore */ }

            return (
              <div key={t.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:border-[#198296] transition">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{t.name}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {categoryLabels[t.category] ?? t.category}
                  </span>
                </div>
                {t.description && <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{t.description}</p>}
                <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                  <span>{itemCount} tétel</span>
                  {varCount > 0 && <span>{varCount} változó</span>}
                  <span>{t.currency}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(t)} className="text-xs px-3 py-1.5 rounded-lg text-[#198296] border border-[#198296]/30 hover:bg-[#198296]/5 transition">Szerkesztés</button>
                  <button onClick={() => handleDelete(t.id)} className="text-xs px-3 py-1.5 rounded-lg text-red-500 border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 transition">Törlés</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
