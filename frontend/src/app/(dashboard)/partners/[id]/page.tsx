"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";

interface Partner {
  id: string;
  companyName: string;
  taxNumber: string | null;
  registrationNumber: string | null;
  headquarters: string | null;
  representative: string | null;
  isActive: boolean;
  lastCheckedAt: string | null;
  notes: string | null;
  jobListings: {
    id: string;
    title: string;
    url: string;
    snippet: string | null;
    status: string;
    firstSeenAt: string;
    lastSeenAt: string;
  }[];
  _count: { jobListings: number };
}

export default function PartnerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ companyName: "", taxNumber: "", registrationNumber: "", headquarters: "", notes: "" });
  const [lookupUrl, setLookupUrl] = useState<string | null>(null);

  useEffect(() => {
    api.get(`/partner-monitor/partners/${id}`).then((res) => {
      setPartner(res.data);
      setForm({
        companyName: res.data.companyName,
        taxNumber: res.data.taxNumber || "",
        registrationNumber: res.data.registrationNumber || "",
        headquarters: res.data.headquarters || "",
        notes: res.data.notes || "",
      });
    }).catch(() => router.push("/partners")).finally(() => setLoading(false));
  }, [id, router]);

  const save = async () => {
    try {
      const res = await api.put(`/partner-monitor/partners/${id}`, form);
      setPartner({ ...partner!, ...res.data });
      setEditing(false);
    } catch {}
  };

  const lookupCeg = async () => {
    try {
      const res = await api.get("/partner-monitor/lookup", { params: { name: partner?.companyName } });
      setLookupUrl(res.data.searchUrl);
    } catch {}
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
      </div>
    );
  }

  if (!partner) return null;

  const activeListings = partner.jobListings.filter((j) => j.status === "active" || j.status === "new");
  const expiredListings = partner.jobListings.filter((j) => j.status === "expired");

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link href="/partners" className="hover:text-blue-600">Partner Monitor</Link>
        <span>/</span>
        <span className="text-gray-900 dark:text-white font-medium">{partner.companyName}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: partner info */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Ceg adatai</h2>
            <button
              onClick={() => setEditing(!editing)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {editing ? "Megse" : "Szerkesztes"}
            </button>
          </div>

          {editing ? (
            <div className="space-y-3">
              {[
                { key: "companyName", label: "Cegnev" },
                { key: "taxNumber", label: "Adoszam" },
                { key: "registrationNumber", label: "Cegjegyzekszam" },
                { key: "headquarters", label: "Szekhely" },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
                  <input
                    type="text"
                    value={form[key as keyof typeof form]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Megjegyzes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  rows={3}
                />
              </div>
              <button onClick={save} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                Mentes
              </button>
            </div>
          ) : (
            <div className="space-y-3 text-sm">
              <div><span className="text-gray-500">Cegnev:</span> <span className="font-medium text-gray-900 dark:text-white">{partner.companyName}</span></div>
              <div><span className="text-gray-500">Adoszam:</span> <span className="dark:text-gray-300">{partner.taxNumber || "-"}</span></div>
              <div><span className="text-gray-500">Cegjegyzekszam:</span> <span className="dark:text-gray-300">{partner.registrationNumber || "-"}</span></div>
              <div><span className="text-gray-500">Szekhely:</span> <span className="dark:text-gray-300">{partner.headquarters || "-"}</span></div>
              {partner.notes && <div><span className="text-gray-500">Megjegyzes:</span> <span className="dark:text-gray-300">{partner.notes}</span></div>}
              <div><span className="text-gray-500">Utolso ellenorzes:</span> <span className="dark:text-gray-300">{partner.lastCheckedAt ? new Date(partner.lastCheckedAt).toLocaleString("hu-HU") : "Meg nem"}</span></div>
              <div><span className="text-gray-500">Osszes hirdetes:</span> <span className="font-medium dark:text-gray-300">{partner._count.jobListings}</span></div>
            </div>
          )}

          <div className="mt-4 pt-4 border-t dark:border-gray-700">
            <button
              onClick={lookupCeg}
              className="text-sm text-brand-teal-dark dark:text-brand-teal hover:underline"
            >
              Kereses az e-cegjegyzekben
            </button>
            {lookupUrl && (
              <a
                href={lookupUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block mt-2 text-xs text-blue-600 hover:underline break-all"
              >
                Megnyitas a cegjegyzekben
              </a>
            )}
          </div>
        </div>

        {/* Right: job listings */}
        <div className="lg:col-span-2 space-y-4">
          {/* Active listings */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 overflow-hidden">
            <div className="px-4 py-3 border-b dark:border-gray-700 bg-green-50 dark:bg-green-900/20">
              <h3 className="text-sm font-semibold text-green-700 dark:text-green-400">
                Aktiv hirdetesek ({activeListings.length})
              </h3>
            </div>
            {activeListings.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-400">Nincs aktiv hirdetes</div>
            ) : (
              <div className="divide-y dark:divide-gray-700">
                {activeListings.map((j) => (
                  <div key={j.id} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <a href={j.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-gray-900 dark:text-white hover:text-blue-600">
                          {j.title}
                        </a>
                        {j.status === "new" && (
                          <span className="ml-2 px-1.5 py-0.5 bg-orange-100 text-orange-600 text-[10px] font-bold rounded uppercase">Uj</span>
                        )}
                        {j.snippet && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{j.snippet}</p>}
                      </div>
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        {new Date(j.firstSeenAt).toLocaleDateString("hu-HU")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Expired listings */}
          {expiredListings.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 overflow-hidden">
              <div className="px-4 py-3 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <h3 className="text-sm font-semibold text-gray-500">Korabbi hirdetesek ({expiredListings.length})</h3>
              </div>
              <div className="divide-y dark:divide-gray-700">
                {expiredListings.map((j) => (
                  <div key={j.id} className="px-4 py-2 opacity-60">
                    <a href={j.url} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-700 dark:text-gray-400 hover:text-blue-600">
                      {j.title}
                    </a>
                    <span className="text-xs text-gray-400 ml-2">
                      {new Date(j.firstSeenAt).toLocaleDateString("hu-HU")} - {new Date(j.lastSeenAt).toLocaleDateString("hu-HU")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
