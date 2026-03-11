"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { sanitizeHtml } from "@/lib/sanitize";
import WysiwygEditor from "@/components/wysiwyg-editor";

const categoryOptions = [
  { value: "munkajogi", label: "Munkajogi" },
  { value: "b2b", label: "Vállalati B2B" },
  { value: "ingatlan", label: "Ingatlan" },
  { value: "fogyasztoi", label: "Fogyasztói" },
  { value: "it", label: "IT / Szoftver" },
  { value: "szolgaltatasi", label: "Szolgáltatási" },
  { value: "egyeb", label: "Egyéb" },
];

const fieldTypeOptions = [
  { value: "text", label: "Egysoros szövegmező" },
  { value: "textarea", label: "Többsoros szövegmező" },
  { value: "number", label: "Szám" },
  { value: "date", label: "Dátum" },
  { value: "select", label: "Legördülő lista" },
  { value: "checkbox", label: "Jelölőnégyzet" },
  { value: "receiver_fills", label: "Fogadó fél tölti ki" },
  { value: "attachment", label: "Csatolmány" },
];

type VariableGroup = "sender" | "receiver" | "contract";

interface Variable {
  name: string;
  label: string;
  type: string;
  required: boolean;
  group: VariableGroup;
  options?: string; // for select type: comma separated
}

const groupLabels: Record<VariableGroup, string> = {
  sender: "Küldő fél adatai",
  receiver: "Fogadó fél adatai",
  contract: "Szerződéses változók",
};

const groupColors: Record<VariableGroup, { bg: string; border: string; badge: string }> = {
  sender: { bg: "bg-blue-50", border: "border-blue-200", badge: "bg-blue-100 text-blue-700" },
  receiver: { bg: "bg-purple-50", border: "border-purple-200", badge: "bg-purple-100 text-purple-700" },
  contract: { bg: "bg-amber-50", border: "border-amber-200", badge: "bg-amber-100 text-amber-700" },
};

