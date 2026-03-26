"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

// ─── Types ──────────────────────────────────────────────

interface PartnerListSummary {
  id: string;
  name: string;
  description: string | null;
  emails: string[];
  emailEnabled: boolean;
  isActive: boolean;
  _count: { partners: number; scrapeRuns: number };
  partners: { id: string; companyName: string; isActive: boolean; _count: { jobListings: number } }[];
  scrapeRuns: { startedAt: string; status: string }[];
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

interface ScrapeRun {
  id: string;
  startedAt: string;
  finishedAt: string | null;
  partnersScanned: number;
  newListings: number;
  errors: number;
  status: string;
}

interface ChartPoint {
  date: string;
  total: number;
  [company: string]: string | number;
}

// ─── Colors for chart lines ─────────────────────────────
const COLORS = ["#2563eb", "#16a34a", "#dc2626", "#9333ea", "#ea580c", "#0891b2", "#4f46e5", "#be185d", "#65a30d", "#0d9488"];

// ─── CompanyAccordion ───────────────────────────────────

function CompanyAccordion({ listings }: { listings: Listing[] }) {
  const [open, setOpen] = useState<Record<string, boolean>>({});
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
          <button onClick={() => setOpen(p => ({ ...p, [company]: !p[company] }))}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
            <div className="flex items-center gap-3">
              <svg className={`w-4 h-4 text-gray-400 transition-transform ${open[company] ? "rotate-90" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">{company}</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
              {items.length} pozíció
            </span>
          </button>
          {open[company] && (
            <div className="bg-gray-50/50 dark:bg-gray-900/30 border-t dark:border-gray-700">
              {items.map(l => (
                <div key={l.id} className="px-4 py-2 pl-11 flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1 flex items-center gap-2">
                    <a href={l.url} target="_blank" rel="noopener noreferrer"
                      className="text-sm text-gray-900 dark:text-white hover:text-blue-600 truncate">{l.title}</a>
                    {l.status === "new" && <span className="px-1.5 py-0.5 bg-orange-100 text-orange-600 text-[10px] font-bold rounded uppercase shrink-0">Új</span>}
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">{new Date(l.firstSeenAt).toLocaleDateString("hu-HU")}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── ScanHistoryList ────────────────────────────────────

function ScanHistoryList({ runs }: { runs: ScrapeRun[] }) {
  const [openRun, setOpenRun] = useState<string | null>(null);
  const [runListings, setRunListings] = useState<Record<string, Listing[]>>({});
  const [loadingRun, setLoadingRun] = useState<string | null>(null);

  const toggleRun = async (runId: string) => {
    if (openRun === runId) { setOpenRun(null); return; }
    setOpenRun(runId);
    if (!runListings[runId]) {
      setLoadingRun(runId);
      try {
        const res = await api.get(`/partner-monitor/runs/${runId}/listings`);
        setRunListings(p => ({ ...p, [runId]: res.data }));
      } catch { /* ignore */ }
      setLoadingRun(null);
    }
  };

  return (
    <div className="divide-y dark:divide-gray-700">
      {runs.map(run => {
        const duration = run.finishedAt ? Math.round((new Date(run.finishedAt).getTime() - new Date(run.startedAt).getTime()) / 1000) : null;
        const isOpen = openRun === run.id;
        const listings = runListings[run.id] || [];
        return (
          <div key={run.id}>
            <button onClick={() => toggleRun(run.id)} className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition text-sm">
              <div className="flex items-center gap-3">
                <svg className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-90" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-gray-700 dark:text-gray-300">{new Date(run.startedAt).toLocaleString("hu-HU")}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${run.status === "completed" ? "bg-green-100 text-green-700" : run.status === "failed" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
                  {run.status === "completed" ? "Kész" : run.status === "failed" ? "Hiba" : "Fut..."}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>{run.partnersScanned} partner</span>
                {run.newListings > 0 ? <span className="font-semibold text-green-600">{run.newListings} új</span> : <span>0 új</span>}
                {run.errors > 0 && <span className="text-red-500">{run.errors} hiba</span>}
                {duration !== null && <span>{duration}s</span>}
              </div>
            </button>
            {isOpen && (
              <div className="bg-gray-50/50 dark:bg-gray-900/30 border-t dark:border-gray-700 px-4 py-3">
                {loadingRun === run.id ? (
                  <p className="text-xs text-gray-400 py-2">Betöltés...</p>
                ) : listings.length === 0 ? (
                  <p className="text-xs text-gray-400 py-2">Nem találtunk új hirdetést ebben a keresésben.</p>
                ) : (
                  <CompanyAccordion listings={listings} />
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── TrendChart ─────────────────────────────────────────

function TrendChart({ listId }: { listId?: string }) {
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [companies, setCompanies] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null); // null = összesített
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get("/partner-monitor/chart", { params: { listId } })
      .then(res => { setChartData(res.data.chartData); setCompanies(res.data.companies); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [listId]);

  if (loading) return <div className="p-6 text-center text-gray-400 text-sm">Diagram betöltése...</div>;
  if (chartData.length < 2) return <div className="p-6 text-center text-gray-400 text-sm">Legalább 2 keresés kell a diagramhoz.</div>;

  return (
    <div>
      <div className="px-4 py-2 flex flex-wrap gap-2 items-center">
        <button onClick={() => setSelected(null)}
          className={`px-2.5 py-1 rounded-full text-xs font-medium transition ${!selected ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200"}`}>
          Összesített
        </button>
        {companies.map((c, i) => (
          <button key={c} onClick={() => setSelected(selected === c ? null : c)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition ${selected === c ? "text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200"}`}
            style={selected === c ? { backgroundColor: COLORS[i % COLORS.length] } : {}}>
            {c}
          </button>
        ))}
      </div>
      <div className="h-64 px-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip contentStyle={{ fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {selected ? (
              <Line type="monotone" dataKey={selected} stroke={COLORS[companies.indexOf(selected) % COLORS.length]}
                strokeWidth={2} dot={{ r: 4 }} name={selected} />
            ) : (
              <>
                <Line type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} name="Összesen" />
                {companies.map((c, i) => (
                  <Line key={c} type="monotone" dataKey={c} stroke={COLORS[i % COLORS.length]}
                    strokeWidth={1} dot={false} strokeDasharray="4 2" name={c} />
                ))}
              </>
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────

export default function PartnerMonitorPage() {
  const [lists, setLists] = useState<PartnerListSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newList, setNewList] = useState({ name: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [selectedList, setSelectedList] = useState<string | null>(null);
  const [listDetail, setListDetail] = useState<any>(null);
  const [runs, setRuns] = useState<ScrapeRun[]>([]);
  const [scanning, setScanning] = useState(false);

  // Digest config
  const [digestConfig, setDigestConfig] = useState({ enabled: true, emails: [] as string[] });
  const [newEmail, setNewEmail] = useState("");

  const loadLists = () => {
    api.get("/partner-monitor/lists")
      .then(res => setLists(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const loadListDetail = (listId: string) => {
    Promise.all([
      api.get(`/partner-monitor/lists/${listId}`),
      api.get("/partner-monitor/runs", { params: { listId } }),
    ]).then(([detailRes, runsRes]) => {
      setListDetail(detailRes.data);
      setRuns(runsRes.data);
    }).catch(() => {});
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadLists();
    api.get("/partner-monitor/digest-config").then(r => setDigestConfig({ enabled: r.data.enabled, emails: r.data.emails || [] })).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedList) loadListDetail(selectedList);
    else { setListDetail(null); setRuns([]); }
  }, [selectedList]);

  const createList = async () => {
    setSaving(true);
    try {
      const res = await api.post("/partner-monitor/lists", newList);
      setNewList({ name: "", description: "" });
      setShowCreate(false);
      loadLists();
      setSelectedList(res.data.id);
    } catch { /* ignore */ }
    setSaving(false);
  };

  const deleteList = async (id: string, name: string) => {
    if (!confirm(`Biztosan törli a "${name}" listát?`)) return;
    await api.delete(`/partner-monitor/lists/${id}`);
    if (selectedList === id) setSelectedList(null);
    loadLists();
  };

  const scanList = async () => {
    if (!selectedList) return;
    setScanning(true);
    try {
      await api.post(`/partner-monitor/lists/${selectedList}/scan`);
      loadListDetail(selectedList);
      loadLists();
    } catch { /* ignore */ }
    setScanning(false);
  };

  const saveDigest = (update: Partial<typeof digestConfig>) => {
    const updated = { ...digestConfig, ...update };
    api.put("/partner-monitor/digest-config", updated).then(() => setDigestConfig(updated)).catch(() => {});
  };

  if (loading) return <div className="text-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" /></div>;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Partner Monitor</h1>
          <p className="text-sm text-gray-500 mt-1">Keresési listák kezelése — profession.hu állásfigyelés</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/partners/manage" className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-300 transition">
            Összes partner
          </Link>
          <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition">
            + Új lista
          </button>
        </div>
      </div>

      {/* Create list modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4 dark:text-white">Új keresési lista</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Lista neve *</label>
                <input type="text" value={newList.name} onChange={e => setNewList({ ...newList, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="pl. Konkurencia elemzés" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Leírás</label>
                <input type="text" value={newList.description} onChange={e => setNewList({ ...newList, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Opcionális leírás..." />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={createList} disabled={!newList.name || saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                {saving ? "Mentés..." : "Létrehozás"}
              </button>
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium">Mégse</button>
            </div>
          </div>
        </div>
      )}

      {/* Lists tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {lists.map(list => (
          <button key={list.id} onClick={() => setSelectedList(selectedList === list.id ? null : list.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${selectedList === list.id ? "bg-blue-600 text-white" : "bg-white dark:bg-gray-800 border dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50"}`}>
            {list.name}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${selectedList === list.id ? "bg-blue-500" : "bg-gray-100 dark:bg-gray-700"}`}>
              {list._count.partners}
            </span>
          </button>
        ))}
        {lists.length === 0 && (
          <p className="text-sm text-gray-400">Még nincs keresési lista. Hozzon létre egyet!</p>
        )}
      </div>

      {/* Selected list detail */}
      {selectedList && listDetail && (
        <div className="space-y-6">
          {/* List header with actions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{listDetail.name}</h2>
              <div className="flex gap-2">
                <button onClick={scanList} disabled={scanning} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50">
                  {scanning ? "Scan fut..." : "Scan indítása"}
                </button>
                <button onClick={() => deleteList(listDetail.id, listDetail.name)} className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100">Törlés</button>
              </div>
            </div>
            {listDetail.description && <p className="text-sm text-gray-500">{listDetail.description}</p>}
            <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-600 dark:text-gray-400">
              <span>{listDetail.partners?.length || 0} partner</span>
              <span>{listDetail.partners?.reduce((sum: number, p: any) => sum + (p.jobListings?.length || 0), 0) || 0} aktív pozíció</span>
              {listDetail.scrapeRuns?.[0] && (
                <span>Utolsó scan: {new Date(listDetail.scrapeRuns[0].startedAt).toLocaleString("hu-HU")}</span>
              )}
            </div>
          </div>

          {/* Trend chart */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 overflow-hidden">
            <div className="px-4 py-3 border-b dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Pozíciók trendje</h3>
            </div>
            <TrendChart listId={selectedList} />
          </div>

          {/* Partners in this list */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 overflow-hidden">
            <div className="px-4 py-3 border-b dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Cégek ({listDetail.partners?.length || 0})</h3>
              <Link href={`/admin/partners/manage?listId=${selectedList}`} className="text-xs text-blue-600 hover:underline">Kezelés</Link>
            </div>
            {listDetail.partners?.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-sm">Még nincs cég a listában. <Link href={`/admin/partners/manage?listId=${selectedList}`} className="text-blue-600 underline">Adjon hozzá!</Link></div>
            ) : (
              <div className="divide-y dark:divide-gray-700">
                {listDetail.partners?.map((p: any) => (
                  <div key={p.id} className="px-4 py-2 flex items-center justify-between">
                    <Link href={`/admin/partners/${p.id}`} className="text-sm font-medium text-gray-900 dark:text-white hover:text-blue-600">{p.companyName}</Link>
                    <span className={`text-xs font-semibold ${p.jobListings?.length > 0 ? "text-green-600" : "text-gray-400"}`}>
                      {p.jobListings?.length || 0} pozíció
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Scan history */}
          {runs.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 overflow-hidden">
              <div className="px-4 py-3 border-b dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Korábbi keresések</h3>
              </div>
              <ScanHistoryList runs={runs} />
            </div>
          )}
        </div>
      )}

      {/* Email settings (below lists) */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-4 mt-6">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Email értesítések</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={digestConfig.enabled} onChange={e => saveDigest({ enabled: e.target.checked })} className="sr-only peer" />
              <div className="w-9 h-5 bg-gray-200 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
            </label>
            <span className="text-sm text-gray-700 dark:text-gray-300">Napi email riport (minden reggel 6:00)</span>
          </div>
          {digestConfig.enabled && (
            <>
              <p className="text-xs text-gray-500">A saját email címére automatikusan megy. Extra címzettek:</p>
              <div className="flex gap-2">
                <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { const em = newEmail.trim().toLowerCase(); if (em.includes("@") && !digestConfig.emails.includes(em)) { saveDigest({ emails: [...digestConfig.emails, em] }); setNewEmail(""); } } }}
                  placeholder="kolléga@ceg.hu" className="flex-1 px-3 py-1.5 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                <button onClick={() => { const em = newEmail.trim().toLowerCase(); if (em.includes("@") && !digestConfig.emails.includes(em)) { saveDigest({ emails: [...digestConfig.emails, em] }); setNewEmail(""); } }}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Hozzáadás</button>
              </div>
              {digestConfig.emails.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {digestConfig.emails.map(email => (
                    <span key={email} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs">
                      {email}
                      <button onClick={() => saveDigest({ emails: digestConfig.emails.filter(e => e !== email) })} className="text-gray-400 hover:text-red-500">&times;</button>
                    </span>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
