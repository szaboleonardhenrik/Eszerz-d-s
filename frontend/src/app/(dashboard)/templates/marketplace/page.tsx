"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { SkeletonTemplateCard } from "@/components/skeleton";
import { sanitizeHtml } from "@/lib/sanitize";

interface Template {
  id: string;
  name: string;
  category: string;
  description: string;
  legalBasis: string;
  isPublic: boolean;
  ownerId: string | null;
  variables: { name: string; label: string; type: string; required: boolean }[];
}

interface PreviewData {
  name: string;
  category: string;
  description: string;
  contentHtml: string;
  variables: any[];
  legalBasis: string;
}

const categoryLabels: Record<string, string> = {
  munkajogi: "Munkajogi",
  b2b: "V\u00e1llalati B2B",
  ingatlan: "Ingatlan",
  fogyasztoi: "Fogyaszt\u00f3i",
  adatvedelem: "Adatv\u00e9delem",
  penzugyi: "P\u00e9nz\u00fcgyi",
  it: "IT / Szoftver",
};

const categoryColors: Record<string, string> = {
  munkajogi:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  b2b: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  ingatlan:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  fogyasztoi:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  adatvedelem:
    "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
  penzugyi:
    "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  it: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
};

const categoryChipColors: Record<string, string> = {
  munkajogi:
    "border-purple-300 text-purple-700 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-300 dark:hover:bg-purple-900/20",
  b2b: "border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900/20",
  ingatlan:
    "border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/20",
  fogyasztoi:
    "border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-900/20",
  adatvedelem:
    "border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-700 dark:text-rose-300 dark:hover:bg-rose-900/20",
  penzugyi:
    "border-orange-300 text-orange-700 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-300 dark:hover:bg-orange-900/20",
  it: "border-cyan-300 text-cyan-700 hover:bg-cyan-50 dark:border-cyan-700 dark:text-cyan-300 dark:hover:bg-cyan-900/20",
};

const categoryChipActive: Record<string, string> = {
  munkajogi:
    "bg-purple-100 border-purple-400 text-purple-800 dark:bg-purple-900/40 dark:border-purple-500 dark:text-purple-200",
  b2b: "bg-blue-100 border-blue-400 text-blue-800 dark:bg-blue-900/40 dark:border-blue-500 dark:text-blue-200",
  ingatlan:
    "bg-amber-100 border-amber-400 text-amber-800 dark:bg-amber-900/40 dark:border-amber-500 dark:text-amber-200",
  fogyasztoi:
    "bg-emerald-100 border-emerald-400 text-emerald-800 dark:bg-emerald-900/40 dark:border-emerald-500 dark:text-emerald-200",
  adatvedelem:
    "bg-rose-100 border-rose-400 text-rose-800 dark:bg-rose-900/40 dark:border-rose-500 dark:text-rose-200",
  penzugyi:
    "bg-orange-100 border-orange-400 text-orange-800 dark:bg-orange-900/40 dark:border-orange-500 dark:text-orange-200",
  it: "bg-cyan-100 border-cyan-400 text-cyan-800 dark:bg-cyan-900/40 dark:border-cyan-500 dark:text-cyan-200",
};

const allCategories = [
  "munkajogi",
  "b2b",
  "ingatlan",
  "fogyasztoi",
  "adatvedelem",
  "penzugyi",
  "it",
];

type SortOption = "newest" | "name" | "category";

