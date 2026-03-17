"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import WysiwygEditor from "@/components/wysiwyg-editor";

interface Clause {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  isDefault: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

const categoryColors: Record<string, string> = {
  "titoktartás": "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
  "vis major": "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300",
  "kötbér": "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
  "szavatosság": "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
  "felelősség": "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300",
  "GDPR": "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
  "fizetés": "bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300",
  "szellemi tulajdon": "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300",
  "felmondás": "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300",
  "jogvita": "bg-slate-100 text-slate-700 dark:bg-slate-900/50 dark:text-slate-300",
};

export default function ClausesPage() {
  const { t } = useI18n();
  const [clauses, setClauses] = useState<Clause[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingClause, setEditingClause] = useState<Clause | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formTags, setFormTags] = useState("");
  const [saving, setSaving] = useState(false);

  const loadClauses = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (selectedCategory) params.set("category", selectedCategory);
      if (search) params.set("search", search);
      const res = await api.get(`/clauses?${params}`);
      setClauses(res.data.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, search]);

  const loadCategories = useCallback(async () => {
    try {
      const res = await api.get("/clauses/categories");
      setCategories(res.data.data);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadClauses();
  }, [loadClauses]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const openCreateModal = () => {
    setEditingClause(null);
    setFormTitle("");
    setFormContent("");
    setFormCategory("");
    setFormTags("");
    setShowModal(true);
  };

  const openEditModal = (clause: Clause) => {
    setEditingClause(clause);
    setFormTitle(clause.title);
    setFormContent(clause.content);
    setFormCategory(clause.category);
    setFormTags(clause.tags.join(", "));
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = {
        title: formTitle,
        content: formContent,
        category: formCategory,
        tags: (formTags || "").split(",").map((t) => t.trim()).filter(Boolean),
      };
      if (editingClause) {
        await api.put(`/clauses/${editingClause.id}`, data);
      } else {
        await api.post("/clauses", data);
      }
      setShowModal(false);
      loadClauses();
      loadCategories();
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("clauses.confirmDelete"))) return;
    try {
      await api.delete(`/clauses/${id}`);
      loadClauses();
    } catch {
      // ignore
    }
  };

  const handleCopy = async (clause: Clause) => {
    try {
      await navigator.clipboard.writeText(clause.content.replace(/<[^>]*>/g, ""));
      await api.post(`/clauses/${clause.id}/use`);
    } catch {
      // fallback
    }
  };

  const stripHtml = (html: string) => {
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent || div.innerText || "";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-sm text-gray-400">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t("clauses.title")}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t("clauses.subtitle")}
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 bg-brand-teal-dark hover:bg-brand-teal text-white font-medium px-4 py-2.5 rounded-xl transition"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {t("clauses.create")}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar: categories */}
        <div className="lg:w-56 shrink-0">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              {t("clauses.categories")}
            </h3>
            <div className="space-y-1">
              <button
                onClick={() => setSelectedCategory("")}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                  !selectedCategory
                    ? "bg-brand-teal-dark/10 text-brand-teal-dark dark:text-brand-teal font-medium"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                {t("common.all")} ({clauses.length})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition capitalize ${
                    selectedCategory === cat
                      ? "bg-brand-teal-dark/10 text-brand-teal-dark dark:text-brand-teal font-medium"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Search bar + view toggle */}
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("clauses.searchPlaceholder")}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-teal/50 focus:border-brand-teal outline-none transition text-sm"
              />
            </div>
            <div className="flex items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl overflow-hidden">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2.5 transition ${viewMode === "grid" ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white" : "text-gray-400 hover:text-gray-600"}`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2.5 transition ${viewMode === "list" ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white" : "text-gray-400 hover:text-gray-600"}`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>

          {clauses.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {t("clauses.empty")}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {t("clauses.emptyDesc")}
              </p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {clauses.map((clause) => (
                <div
                  key={clause.id}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:border-brand-teal/30 transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                        {clause.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${categoryColors[clause.category] ?? "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"}`}>
                          {clause.category}
                        </span>
                        {clause.isDefault && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                            {t("clauses.default")}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0 ml-2">
                      {clause.usageCount}x
                    </span>
                  </div>

                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3 mb-4">
                    {stripHtml(clause.content).substring(0, 150)}...
                  </p>

                  {clause.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {clause.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-md">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                    <button
                      onClick={() => handleCopy(clause)}
                      className="flex-1 text-center text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-brand-teal-dark py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                    >
                      {t("clauses.copy")}
                    </button>
                    {!clause.isDefault && (
                      <>
                        <button
                          onClick={() => openEditModal(clause)}
                          className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                        >
                          {t("common.edit")}
                        </button>
                        <button
                          onClick={() => handleDelete(clause.id)}
                          className="text-sm font-medium text-red-500 hover:text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                        >
                          {t("common.delete")}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {clauses.map((clause) => (
                <div
                  key={clause.id}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:border-brand-teal/30 transition-all flex items-center gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                        {clause.title}
                      </h3>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize shrink-0 ${categoryColors[clause.category] ?? "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"}`}>
                        {clause.category}
                      </span>
                      {clause.isDefault && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 shrink-0">
                          {t("clauses.default")}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-1">
                      {stripHtml(clause.content).substring(0, 100)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-gray-400">{clause.usageCount}x</span>
                    <button
                      onClick={() => handleCopy(clause)}
                      className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-brand-teal-dark px-3 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                    >
                      {t("clauses.copy")}
                    </button>
                    {!clause.isDefault && (
                      <>
                        <button
                          onClick={() => openEditModal(clause)}
                          className="text-sm text-gray-500 hover:text-blue-600 px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                        >
                          {t("common.edit")}
                        </button>
                        <button
                          onClick={() => handleDelete(clause.id)}
                          className="text-sm text-red-500 hover:text-red-700 px-2 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                        >
                          {t("common.delete")}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-3xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  {editingClause ? t("clauses.editTitle") : t("clauses.createTitle")}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t("clauses.name")}
                  </label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-teal/50 focus:border-brand-teal outline-none transition"
                    placeholder={t("clauses.namePlaceholder")}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t("clauses.category")}
                    </label>
                    <input
                      type="text"
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-teal/50 focus:border-brand-teal outline-none transition"
                      placeholder={t("clauses.categoryPlaceholder")}
                      list="clause-categories"
                    />
                    <datalist id="clause-categories">
                      {categories.map((cat) => (
                        <option key={cat} value={cat} />
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t("clauses.tags")}
                    </label>
                    <input
                      type="text"
                      value={formTags}
                      onChange={(e) => setFormTags(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-teal/50 focus:border-brand-teal outline-none transition"
                      placeholder={t("clauses.tagsPlaceholder")}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t("clauses.content")}
                  </label>
                  <WysiwygEditor
                    value={formContent}
                    onChange={setFormContent}
                    placeholder={t("clauses.contentPlaceholder")}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition"
                >
                  {t("common.cancel")}
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !formTitle || !formCategory || !formContent}
                  className="px-6 py-2.5 bg-brand-teal-dark hover:bg-brand-teal text-white font-medium rounded-xl transition disabled:opacity-50"
                >
                  {saving ? t("common.loading") : t("common.save")}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
