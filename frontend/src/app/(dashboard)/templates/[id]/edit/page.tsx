"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { sanitizeHtml } from "@/lib/sanitize";
import WysiwygEditor from "@/components/wysiwyg-editor";
import { useI18n } from "@/lib/i18n";

type VariableGroup = "sender" | "receiver" | "contract";

interface Variable {
  name: string;
  label: string;
  type: string;
  required: boolean;
  group: VariableGroup;
  options?: string;
}

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

export default function EditTemplatePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { t } = useI18n();

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("munkajogi");
  const [description, setDescription] = useState("");
  const [contentHtml, setContentHtml] = useState("");
  const [contentHtmlEn, setContentHtmlEn] = useState("");
  const [legalBasis, setLegalBasis] = useState("");
  const [variables, setVariables] = useState<Variable[]>([]);
  const [contentLang, setContentLang] = useState<"hu" | "en">("hu");
  const [showPreview, setShowPreview] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [versions, setVersions] = useState<{ id: string; version: number; changeNote: string | null; createdAt: string }[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);

  const categoryOptions = [
    { value: "munkajogi", label: t("templateEdit.categoryLabels.munkajogi") },
    { value: "b2b", label: t("templateEdit.categoryLabels.b2b") },
    { value: "ingatlan", label: t("templateEdit.categoryLabels.ingatlan") },
    { value: "fogyasztoi", label: t("templateEdit.categoryLabels.fogyasztoi") },
    { value: "it", label: t("templateEdit.categoryLabels.it") },
    { value: "szolgaltatasi", label: t("templateEdit.categoryLabels.szolgaltatasi") },
    { value: "egyeb", label: t("templateEdit.categoryLabels.egyeb") },
  ];

  const fieldTypeOptions = [
    { value: "text", label: t("templateEdit.fieldTypes.text") },
    { value: "textarea", label: t("templateEdit.fieldTypes.textarea") },
    { value: "number", label: t("templateEdit.fieldTypes.number") },
    { value: "date", label: t("templateEdit.fieldTypes.date") },
    { value: "select", label: t("templateEdit.fieldTypes.select") },
    { value: "checkbox", label: t("templateEdit.fieldTypes.checkbox") },
    { value: "receiver_fills", label: t("templateEdit.fieldTypes.receiver_fills") },
    { value: "attachment", label: t("templateEdit.fieldTypes.attachment") },
  ];

  const groupLabels: Record<VariableGroup, string> = {
    sender: t("templateEdit.senderFields"),
    receiver: t("templateEdit.receiverFields"),
    contract: t("templateEdit.contractFields"),
  };

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    loadTemplate();
  }, [id]);
  /* eslint-enable react-hooks/exhaustive-deps */

  const loadTemplate = async () => {
    try {
      const res = await api.get(`/templates/${id}`);
      const tpl = res.data.data;
      setName(tpl.name);
      setCategory(tpl.category);
      setDescription(tpl.description ?? "");
      setContentHtml(tpl.contentHtml);
      setContentHtmlEn(tpl.contentHtmlEn ?? "");
      setLegalBasis(tpl.legalBasis ?? "");
      // Migrate old variables without group
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const vars = (tpl.variables ?? []).map((v: any) => ({
        ...v,
        group: v.group || "contract",
        options: v.options || "",
      }));
      setVariables(vars);
    } catch {
      toast.error(t("templateEdit.loadError"));
      router.push("/templates");
    } finally {
      setLoading(false);
    }
  };

  const addVariable = (group: VariableGroup) => {
    setVariables([
      ...variables,
      { name: "", label: "", type: "text", required: false, group, options: "" },
    ]);
  };

  const updateVariable = (index: number, field: keyof Variable, value: string | boolean) => {
    const updated = [...variables];
    const v = { ...updated[index], [field]: value };
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
    navigator.clipboard.writeText(`!!${varName}!!`);
    toast.success(`!!${varName}!! ${t("templateEdit.copiedToClipboard")}`);
  };

  const handleSave = async () => {
    if (!name.trim() || !contentHtml.trim()) {
      toast.error(t("templateEdit.nameRequired"));
      return;
    }
    setSaving(true);
    try {
      await api.put(`/templates/${id}`, {
        name,
        category,
        description: description || undefined,
        contentHtml,
        contentHtmlEn: contentHtmlEn || undefined,
        variables,
        legalBasis: legalBasis || undefined,
      });
      toast.success(t("templateEdit.saveSuccess"));
      router.push("/templates");
    } catch (err: unknown) {
      const axiosMsg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      toast.error(axiosMsg ?? t("templateEdit.saveError"));
    } finally {
      setSaving(false);
    }
  };

  const renderPreview = () => {
    let html = contentLang === "en" ? contentHtmlEn : contentHtml;
    for (const v of variables) {
      if (v.name) {
        const color = v.group === "sender" ? "#dbeafe" : v.group === "receiver" ? "#f3e8ff" : "#fef3c7";
        // Support both old {{}} and new !! formats
        html = html.replaceAll(
          `{{${v.name}}}`,
          `<span style="background:${color};padding:1px 6px;border-radius:4px;font-weight:600;font-size:0.85em;">${v.label || v.name}</span>`
        );
        html = html.replaceAll(
          `!!${v.name}!!`,
          `<span style="background:${color};padding:1px 6px;border-radius:4px;font-weight:600;font-size:0.85em;">${v.label || v.name}</span>`
        );
      }
    }
    return html;
  };

  const loadVersions = async () => {
    setVersionsLoading(true);
    try {
      const res = await api.get(`/templates/${id}/versions`);
      setVersions(res.data.data ?? []);
      setShowVersions(true);
    } catch {
      toast.error(t("templateEdit.versionsLoadError"));
    } finally {
      setVersionsLoading(false);
    }
  };

  const handleRevert = async (versionId: string) => {
    if (!confirm(t("templateEdit.revertConfirm"))) return;
    try {
      await api.post(`/templates/${id}/revert/${versionId}`);
      toast.success(t("templateEdit.revertSuccess"));
      setShowVersions(false);
      await loadTemplate();
    } catch {
      toast.error(t("templateEdit.revertError"));
    }
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
            <span className="text-xs text-gray-400">{groupVars.length} {t("templateEdit.fieldCount")}</span>
          </div>
          <button
            type="button"
            onClick={() => addVariable(group)}
            className="text-sm font-medium text-[#198296] hover:text-[#146d7d] flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            {t("templateEdit.addField")}
          </button>
        </div>

        {groupVars.length === 0 ? (
          <div className="px-5 py-4 text-sm text-gray-400 bg-white">
            {t("templateEdit.noFields")}
          </div>
        ) : (
          <div className="bg-white">
            <div className="grid grid-cols-[1fr_160px_180px_auto] gap-3 px-5 py-2 bg-gray-50 border-b text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <span>{t("templateEdit.fieldName")}</span>
              <span>{t("templateEdit.fieldType")}</span>
              <span>{t("templateEdit.placeholder")}</span>
              <span className="text-right">{t("templateEdit.actions")}</span>
            </div>

            {groupVars.map((v) => (
              <div
                key={v.originalIndex}
                className="grid grid-cols-[1fr_160px_180px_auto] gap-3 px-5 py-2.5 border-b last:border-b-0 items-center hover:bg-gray-50/50 transition-colors"
              >
                <input
                  type="text"
                  value={v.label}
                  onChange={(e) => updateVariable(v.originalIndex, "label", e.target.value)}
                  placeholder={t("templateEdit.fieldNamePlaceholder")}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:border-[#198296] focus:ring-1 focus:ring-[#198296]/20 outline-none"
                />
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
                <div className="flex items-center gap-1.5">
                  <code className="flex-1 px-2.5 py-1.5 bg-gray-100 border border-gray-200 rounded-lg text-xs font-mono text-gray-600 truncate">
                    {v.name ? `!!${v.name}!!` : "..."}
                  </code>
                  {v.name && (
                    <button
                      type="button"
                      onClick={() => insertPlaceholder(v.name)}
                      title={t("templateEdit.copyToClipboard")}
                      className="p-1 text-gray-400 hover:text-[#198296] transition-colors flex-shrink-0"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1.5 justify-end">
                  <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer" title={t("templateEdit.required")}>
                    <input
                      type="checkbox"
                      checked={v.required}
                      onChange={(e) => updateVariable(v.originalIndex, "required", e.target.checked)}
                      className="rounded border-gray-300 text-[#198296] focus:ring-[#198296]/30 w-3.5 h-3.5"
                    />
                    {t("templateEdit.required")}
                  </label>
                  <button
                    type="button"
                    onClick={() => removeVariable(v.originalIndex)}
                    className="p-1 text-gray-300 hover:text-red-500 transition-colors"
                    title={t("common.delete")}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}

            {groupVars.filter((v) => v.type === "select").map((v) => (
              <div key={`opts-${v.originalIndex}`} className="px-5 py-2 bg-gray-50 border-t">
                <label className="text-xs font-medium text-gray-500 mb-1 block">
                  {t("templateEdit.selectOptions")}: {v.label || v.name} ({t("templateEdit.selectOptionsHelp")})
                </label>
                <input
                  type="text"
                  value={v.options || ""}
                  onChange={(e) => updateVariable(v.originalIndex, "options", e.target.value)}
                  placeholder={t("templateEdit.selectOptionsPlaceholder")}
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:border-[#198296] focus:ring-1 focus:ring-[#198296]/20 outline-none"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-teal-dark" />
      </div>
    );
  }

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
          <h1 className="text-lg font-bold text-gray-900">{t("templateEdit.pageTitle")}</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadVersions}
            disabled={versionsLoading}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {versionsLoading ? t("templateEdit.versionsLoading") : t("templateEdit.versionsBtn")}
          </button>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
              showPreview
                ? "bg-[#198296]/10 border-[#198296]/30 text-[#198296]"
                : "border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {showPreview ? t("templateEdit.editor") : t("templateEdit.preview")}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-[#198296] text-white rounded-lg text-sm font-semibold hover:bg-[#146d7d] disabled:opacity-50 transition-colors shadow-sm"
          >
            {saving ? t("templateEdit.saving") : t("templateEdit.saveChanges")}
          </button>
        </div>
      </div>

      {/* Versions Panel */}
      {showVersions && (
        <div className="mb-6 bg-white rounded-2xl border p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">{t("templateEdit.versionHistory")}</h2>
            <button onClick={() => setShowVersions(false)} className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {versions.length === 0 ? (
            <p className="text-sm text-gray-400">{t("templateEdit.noVersions")}</p>
          ) : (
            <div className="space-y-2">
              {versions.map((v) => (
                <div key={v.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div>
                    <span className="font-medium text-gray-900 text-sm">v{v.version}</span>
                    {v.changeNote && (
                      <span className="text-sm text-gray-500 ml-2">- {v.changeNote}</span>
                    )}
                    <span className="text-xs text-gray-400 ml-3">
                      {new Date(v.createdAt).toLocaleString("hu-HU")}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRevert(v.id)}
                    className="text-sm font-medium px-3 py-1 rounded-lg text-white bg-[#198296] hover:bg-[#146d7d] transition"
                  >
                    {t("templateEdit.revert")}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showPreview ? (
        <div className="bg-white rounded-2xl border p-8">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
            {t("templateEdit.preview")}
          </h2>
          <div
            className="prose prose-sm max-w-none border rounded-xl p-6 bg-gray-50 min-h-[400px]"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(renderPreview()) }}
          />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Metadata */}
          <div className="bg-white rounded-2xl border p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">{t("templateEdit.metadata")}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("templateEdit.templateName")}</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-[#198296] focus:ring-2 focus:ring-[#198296]/10 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("templateEdit.category")}</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-[#198296] focus:ring-2 focus:ring-[#198296]/10 outline-none bg-white transition-all"
                >
                  {categoryOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("templateEdit.descriptionLabel")}</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t("templateEdit.descriptionPlaceholder")}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-[#198296] focus:ring-2 focus:ring-[#198296]/10 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("templateEdit.legalBasis")}</label>
                <input
                  type="text"
                  value={legalBasis}
                  onChange={(e) => setLegalBasis(e.target.value)}
                  placeholder={t("templateEdit.legalBasisPlaceholder")}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-[#198296] focus:ring-2 focus:ring-[#198296]/10 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Content editor */}
          <div className="bg-white rounded-2xl border p-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">{t("templateEdit.content")}</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {t("templateEdit.contentHelp")} <code className="bg-gray-100 px-1 rounded">!!nev!!</code> {t("templateEdit.contentHelpFormat")}
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
                  {t("templateEdit.hungarian")}
                </button>
                <button
                  type="button"
                  onClick={() => setContentLang("en")}
                  className={`px-3.5 py-1 rounded-md text-xs font-medium transition ${
                    contentLang === "en" ? "bg-white text-[#198296] shadow-sm" : "text-gray-500"
                  }`}
                >
                  {t("templateEdit.english")}
                </button>
              </div>
            </div>

            {contentLang === "hu" ? (
              <WysiwygEditor
                value={contentHtml}
                onChange={setContentHtml}
                placeholder={t("templateEdit.huPlaceholder")}
                variables={variableNames}
              />
            ) : (
              <WysiwygEditor
                value={contentHtmlEn}
                onChange={setContentHtmlEn}
                placeholder={t("templateEdit.enPlaceholder")}
                variables={variableNames}
              />
            )}
          </div>

          {/* Variables */}
          <div className="bg-white rounded-2xl border p-6">
            <div className="mb-5">
              <h2 className="text-sm font-semibold text-gray-900">{t("templateEdit.variables")}</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {t("templateEdit.variablesHelp")}
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
