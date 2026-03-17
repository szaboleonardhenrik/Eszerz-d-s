"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { useI18n } from "@/lib/i18n";

interface Clause {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  isDefault: boolean;
  usageCount: number;
}

interface ClauseInsertPanelProps {
  open: boolean;
  onClose: () => void;
  onInsert: (html: string) => void;
}

export default function ClauseInsertPanel({ open, onClose, onInsert }: ClauseInsertPanelProps) {
  const { t } = useI18n();
  const [clauses, setClauses] = useState<Clause[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const loadClauses = useCallback(async () => {
    setLoading(true);
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

  useEffect(() => {
    if (open) {
      loadClauses();
      api.get("/clauses/categories").then((res) => setCategories(res.data.data)).catch(() => {});
    }
  }, [open, loadClauses]);

  const handleInsert = async (clause: Clause) => {
    onInsert(clause.content);
    try {
      await api.post(`/clauses/${clause.id}/use`);
    } catch {
      // ignore
    }
    onClose();
  };

  const stripHtml = (html: string) => {
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent || div.innerText || "";
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-50" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white dark:bg-gray-800 shadow-2xl z-50 flex flex-col border-l border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {t("clauses.insertTitle")}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search + filter */}
        <div className="px-5 py-3 space-y-2 border-b border-gray-100 dark:border-gray-700">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("clauses.searchPlaceholder")}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:ring-2 focus:ring-brand-teal/50 outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setSelectedCategory("")}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                !selectedCategory
                  ? "bg-brand-teal-dark text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200"
              }`}
            >
              {t("common.all")}
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition capitalize ${
                  selectedCategory === cat
                    ? "bg-brand-teal-dark text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Clause list */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-teal-dark" />
            </div>
          ) : clauses.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">
              {t("clauses.empty")}
            </div>
          ) : (
            clauses.map((clause) => (
              <button
                key={clause.id}
                onClick={() => handleInsert(clause)}
                className="w-full text-left bg-gray-50 dark:bg-gray-700/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-gray-200 dark:border-gray-600 hover:border-brand-teal/40 rounded-xl p-4 transition-all"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                    {clause.title}
                  </h4>
                  <span className="text-xs text-gray-400 shrink-0 ml-2">
                    {clause.usageCount}x
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                  {stripHtml(clause.content).substring(0, 120)}...
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 capitalize">
                    {clause.category}
                  </span>
                  {clause.isDefault && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                      {t("clauses.default")}
                    </span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </>
  );
}
