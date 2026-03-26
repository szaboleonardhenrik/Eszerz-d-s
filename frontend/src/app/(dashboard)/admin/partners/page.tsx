"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";

interface DashboardData {
  totalPartners: number;
  activePartners: number;
  partnersWithActiveListings: number;
  newToday: number;
  recentListings: {
    id: string;
    title: string;
    url: string;
    snippet: string | null;
    status: string;
    firstSeenAt: string;
    partner: { companyName: string };
  }[];
  lastRun: {
    startedAt: string;
    finishedAt: string | null;
    partnersScanned: number;
    newListings: number;
    errors: number;
    status: string;
  } | null;
  rotation: {
    batchSize: number;
    rotationDays: number;
    note: string;
  };
}

interface DigestConfig {
  enabled: boolean;
  emails: string[];
}

interface Listing {
  id: string;
  title: string;
  url: string;
  snippet: string | null;
  status: string;
  firstSeenAt: string;
  partner: { companyName: string };
}

function CompanyAccordion({ listings }: { listings: Listing[] }) {
  const [open, setOpen] = useState<Record<string, boolean>>({});

  // Group by company
  const grouped: Record<string, Listing[]> = {};
  for (const l of listings) {
    const key = l.partner.companyName;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(l);
  }

  const companies = Object.entries(grouped).sort((a, b) => b[1].length - a[1].length);

  return (
    <div className="divide-y dark:divide-gray-700">
      {companies.map(([company, items]) => (
        <div key={company}>
          <button
            onClick={() => setOpen((prev) => ({ ...prev, [company]: !prev[company] }))}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
          >
            <div className="flex items-center gap-3">
              <svg
                className={`w-4 h-4 text-gray-400 transition-transform ${open[company] ? "rotate-90" : ""}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">{company}</span>
            </div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
              {items.length} pozíció
            </span>
          </button>
          {open[company] && (
            <div className="bg-gray-50/50 dark:bg-gray-900/30 border-t dark:border-gray-700">
              {items.map((l) => (
                <div key={l.id} className="px-4 py-2 pl-11 flex items-center justify-between gap-2 hover:bg-gray-100/50 dark:hover:bg-gray-700/30">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <a
                        href={l.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 truncate"
                      >
                        {l.title}
                      </a>
                      {l.status === "new" && (
                        <span className="px-1.5 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-[10px] font-bold rounded uppercase shrink-0">
                          Új
                        </span>
                      )}
                    </div>
                    {l.snippet && <p className="text-xs text-gray-500 mt-0.5 truncate">{l.snippet}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-gray-400">{new Date(l.firstSeenAt).toLocaleDateString("hu-HU")}</span>
                    <a
                      href={l.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Megnyitás
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function PartnerMonitorDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  // Digest config state
  const [digestConfig, setDigestConfig] = useState<DigestConfig>({ enabled: true, emails: [] });
  const [newEmail, setNewEmail] = useState("");
  const [digestSaving, setDigestSaving] = useState(false);
  const [digestSaved, setDigestSaved] = useState(false);

  const load = () => {
    Promise.all([
      api.get("/partner-monitor/dashboard"),
      api.get("/partner-monitor/digest-config"),
    ])
      .then(([dashRes, configRes]) => {
        setData(dashRes.data);
        setDigestConfig({ enabled: configRes.data.enabled, emails: configRes.data.emails || [] });
      })
      .catch(() => { /* ignore */ })
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  const triggerScan = async () => {
    setScanning(true);
    try {
      await api.post("/partner-monitor/scan");
      await load();
    } catch {}
    setScanning(false);
  };

  const saveDigestConfig = async (update: Partial<DigestConfig>) => {
    setDigestSaving(true);
    const updated = { ...digestConfig, ...update };
    try {
      await api.put("/partner-monitor/digest-config", updated);
      setDigestConfig(updated);
      setDigestSaved(true);
      setTimeout(() => setDigestSaved(false), 2000);
    } catch {}
    setDigestSaving(false);
  };

  const addEmail = () => {
    const email = newEmail.trim().toLowerCase();
    if (!email || !email.includes("@")) return;
    if (digestConfig.emails.includes(email)) { setNewEmail(""); return; }
    saveDigestConfig({ emails: [...digestConfig.emails, email] });
    setNewEmail("");
  };

  const removeEmail = (email: string) => {
    saveDigestConfig({ emails: digestConfig.emails.filter((e) => e !== email) });
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
      </div>
    );
  }

  if (!data) return <p className="text-gray-500">Nem sikerült betölteni.</p>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Partner Monitor Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Partnercégei álláshirdetési aktivitása a profession.hu-n
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/partners/manage"
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-300 transition"
          >
            Partnerek kezelése
          </Link>
          <button
            onClick={triggerScan}
            disabled={scanning}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {scanning ? "Scan fut..." : "Scan indítása"}
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Összes partner", value: data.totalPartners, color: "blue" },
          { label: "Aktív partnerek", value: data.activePartners, color: "green" },
          { label: "Hirdetők", value: data.partnersWithActiveListings, color: "purple" },
          { label: "Ma új", value: data.newToday, color: "orange" },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-4">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{s.label}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Last scan info */}
      {data.lastRun && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-4 mb-6">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Utolsó scan</h3>
          <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
            <span>Időpont: {new Date(data.lastRun.startedAt).toLocaleString("hu-HU")}</span>
            <span>Állapot: <span className={data.lastRun.status === "completed" ? "text-green-600" : "text-red-600"}>{data.lastRun.status}</span></span>
            <span>Partnerek: {data.lastRun.partnersScanned}</span>
            <span>Új hirdetések: {data.lastRun.newListings}</span>
            {data.lastRun.errors > 0 && <span className="text-red-500">Hibák: {data.lastRun.errors}</span>}
          </div>
        </div>
      )}

      {/* Email digest settings */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Email értesítések</h3>
          {digestSaved && <span className="text-xs text-green-600">Mentve!</span>}
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={digestConfig.enabled}
                onChange={(e) => saveDigestConfig({ enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-500 peer-checked:bg-blue-600" />
            </label>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Napi email riport (minden reggel 6:00)
            </span>
          </div>

          {digestConfig.enabled && (
            <>
              <p className="text-xs text-gray-500">
                A saját email címére automatikusan megy. Itt extra címzetteket adhat hozzá:
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addEmail()}
                  placeholder="kolléga@ceg.hu"
                  className="flex-1 px-3 py-1.5 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                <button
                  onClick={addEmail}
                  disabled={digestSaving}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  Hozzáadás
                </button>
              </div>
              {digestConfig.emails.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {digestConfig.emails.map((email) => (
                    <span
                      key={email}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs"
                    >
                      {email}
                      <button
                        onClick={() => removeEmail(email)}
                        className="text-gray-400 hover:text-red-500 ml-0.5"
                        title="Eltávolítás"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Rotation info */}
      {data.rotation && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm text-blue-700 dark:text-blue-300">{data.rotation.note}</span>
          </div>
        </div>
      )}

      {/* Listings grouped by company */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 overflow-hidden">
        <div className="px-4 py-3 border-b dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Álláshirdetések cégenként ({data.recentListings.length} pozíció)
          </h3>
        </div>
        {data.recentListings.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            Még nincsenek találatok. Indítson egy scant!
          </div>
        ) : (
          <CompanyAccordion listings={data.recentListings} />
        )}
      </div>
    </div>
  );
}