export default function MarketplacePage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [sort, setSort] = useState<SortOption>("newest");
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [cloning, setCloning] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const res = await api.get("/templates");
      const all: Template[] = res.data.data;
      setTemplates(all.filter((t) => t.isPublic));
    } catch {
      toast.error("Hiba a sablonok bet\u00f6lt\u00e9sekor");
    } finally {
      setLoading(false);
    }
  };

  const filtered = templates
    .filter((t) => {
      if (categoryFilter && t.category !== categoryFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          t.name.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name, "hu");
      if (sort === "category")
        return (categoryLabels[a.category] ?? a.category).localeCompare(
          categoryLabels[b.category] ?? b.category,
          "hu"
        );
      return 0;
    });

  const handlePreview = async (id: string) => {
    setPreviewLoading(true);
    setPreview(null);
    try {
      const res = await api.get(`/templates/${id}/preview`);
      setPreview(res.data.data);
    } catch {
      toast.error("Hiba az el\u0151n\u00e9zet bet\u00f6lt\u00e9sekor");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleClone = async (id: string) => {
    setCloning(id);
    try {
      const res = await api.get(`/templates/${id}`);
      const original = res.data.data;
      await api.post("/templates", {
        name: `${original.name} (m\u00e1solat)`,
        category: original.category,
        description: original.description,
        legalBasis: original.legalBasis,
        contentHtml: original.contentHtml,
        variables: original.variables,
        isPublic: false,
      });
      toast.success("Sablon sikeresen kl\u00f3nozva!");
    } catch {
      toast.error("Hiba a sablon kl\u00f3noz\u00e1sakor");
    } finally {
      setCloning(null);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#198296] to-[#115e6c] px-8 py-12 mb-8 dark:from-[#198296]/90 dark:to-[#0d4a55]">
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 400 200">
            <circle cx="350" cy="30" r="80" fill="white" />
            <circle cx="50" cy="170" r="60" fill="white" />
          </svg>
        </div>
        <div className="relative">
          <h1 className="text-3xl font-bold text-white mb-2">
            {"Sablon piact\u00e9r"}
          </h1>
          <p className="text-white/80 text-lg max-w-xl">
            {"B\u00f6ng\u00e9sszen a k\u00f6z\u00f6ss\u00e9gi \u00e9s hivatalos sablonok k\u00f6z\u00f6tt"}
          </p>
          <div className="flex items-center gap-3 mt-6">
            <div className="relative flex-1 max-w-md">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={"Keres\u00e9s n\u00e9v vagy le\u00edr\u00e1s alapj\u00e1n..."}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/95 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-white/50 shadow-lg text-sm"
              />
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="py-3 px-4 rounded-xl bg-white/95 dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-white/50 shadow-lg text-sm cursor-pointer"
            >
              <option value="newest">{"Leg\u00fajabb"}</option>
              <option value="name">{"N\u00e9v (A-Z)"}</option>
              <option value="category">{"Kateg\u00f3ria"}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Category Chips */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setCategoryFilter("")}
          className={`px-4 py-2 rounded-full text-sm font-medium border transition ${
            !categoryFilter
              ? "bg-[#198296] border-[#198296] text-white dark:bg-[#198296] dark:border-[#198296]"
              : "border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          }`}
        >
          {"\u00d6sszes"}
        </button>
        {allCategories.map((cat) => (
          <button
            key={cat}
            onClick={() =>
              setCategoryFilter(categoryFilter === cat ? "" : cat)
            }
            className={`px-4 py-2 rounded-full text-sm font-medium border transition ${
              categoryFilter === cat
                ? categoryChipActive[cat]
                : categoryChipColors[cat]
            }`}
          >
            {categoryLabels[cat]}
          </button>
        ))}
      </div>

      {/* Results Count */}
      {!loading && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          {filtered.length} {"sablon tal\u00e1lhat\u00f3"}
          {categoryFilter && ` \u2013 ${categoryLabels[categoryFilter]}`}
          {search && ` \u2013 "${search}"`}
        </p>
      )}

      {/* Template Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          [0, 1, 2, 3, 4, 5].map((i) => <SkeletonTemplateCard key={i} />)
        ) : filtered.length === 0 ? (
          <div className="col-span-full text-center py-16">
            <svg
              className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <p className="text-gray-500 dark:text-gray-400 text-lg font-medium mb-1">
              {"Nincs tal\u00e1lat"}
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-sm">
              {"Pr\u00f3b\u00e1ljon m\u00e1s keres\u00e9si felt\u00e9teleket vagy kateg\u00f3ri\u00e1t."}
            </p>
          </div>
        ) : (
          filtered.map((template) => (
            <div
              key={template.id}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg hover:border-[#198296]/30 dark:hover:border-[#198296]/40 transition-all duration-200 group flex flex-col"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                      categoryColors[template.category] ??
                      "bg-gray-100 dark:bg-gray-700"
                    }`}
                  >
                    {categoryLabels[template.category] ?? template.category}
                  </span>
                  <span
                    className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                      template.ownerId
                        ? "bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300"
                        : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                    }`}
                  >
                    {template.ownerId ? "K\u00f6z\u00f6ss\u00e9gi" : "Rendszer"}
                  </span>
                </div>
              </div>

              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-[#198296] transition-colors">
                {template.name}
              </h3>

              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2 flex-grow">
                {template.description}
              </p>

              {template.legalBasis && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-3 flex items-center gap-1">
                  <svg
                    className="w-3.5 h-3.5 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
                    />
                  </svg>
                  {template.legalBasis}
                </p>
              )}

              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h8m-8 6h16"
                    />
                  </svg>
                  {template.variables?.length ?? 0} {"mez\u0151"}
                </span>
              </div>

              <div className="flex gap-2 mt-auto">
                <button
                  onClick={() =>
                    router.push(`/create?templateId=${template.id}`)
                  }
                  className="flex-1 bg-[#198296] text-white py-2 rounded-xl text-sm font-medium hover:bg-[#146d7e] transition"
                >
                  {"Haszn\u00e1lat"}
                </button>
                <button
                  onClick={() => handleClone(template.id)}
                  disabled={cloning === template.id}
                  className="px-3 py-2 border border-[#198296]/30 rounded-xl text-sm text-[#198296] hover:bg-[#198296]/5 dark:border-[#198296]/40 dark:text-[#45b8cc] dark:hover:bg-[#198296]/10 transition disabled:opacity-50"
                  title={"Kl\u00f3noz\u00e1s"}
                >
                  {cloning === template.id ? (
                    <svg
                      className="w-4 h-4 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  )}
                </button>
                <button
                  onClick={() => handlePreview(template.id)}
                  className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  title={"El\u0151n\u00e9zet"}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Preview Modal */}
      {(preview || previewLoading) && (
        <div
          className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-4"
          onClick={() => {
            if (!previewLoading) setPreview(null);
          }}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-5 flex justify-between items-center rounded-t-2xl z-10">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {preview ? preview.name : "Bet\u00f6lt\u00e9s..."}
              </h2>
              <button
                onClick={() => setPreview(null)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              >
                <svg
                  className="w-5 h-5 text-gray-500 dark:text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            {previewLoading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#198296] mx-auto mb-3" />
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  {"El\u0151n\u00e9zet bet\u00f6lt\u00e9se..."}
                </p>
              </div>
            ) : preview ? (
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <span
                    className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                      categoryColors[preview.category] ??
                      "bg-gray-100 dark:bg-gray-700"
                    }`}
                  >
                    {categoryLabels[preview.category] ?? preview.category}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {preview.variables?.length ?? 0} {"mez\u0151"}
                  </span>
                </div>

                {preview.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    {preview.description}
                  </p>
                )}

                {preview.legalBasis && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-4 flex items-center gap-1">
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
                      />
                    </svg>
                    {preview.legalBasis}
                  </p>
                )}

                {preview.variables?.length > 0 && (
                  <div className="mb-5">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {"Kit\u00f6ltend\u0151 mez\u0151k:"}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {preview.variables.map((v: any, i: number) => (
                        <span
                          key={i}
                          className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2.5 py-1 rounded-lg"
                        >
                          {v.label}
                          {v.required && (
                            <span className="text-red-500 ml-0.5">*</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border-t border-gray-200 dark:border-gray-700 pt-5">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    {"Sablon el\u0151n\u00e9zet:"}
                  </h3>
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none border border-gray-200 dark:border-gray-700 rounded-xl p-5 bg-gray-50 dark:bg-gray-900"
                    dangerouslySetInnerHTML={{
                      __html: sanitizeHtml(preview.contentHtml),
                    }}
                  />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