function toPlaceholder(label: string): string {
  return label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

export default function NewTemplatePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("munkajogi");
  const [description, setDescription] = useState("");
  const [contentHtml, setContentHtml] = useState("");
  const [contentHtmlEn, setContentHtmlEn] = useState("");
  const [legalBasis, setLegalBasis] = useState("");
  const [variables, setVariables] = useState<Variable[]>([]);
  const [contentLang, setContentLang] = useState<"hu" | "en">("hu");
  const [showPreview, setShowPreview] = useState(false);

  const addVariable = (group: VariableGroup) => {
    setVariables([
      ...variables,
      { name: "", label: "", type: "text", required: false, group, options: "" },
    ]);
  };

  const updateVariable = (index: number, field: keyof Variable, value: string | boolean) => {
    const updated = [...variables];
    const v = { ...updated[index], [field]: value };
    // Auto-generate placeholder name from label
    if (field === "label" && typeof value === "string") {
      v.name = toPlaceholder(value);
    }
    updated[index] = v;
    setVariables(updated);
  };

  const removeVariable = (index: number) => {
    setVariables(variables.filter((_, i) => i !== index));
  };

  const insertPlaceholder = (varName: string) => {
    // Insert at cursor in the WYSIWYG editor — handled by the editor's variable dropdown
    // This copies to clipboard as fallback
    navigator.clipboard.writeText(`!!${varName}!!`);
    toast.success(`!!${varName}!! vágólapra másolva`);
  };

  const handleSave = async () => {
    if (!name.trim() || !contentHtml.trim()) {
      toast.error("A név és a tartalom megadása kötelező");
      return;
    }
    setSaving(true);
    try {
      await api.post("/templates", {
        name,
        category,
        description: description || undefined,
        contentHtml,
        contentHtmlEn: contentHtmlEn || undefined,
        variables,
        legalBasis: legalBasis || undefined,
      });
      toast.success("Sablon sikeresen létrehozva");
      router.push("/templates");
    } catch {
      toast.error("Hiba a sablon mentése közben");
    } finally {
      setSaving(false);
    }
  };

  const renderPreview = () => {
    let html = contentLang === "en" ? contentHtmlEn : contentHtml;
    for (const v of variables) {
      if (v.name) {
        const color = v.group === "sender" ? "#dbeafe" : v.group === "receiver" ? "#f3e8ff" : "#fef3c7";
        html = html.replaceAll(
          `!!${v.name}!!`,
          `<span style="background:${color};padding:1px 6px;border-radius:4px;font-weight:600;font-size:0.85em;">${v.label || v.name}</span>`
        );
      }
    }
    return html;
  };

  const variableNames = variables.filter((v) => v.name).map((v) => v.name);

  const renderVariableGroup = (group: VariableGroup) => {
    const groupVars = variables
      .map((v, i) => ({ ...v, originalIndex: i }))
      .filter((v) => v.group === group);
    const colors = groupColors[group];

    return (
      <div key={group} className={`rounded-xl border ${colors.border} overflow-hidden`}>
        <div className={`${colors.bg} px-5 py-3 flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold ${colors.badge}`}>
              {groupLabels[group]}
            </span>
            <span className="text-xs text-gray-400">{groupVars.length} mező</span>
          </div>
          <button
            type="button"
            onClick={() => addVariable(group)}
            className="text-sm font-medium text-[#198296] hover:text-[#146d7d] flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Mező hozzáadása
          </button>
        </div>

        {groupVars.length === 0 ? (
          <div className="px-5 py-4 text-sm text-gray-400 bg-white">
            Még nincsenek mezők. Kattintson a &quot;Mező hozzáadása&quot; gombra.
          </div>
        ) : (
          <div className="bg-white">
            {/* Table header */}
            <div className="grid grid-cols-[1fr_160px_180px_auto] gap-3 px-5 py-2 bg-gray-50 border-b text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <span>Mező megnevezése</span>
              <span>Mező típusa</span>
              <span>Helyettesítő szöveg</span>
              <span className="text-right">Műveletek</span>
            </div>

            {/* Rows */}
            {groupVars.map((v) => (
              <div
                key={v.originalIndex}
                className="grid grid-cols-[1fr_160px_180px_auto] gap-3 px-5 py-2.5 border-b last:border-b-0 items-center hover:bg-gray-50/50 transition-colors"
              >
                {/* Label */}
                <input
                  type="text"
                  value={v.label}
                  onChange={(e) => updateVariable(v.originalIndex, "label", e.target.value)}
                  placeholder="pl. Diák neve"
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:border-[#198296] focus:ring-1 focus:ring-[#198296]/20 outline-none"
                />

                {/* Type */}
                <select
                  value={v.type}
                  onChange={(e) => updateVariable(v.originalIndex, "type", e.target.value)}
                  className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:border-[#198296] focus:ring-1 focus:ring-[#198296]/20 outline-none bg-white"
                >
                  {fieldTypeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                {/* Placeholder */}
                <div className="flex items-center gap-1.5">
                  <code className="flex-1 px-2.5 py-1.5 bg-gray-100 border border-gray-200 rounded-lg text-xs font-mono text-gray-600 truncate">
                    {v.name ? `!!${v.name}!!` : "..."}
                  </code>
                  {v.name && (
                    <button
                      type="button"
                      onClick={() => insertPlaceholder(v.name)}
                      title="Másolás vágólapra"
                      className="p-1 text-gray-400 hover:text-[#198296] transition-colors flex-shrink-0"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 justify-end">
                  <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer" title="Kötelező mező">
                    <input
                      type="checkbox"
                      checked={v.required}
                      onChange={(e) => updateVariable(v.originalIndex, "required", e.target.checked)}
                      className="rounded border-gray-300 text-[#198296] focus:ring-[#198296]/30 w-3.5 h-3.5"
                    />
                    Köt.
                  </label>
                  <button
                    type="button"
                    onClick={() => removeVariable(v.originalIndex)}
                    className="p-1 text-gray-300 hover:text-red-500 transition-colors"
                    title="Törlés"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}

            {/* Select options row if any select type */}
            {groupVars.filter((v) => v.type === "select").map((v) => (
              <div key={`opts-${v.originalIndex}`} className="px-5 py-2 bg-gray-50 border-t">
                <label className="text-xs font-medium text-gray-500 mb-1 block">
                  Legördülő opciók: {v.label || v.name} (vesszővel elválasztva)
                </label>
                <input
                  type="text"
                  value={v.options || ""}
                  onChange={(e) => updateVariable(v.originalIndex, "options", e.target.value)}
                  placeholder="pl. 1500 Ft, 2000 Ft, 2500 Ft, 3000 Ft"
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:border-[#198296] focus:ring-1 focus:ring-[#198296]/20 outline-none"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      {/* Sticky header with save */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/templates")}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-gray-900">Új sablon létrehozása</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
              showPreview
                ? "bg-[#198296]/10 border-[#198296]/30 text-[#198296]"
                : "border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {showPreview ? "Szerkesztő" : "Előnézet"}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-[#198296] text-white rounded-lg text-sm font-semibold hover:bg-[#146d7d] disabled:opacity-50 transition-colors shadow-sm"
          >
            {saving ? "Mentés..." : "Sablon mentése"}
          </button>
        </div>
      </div>

      {showPreview ? (
        /* ── PREVIEW MODE ── */
        <div className="bg-white rounded-2xl border p-8">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
            Előnézet
          </h2>
          <div
            className="prose prose-sm max-w-none border rounded-xl p-6 bg-gray-50 min-h-[400px]"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(renderPreview()) }}
          />
        </div>
      ) : (
        /* ── EDITOR MODE ── */
        <div className="space-y-6">
          {/* Metadata */}
          <div className="bg-white rounded-2xl border p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Alapadatok</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sablon neve *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="pl. Diákmunka szerződés"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-[#198296] focus:ring-2 focus:ring-[#198296]/10 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kategória
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-[#198296] focus:ring-2 focus:ring-[#198296]/10 outline-none bg-white transition-all"
                >
                  {categoryOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Leírás
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Rövid leírás a sablonról..."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-[#198296] focus:ring-2 focus:ring-[#198296]/10 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jogi alap
                </label>
                <input
                  type="text"
                  value={legalBasis}
                  onChange={(e) => setLegalBasis(e.target.value)}
                  placeholder="pl. Ptk. 6:58. §"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-[#198296] focus:ring-2 focus:ring-[#198296]/10 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Content editor */}
          <div className="bg-white rounded-2xl border p-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Tartalom *</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Írja vagy illessze be a szöveget. Változókat a <code className="bg-gray-100 px-1 rounded">!!nev!!</code> formátumban illessze be, vagy használja a változó gombot.
                </p>
              </div>
              <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => setContentLang("hu")}
                  className={`px-3.5 py-1 rounded-md text-xs font-medium transition ${
                    contentLang === "hu" ? "bg-white text-[#198296] shadow-sm" : "text-gray-500"
                  }`}
                >
                  Magyar
                </button>
                <button
                  type="button"
                  onClick={() => setContentLang("en")}
                  className={`px-3.5 py-1 rounded-md text-xs font-medium transition ${
                    contentLang === "en" ? "bg-white text-[#198296] shadow-sm" : "text-gray-500"
                  }`}
                >
                  English
                </button>
              </div>
            </div>

            {contentLang === "hu" ? (
              <WysiwygEditor
                value={contentHtml}
                onChange={setContentHtml}
                placeholder="Illessze be a szerződés szövegét vagy kezdjen el írni..."
                variables={variableNames}
              />
            ) : (
              <WysiwygEditor
                value={contentHtmlEn}
                onChange={setContentHtmlEn}
                placeholder="Paste or type the English version..."
                variables={variableNames}
              />
            )}
          </div>

          {/* Variables */}
          <div className="bg-white rounded-2xl border p-6">
            <div className="mb-5">
              <h2 className="text-sm font-semibold text-gray-900">Változók</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Adja meg a kitöltendő mezőket. A rendszer automatikusan generálja a helyettesítő szöveget a megnevezésből.
              </p>
            </div>

            <div className="space-y-5">
              {(["sender", "receiver", "contract"] as VariableGroup[]).map(renderVariableGroup)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
