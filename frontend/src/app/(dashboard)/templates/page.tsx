"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { useAuth } from "@/lib/auth-store";
import { sanitizeHtml } from "@/lib/sanitize";
import { SkeletonTemplateCard } from "@/components/skeleton";
import EmptyState from "@/components/empty-state";
import { isFavorite, toggleFavorite } from "@/lib/favorites";
import { getEsignWarning } from "@/lib/esign-warnings";

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
  b2b: "Vállalati B2B",
  ingatlan: "Ingatlan",
  fogyasztoi: "Fogyasztói",
  adatvedelem: "Adatvédelem",
  penzugyi: "Pénzügyi",
  it: "IT / Szoftver",
};

const categoryColors: Record<string, string> = {
  munkajogi: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  b2b: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  ingatlan: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  fogyasztoi: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  adatvedelem: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  penzugyi: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  it: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
};

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [favs, setFavs] = useState<Record<string, boolean>>({});
  const router = useRouter();
  const user = useAuth((s) => s.user);

  useEffect(() => {
    const initial: Record<string, boolean> = {};
    templates.forEach((t) => { initial[t.id] = isFavorite(t.id); });
    setFavs(initial);
  }, [templates]);

  useEffect(() => {
    loadTemplates();
  }, [filter]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const res = await api.get("/templates", {
        params: filter ? { category: filter } : {},
      });
      setTemplates(res.data.data);
    } catch {
      toast.error("Hiba a sablonok betöltésekor");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFav = (id: string) => {
    const newState = toggleFavorite(id);
    setFavs((prev) => ({ ...prev, [id]: newState }));
  };

  const filtered = templates
    .filter(
      (t) =>
        !search ||
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.description?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const aFav = favs[a.id] ? 1 : 0;
      const bFav = favs[b.id] ? 1 : 0;
      return bFav - aFav;
    });

  const categories = [...new Set(templates.map((t) => t.category))];

  const handleDelete = async (id: string) => {
    if (!confirm("Biztosan törölni szeretnéd ezt a sablont?")) return;
    try {
      await api.delete(`/templates/${id}`);
      toast.success("Sablon törölve");
      loadTemplates();
    } catch {
      toast.error("Hiba a sablon törlése közben");
    }
  };

  const handlePreview = async (id: string) => {
    setPreviewLoading(true);
    try {
      const res = await api.get(`/templates/${id}/preview`);
      setPreview(res.data.data);
    } catch {
      toast.error("Hiba az előnézet betöltésekor");
    } finally {
      setPreviewLoading(false);
    }
  };

  const isOwner = (template: Template) =>
    user && template.ownerId === user.id;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Sablonkonyvtar</h1>
        <div className="flex gap-2">
          <Link
            href="/templates/marketplace"
            className="border border-gray-200 dark:border-gray-600 px-4 py-2 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            Piac ter
          </Link>
          <Link
            href="/templates/new"
            className="bg-brand-gold text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-brand-gold-dark transition shadow-sm"
          >
            + Uj sablon
          </Link>
        </div>
      </div>

      <div className="flex gap-4 mb-6 flex-wrap">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Keresés..."
          className="px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-64 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        />
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              !filter ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            Összes
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                filter === cat
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                  : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              {categoryLabels[cat] ?? cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          [0, 1, 2, 3, 4, 5].map((i) => <SkeletonTemplateCard key={i} />)
        ) : filtered.length === 0 && !search && !filter ? (
          <div className="col-span-full">
            <EmptyState
              icon="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
              title="Még nincsenek sablonok"
              description="A sablonkönyvtár még üres. Hamarosan elérhetőek lesznek az előre elkészített sablonok."
            />
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-400 dark:text-gray-500">
            Nincs találat
          </div>
        ) : (
          filtered.map((template) => (
            <div
              key={template.id}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      categoryColors[template.category] ?? "bg-gray-100 dark:bg-gray-700"
                    }`}
                  >
                    {categoryLabels[template.category] ?? template.category}
                  </span>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      template.isPublic
                        ? "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                        : "bg-brand-teal/10 text-brand-teal-dark dark:bg-brand-teal/20 dark:text-brand-teal"
                    }`}
                  >
                    {template.isPublic ? "Rendszer" : "Saját"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {template.variables?.length ?? 0} mezo
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleToggleFav(template.id); }}
                    className="p-0.5 hover:scale-110 transition-transform"
                    title={favs[template.id] ? "Eltavolitas a kedvencekbol" : "Kedvencekhez adas"}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill={favs[template.id] ? "#D29B01" : "none"} stroke={favs[template.id] ? "#D29B01" : "#9ca3af"} strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </button>
                </div>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {template.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
                {template.description}
              </p>
              {template.legalBasis && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
                  {template.legalBasis}
                </p>
              )}
              {(() => {
                const esignWarning = getEsignWarning(template.category, template.name);
                return esignWarning ? (
                  <div className="mb-3 flex items-start gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
                    <svg className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>{esignWarning}</span>
                  </div>
                ) : null;
              })()}
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    router.push(`/create?templateId=${template.id}`)
                  }
                  className="flex-1 bg-brand-teal-dark text-white py-2 rounded-xl text-sm font-medium hover:bg-brand-teal transition"
                >
                  Használat
                </button>
                <button
                  onClick={() => handlePreview(template.id)}
                  className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  title="Előnézet"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
                {isOwner(template) && (
                  <>
                    <button
                      onClick={() =>
                        router.push(`/templates/${template.id}/edit`)
                      }
                      className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                    >
                      Szerk.
                    </button>
                    <button
                      onClick={() => handleDelete(template.id)}
                      className="px-3 py-2 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition"
                    >
                      Törlés
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Preview Modal */}
      {(preview || previewLoading) && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-3xl w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center rounded-t-2xl">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {preview ? preview.name : "Betöltés..."}
              </h2>
              <button
                onClick={() => setPreview(null)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              >
                <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {previewLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
              </div>
            ) : preview ? (
              <div className="p-6">
                <div className="flex gap-2 mb-4">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${categoryColors[preview.category] ?? "bg-gray-100 dark:bg-gray-700"}`}>
                    {categoryLabels[preview.category] ?? preview.category}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {preview.variables?.length ?? 0} mező
                  </span>
                </div>
                {preview.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{preview.description}</p>
                )}
                {preview.legalBasis && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">{preview.legalBasis}</p>
                )}
                {(() => {
                  const esignWarning = getEsignWarning(preview.category, preview.name);
                  return esignWarning ? (
                    <div className="mb-4 flex items-start gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
                      <svg className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span>{esignWarning}</span>
                    </div>
                  ) : null;
                })()}
                {preview.variables?.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Kitöltendő mezők:</h3>
                    <div className="flex flex-wrap gap-2">
                      {preview.variables.map((v: any, i: number) => (
                        <span key={i} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded">
                          {v.label} {v.required && "*"}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Sablon előnézet:</h3>
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-900"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(preview.contentHtml) }}
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
