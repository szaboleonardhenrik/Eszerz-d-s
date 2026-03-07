"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { sanitizeHtml } from "@/lib/sanitize";

const categoryOptions = [
  { value: "munkajogi", label: "Munkajogi" },
  { value: "b2b", label: "Vallalati B2B" },
  { value: "ingatlan", label: "Ingatlan" },
  { value: "fogyasztoi", label: "Fogyasztoi" },
];

interface Variable {
  name: string;
  label: string;
  type: string;
  required: boolean;
}

export default function EditTemplatePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

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
  const [showVersions, setShowVersions] = useState(false);
  const [versions, setVersions] = useState<{ id: string; version: number; changeNote: string | null; createdAt: string }[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);

  useEffect(() => {
    loadTemplate();
  }, [id]);

  const loadTemplate = async () => {
    try {
      const res = await api.get(`/templates/${id}`);
      const t = res.data.data;
      setName(t.name);
      setCategory(t.category);
      setDescription(t.description ?? "");
      setContentHtml(t.contentHtml);
      setContentHtmlEn(t.contentHtmlEn ?? "");
      setLegalBasis(t.legalBasis ?? "");
      setVariables(t.variables ?? []);
    } catch {
      toast.error("Nem sikerult betolteni a sablont");
      router.push("/templates");
    } finally {
      setLoading(false);
    }
  };

  const addVariable = () => {
    setVariables([
      ...variables,
      { name: "", label: "", type: "text", required: false },
    ]);
  };

  const updateVariable = (index: number, field: keyof Variable, value: string | boolean) => {
    const updated = [...variables];
    (updated[index] as any)[field] = value;
    setVariables(updated);
  };

  const removeVariable = (index: number) => {
    setVariables(variables.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!name.trim() || !contentHtml.trim()) {
      toast.error("A nev es a tartalom megadasa kotelezo");
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
      toast.success("Sablon sikeresen frissitve");
      router.push("/templates");
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message ?? "Hiba a sablon mentese kozben";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const renderPreview = () => {
    let html = contentLang === "en" ? contentHtmlEn : contentHtml;
    for (const v of variables) {
      if (v.name) {
        html = html.replaceAll(
          `{{${v.name}}}`,
          `<span style="background:#fef3c7;padding:0 4px;border-radius:4px;">${v.label || v.name}</span>`
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
      toast.error("Nem sikerult betolteni a verziokat");
    } finally {
      setVersionsLoading(false);
    }
  };

  const handleRevert = async (versionId: string) => {
    if (!confirm("Biztosan visszaallitod ezt a verziot?")) return;
    try {
      await api.post(`/templates/${id}/revert/${versionId}`);
      toast.success("Verzio visszaallitva");
      setShowVersions(false);
      await loadTemplate();
    } catch {
      toast.error("Hiba a verzio visszaallitasakor");
    }
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
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sablon szerkesztese</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={loadVersions}
            disabled={versionsLoading}
            className="text-sm font-medium px-4 py-2 rounded-lg border hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            {versionsLoading ? "Betoltes..." : "Verziok"}
          </button>
          <button
            onClick={() => router.push("/templates")}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Vissza
          </button>
        </div>
      </div>

      {/* Versions Panel */}
      {showVersions && (
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-2xl border dark:border-gray-700 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Verzio elozmények</h2>
            <button onClick={() => setShowVersions(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {versions.length === 0 ? (
            <p className="text-sm text-gray-400">Nincs korabbi verzio</p>
          ) : (
            <div className="space-y-2">
              {versions.map((v) => (
                <div key={v.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white text-sm">v{v.version}</span>
                    {v.changeNote && (
                      <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">- {v.changeNote}</span>
                    )}
                    <span className="text-xs text-gray-400 ml-3">
                      {new Date(v.createdAt).toLocaleString("hu-HU")}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRevert(v.id)}
                    className="text-sm font-medium px-3 py-1 rounded-lg text-white transition"
                    style={{ backgroundColor: "#198296" }}
                    onMouseEnter={(e) => (e.target as HTMLButtonElement).style.backgroundColor = "#0e5f6e"}
                    onMouseLeave={(e) => (e.target as HTMLButtonElement).style.backgroundColor = "#198296"}
                  >
                    Visszaallitas
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sablon neve *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-brand-teal outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kategoria
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-brand-teal outline-none"
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
                Leiras
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-brand-teal outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Jogi alap (opcionalis)
              </label>
              <input
                type="text"
                value={legalBasis}
                onChange={(e) => setLegalBasis(e.target.value)}
                className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-brand-teal outline-none"
              />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border dark:border-gray-700 p-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tartalom (HTML) *
            </label>
            <p className="text-xs text-gray-400 mb-2">
              Hasznalj {"{{valtozo_neve}}"} szintaxist a valtozokhoz.
            </p>

            {/* HU / EN language toggle */}
            <div className="flex gap-1 mb-3 bg-gray-100 dark:bg-gray-700 rounded-lg p-1 w-fit">
              <button
                type="button"
                onClick={() => setContentLang("hu")}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
                  contentLang === "hu"
                    ? "text-white shadow-sm"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                }`}
                style={contentLang === "hu" ? { backgroundColor: "#198296" } : {}}
              >
                HU
              </button>
              <button
                type="button"
                onClick={() => setContentLang("en")}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
                  contentLang === "en"
                    ? "text-white shadow-sm"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                }`}
                style={contentLang === "en" ? { backgroundColor: "#198296" } : {}}
              >
                EN
              </button>
            </div>

            {contentLang === "hu" ? (
              <textarea
                value={contentHtml}
                onChange={(e) => setContentHtml(e.target.value)}
                rows={16}
                className="w-full px-4 py-3 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-brand-teal outline-none resize-y font-mono text-sm leading-relaxed dark:bg-gray-900 dark:text-gray-100"
              />
            ) : (
              <textarea
                value={contentHtmlEn}
                onChange={(e) => setContentHtmlEn(e.target.value)}
                rows={16}
                placeholder="English version of the template content..."
                className="w-full px-4 py-3 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-brand-teal outline-none resize-y font-mono text-sm leading-relaxed dark:bg-gray-900 dark:text-gray-100"
              />
            )}
          </div>

          {/* Variables */}
          <div className="bg-white rounded-2xl border p-6">
            <div className="flex justify-between items-center mb-4">
              <label className="text-sm font-medium text-gray-700">
                Valtozok
              </label>
              <button
                type="button"
                onClick={addVariable}
                className="text-sm font-medium text-brand-teal hover:text-brand-teal-dark"
              >
                + Uj valtozo
              </button>
            </div>

            {variables.length === 0 && (
              <p className="text-sm text-gray-400">
                Meg nincsenek valtozok.
              </p>
            )}

            <div className="space-y-3">
              {variables.map((v, i) => (
                <div
                  key={i}
                  className="flex gap-2 items-start bg-gray-50 rounded-xl p-3"
                >
                  <div className="flex-1 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={v.name}
                        onChange={(e) =>
                          updateVariable(i, "name", e.target.value)
                        }
                        placeholder="valtozo_neve"
                        className="px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-brand-teal outline-none"
                      />
                      <input
                        type="text"
                        value={v.label}
                        onChange={(e) =>
                          updateVariable(i, "label", e.target.value)
                        }
                        placeholder="Megjelenített nev"
                        className="px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-brand-teal outline-none"
                      />
                    </div>
                    <div className="flex gap-2 items-center">
                      <select
                        value={v.type}
                        onChange={(e) =>
                          updateVariable(i, "type", e.target.value)
                        }
                        className="px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-brand-teal outline-none"
                      >
                        <option value="text">Szoveg</option>
                        <option value="date">Datum</option>
                        <option value="number">Szam</option>
                        <option value="select">Valaszto</option>
                      </select>
                      <label className="flex items-center gap-1.5 text-sm text-gray-600">
                        <input
                          type="checkbox"
                          checked={v.required}
                          onChange={(e) =>
                            updateVariable(i, "required", e.target.checked)
                          }
                          className="rounded"
                        />
                        Kotelezo
                      </label>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeVariable(i)}
                    className="text-red-400 hover:text-red-600 mt-1 text-sm"
                  >
                    Torles
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border p-6 sticky top-6">
            <h2 className="text-sm font-medium text-gray-700 mb-3">
              Elonezet
            </h2>
            <div
              className="prose prose-sm max-w-none border rounded-xl p-4 bg-gray-50 min-h-[300px]"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(renderPreview()) }}
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-brand-teal-dark text-white py-3 rounded-xl text-sm font-semibold hover:bg-brand-teal transition disabled:opacity-50"
          >
            {saving ? "Mentes..." : "Valtozasok mentese"}
          </button>
        </div>
      </div>
    </div>
  );
}
