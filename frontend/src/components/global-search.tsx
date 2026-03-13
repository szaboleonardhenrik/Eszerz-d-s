"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useI18n } from "@/lib/i18n";

interface SearchResults {
  contracts: { id: string; title: string; status: string; signers?: { name: string; email: string }[] }[];
  contacts: { id: string; name: string; email: string; company?: string }[];
  templates: { id: string; name: string; category?: string }[];
}

export default function GlobalSearch() {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults(null);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get("/search", { params: { q } });
      setResults(res.data.data);
    } catch {
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, search]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Ctrl+K / Cmd+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
        setTimeout(() => {
          const input = ref.current?.querySelector("input");
          input?.focus();
        }, 50);
      }
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const navigate = (path: string) => {
    router.push(path);
    setOpen(false);
    setQuery("");
    setResults(null);
  };

  const hasResults = results && (results.contracts.length > 0 || results.contacts.length > 0 || results.templates.length > 0);

  const statusLabels: Record<string, string> = {
    draft: t("globalSearch.statusDraft"),
    pending: t("globalSearch.statusPending"),
    signed: t("globalSearch.statusSigned"),
    declined: t("globalSearch.statusDeclined"),
    expired: t("globalSearch.statusExpired"),
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-lg border border-white/20 bg-white/10 hover:bg-white/20 text-white/80 text-sm transition min-w-[120px] sm:min-w-[180px]"
      >
        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span>{t("globalSearch.button")}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 bg-black/20 dark:bg-black/40 z-[60]" onClick={() => setOpen(false)} />
          <div className="fixed left-1/2 top-[20%] -translate-x-1/2 w-full max-w-lg z-[70]">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border dark:border-gray-700 overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 border-b dark:border-gray-700">
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("globalSearch.placeholder")}
                  className="flex-1 bg-transparent outline-none text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400"
                  autoFocus
                />
                {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />}
                <kbd className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">ESC</kbd>
              </div>

              {query.length >= 2 && (
                <div className="max-h-80 overflow-y-auto">
                  {hasResults ? (
                    <div className="py-2">
                      {results!.contracts.length > 0 && (
                        <div>
                          <p className="px-4 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">{t("globalSearch.contracts")}</p>
                          {results!.contracts.map((c) => (
                            <button
                              key={c.id}
                              onClick={() => navigate(`/contracts/${c.id}`)}
                              className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3"
                            >
                              <svg className="w-4 h-4 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{c.title}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{c.signers?.map(s => s.name).join(", ") || "—"}</p>
                              </div>
                              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                                c.status === "signed" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                                c.status === "pending" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                                c.status === "declined" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                                "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                              }`}>{statusLabels[c.status] || c.status}</span>
                            </button>
                          ))}
                        </div>
                      )}
                      {results!.contacts.length > 0 && (
                        <div>
                          <p className="px-4 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">{t("globalSearch.partners")}</p>
                          {results!.contacts.map((c) => (
                            <button
                              key={c.id}
                              onClick={() => navigate(`/contacts/${c.id}`)}
                              className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3"
                            >
                              <svg className="w-4 h-4 text-indigo-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{c.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{c.email}{c.company ? ` \u00b7 ${c.company}` : ""}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                      {results!.templates.length > 0 && (
                        <div>
                          <p className="px-4 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">{t("globalSearch.templates")}</p>
                          {results!.templates.map((t) => (
                            <button
                              key={t.id}
                              onClick={() => navigate(`/create?templateId=${t.id}`)}
                              className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3"
                            >
                              <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z" />
                              </svg>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{t.name}</p>
                                {t.category && <p className="text-xs text-gray-500 dark:text-gray-400">{t.category}</p>}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : !loading ? (
                    <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                      {t("globalSearch.noResults", { query })}
                    </div>
                  ) : null}
                </div>
              )}

              {!query && (
                <div className="px-4 py-6 text-center text-sm text-gray-400">
                  {t("globalSearch.startTyping")}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
