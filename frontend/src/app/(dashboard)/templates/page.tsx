"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { useAuth } from "@/lib/auth-store";
import { SkeletonTemplateCard } from "@/components/skeleton";
import EmptyState from "@/components/empty-state";

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
  munkajogi: "bg-purple-100 text-purple-700",
  b2b: "bg-blue-100 text-blue-700",
  ingatlan: "bg-amber-100 text-amber-700",
  fogyasztoi: "bg-emerald-100 text-emerald-700",
  adatvedelem: "bg-rose-100 text-rose-700",
  penzugyi: "bg-orange-100 text-orange-700",
  it: "bg-cyan-100 text-cyan-700",
};

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const user = useAuth((s) => s.user);

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
      toast.error("Hiba a sablonok bet\u00f6lt\u00e9sekor");
    } finally {
      setLoading(false);
    }
  };

  const filtered = templates.filter(
    (t) =>
      !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.description?.toLowerCase().includes(search.toLowerCase())
  );

  const categories = [...new Set(templates.map((t) => t.category))];

  const handleDelete = async (id: string) => {
    if (!confirm("Biztosan torolni szeretned ezt a sablont?")) return;
    try {
      await api.delete(`/templates/${id}`);
      toast.success("Sablon torolve");
      loadTemplates();
    } catch {
      toast.error("Hiba a sablon torlese kozben");
    }
  };

  const isOwner = (template: Template) =>
    user && template.ownerId === user.id;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Sablonkönyvtár</h1>
        <Link
          href="/templates/new"
          className="bg-brand-gold text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-brand-gold-dark transition shadow-sm"
        >
          + Új sablon
        </Link>
      </div>

      <div className="flex gap-4 mb-6 flex-wrap">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Keresés..."
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-64"
        />
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              !filter ? "bg-blue-100 text-blue-700" : "text-gray-500 hover:bg-gray-100"
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
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-500 hover:bg-gray-100"
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
              title="M\u00e9g nincsenek sablonok"
              description="A sablonk\u00f6nyvt\u00e1r m\u00e9g \u00fcres. Hamarosan el\u00e9rhet\u0151ek lesznek az el\u0151re elk\u00e9sz\u00edtett sablonok."
            />
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-400">
            Nincs tal\u00e1lat
          </div>
        ) : (
          filtered.map((template) => (
            <div
              key={template.id}
              className="bg-white rounded-2xl shadow-sm border p-6 hover:shadow-md transition group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      categoryColors[template.category] ?? "bg-gray-100"
                    }`}
                  >
                    {categoryLabels[template.category] ?? template.category}
                  </span>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      template.isPublic
                        ? "bg-gray-100 text-gray-500"
                        : "bg-brand-teal/10 text-brand-teal-dark"
                    }`}
                  >
                    {template.isPublic ? "Rendszer" : "Saját"}
                  </span>
                </div>
                <span className="text-xs text-gray-400">
                  {template.variables?.length ?? 0} mezo
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                {template.name}
              </h3>
              <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                {template.description}
              </p>
              {template.legalBasis && (
                <p className="text-xs text-gray-400 mb-4">
                  {template.legalBasis}
                </p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    router.push(`/create?templateId=${template.id}`)
                  }
                  className="flex-1 bg-brand-teal-dark text-white py-2 rounded-xl text-sm font-medium hover:bg-brand-teal transition"
                >
                  Használat
                </button>
                {isOwner(template) && (
                  <>
                    <button
                      onClick={() =>
                        router.push(`/templates/${template.id}/edit`)
                      }
                      className="px-3 py-2 border rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition"
                    >
                      Szerk.
                    </button>
                    <button
                      onClick={() => handleDelete(template.id)}
                      className="px-3 py-2 border border-red-200 rounded-xl text-sm text-red-500 hover:bg-red-50 transition"
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
    </div>
  );
}
