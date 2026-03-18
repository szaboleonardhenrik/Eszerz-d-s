"use client";

import { useEffect, useRef, useState } from "react";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { testSections, type TestSection, type TestCase } from "./test-data";

interface TestResult {
  testId: string;
  status: string;
  assignedTo: string | null;
  notes: string | null;
  screenshots: string[];
  updatedBy: string | null;
  updatedAt: string;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "Várakozik", color: "text-gray-500", bg: "bg-gray-100" },
  in_progress: { label: "Folyamatban", color: "text-blue-600", bg: "bg-blue-100" },
  pass: { label: "Sikeres", color: "text-green-600", bg: "bg-green-100" },
  fail: { label: "Sikertelen", color: "text-red-600", bg: "bg-red-100" },
  blocked: { label: "Blokkolva", color: "text-orange-600", bg: "bg-orange-100" },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  critical: { label: "Kritikus", color: "text-red-600 bg-red-50 border-red-200" },
  high: { label: "Magas", color: "text-orange-600 bg-orange-50 border-orange-200" },
  medium: { label: "Közepes", color: "text-yellow-600 bg-yellow-50 border-yellow-200" },
  low: { label: "Alacsony", color: "text-gray-500 bg-gray-50 border-gray-200" },
};

export default function TestingPage() {
  const [results, setResults] = useState<Record<string, TestResult>>({});
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState<string | null>("auth");
  const [expandedCase, setExpandedCase] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all"); // all | my | pending | fail

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [resultsRes, teamRes] = await Promise.all([
        api.get("/admin/testing"),
        api.get("/admin/testing/team"),
      ]);
      const resultsMap: Record<string, TestResult> = {};
      for (const r of resultsRes.data.data) resultsMap[r.testId] = r;
      setResults(resultsMap);
      setTeam(teamRes.data.data);
    } catch {
      toast.error("Hiba a betöltéskor");
    } finally {
      setLoading(false);
    }
  };

  const updateTest = async (testId: string, data: { status?: string; assignedTo?: string; notes?: string }) => {
    try {
      const res = await api.put(`/admin/testing/${testId}`, data);
      setResults((prev) => ({ ...prev, [testId]: res.data.data }));
    } catch {
      toast.error("Hiba a mentéskor");
    }
  };

  const totalCases = testSections.reduce((acc, s) => acc + s.cases.length, 0);
  const passed = Object.values(results).filter((r) => r.status === "pass").length;
  const failed = Object.values(results).filter((r) => r.status === "fail").length;
  const inProgress = Object.values(results).filter((r) => r.status === "in_progress").length;
  const completed = passed + failed;

  const filterCase = (tc: TestCase) => {
    const r = results[tc.id];
    if (filter === "pending") return !r || r.status === "pending";
    if (filter === "fail") return r?.status === "fail";
    if (filter === "my") return r?.assignedTo && team.some((m) => m.name === r.assignedTo);
    return true;
  };

  if (loading) return <div className="p-12 text-center text-gray-400">Betöltés...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Rendszer Tesztelés</h1>
          <p className="text-sm text-gray-500 mt-1">Teszt esetek kezelése és kiosztása a csapatnak</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white dark:bg-gray-800 rounded-xl border p-4 text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalCases}</div>
          <div className="text-xs text-gray-400">Összes</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{passed}</div>
          <div className="text-xs text-gray-400">Sikeres</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{failed}</div>
          <div className="text-xs text-gray-400">Sikertelen</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{inProgress}</div>
          <div className="text-xs text-gray-400">Folyamatban</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border p-4 text-center">
          <div className="text-2xl font-bold text-gray-400">{totalCases - completed - inProgress}</div>
          <div className="text-xs text-gray-400">Hátra</div>
        </div>
      </div>

      {/* Progress */}
      <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden flex">
        {passed > 0 && <div className="bg-green-500 transition-all" style={{ width: `${(passed / totalCases) * 100}%` }} />}
        {failed > 0 && <div className="bg-red-500 transition-all" style={{ width: `${(failed / totalCases) * 100}%` }} />}
        {inProgress > 0 && <div className="bg-blue-400 transition-all" style={{ width: `${(inProgress / totalCases) * 100}%` }} />}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: "all", label: "Mind" },
          { key: "pending", label: "Várakozik" },
          { key: "fail", label: "Sikertelen" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              filter === f.key ? "bg-[#198296] text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Sections */}
      {testSections.map((section) => {
        const filteredCases = section.cases.filter(filterCase);
        if (filteredCases.length === 0 && filter !== "all") return null;
        const sectionPassed = section.cases.filter((c) => results[c.id]?.status === "pass").length;
        const sectionTotal = section.cases.length;

        return (
          <div key={section.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <button
              onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{section.icon}</span>
                <span className="font-semibold text-gray-900 dark:text-white">{section.title}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  sectionPassed === sectionTotal ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                }`}>
                  {sectionPassed}/{sectionTotal}
                </span>
              </div>
              <svg className={`w-5 h-5 text-gray-400 transition-transform ${expandedSection === section.id ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {expandedSection === section.id && (
              <div className="border-t border-gray-100 dark:border-gray-700">
                {(filter === "all" ? section.cases : filteredCases).map((tc) => (
                  <TestCaseRow
                    key={tc.id}
                    tc={tc}
                    result={results[tc.id]}
                    team={team}
                    expanded={expandedCase === tc.id}
                    onToggle={() => setExpandedCase(expandedCase === tc.id ? null : tc.id)}
                    onUpdate={(data) => updateTest(tc.id, data)}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function TestCaseRow({
  tc,
  result,
  team,
  expanded,
  onToggle,
  onUpdate,
}: {
  tc: TestCase;
  result?: TestResult;
  team: TeamMember[];
  expanded: boolean;
  onToggle: () => void;
  onUpdate: (data: { status?: string; assignedTo?: string; notes?: string; screenshotBase64?: string }) => void;
}) {
  const [notes, setNotes] = useState(result?.notes || "");
  const [screenshotUrls, setScreenshotUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const screenshotRef = useRef<HTMLInputElement>(null);
  const status = result?.status || "pending";
  const sc = statusConfig[status] || statusConfig.pending;
  const pc = priorityConfig[tc.priority];

  return (
    <div className="border-b border-gray-50 dark:border-gray-700/50 last:border-0">
      <button onClick={onToggle} className="w-full px-5 py-3 flex items-center gap-3 hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition text-left">
        {/* Status dot */}
        <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
          status === "pass" ? "bg-green-500" : status === "fail" ? "bg-red-500" : status === "in_progress" ? "bg-blue-500" : status === "blocked" ? "bg-orange-500" : "bg-gray-300"
        }`} />

        {/* Title */}
        <span className="text-sm flex-1 text-gray-700 dark:text-gray-300 font-medium">{tc.title}</span>

        {/* Priority */}
        <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${pc.color}`}>{pc.label}</span>

        {/* Assignee */}
        {result?.assignedTo && (
          <span className="text-xs px-2 py-0.5 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-full">{result.assignedTo}</span>
        )}

        {/* Status badge */}
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sc.bg} ${sc.color}`}>{sc.label}</span>

        <svg className={`w-4 h-4 text-gray-300 transition-transform flex-shrink-0 ${expanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="px-5 pb-5 ml-5">
          {/* Description */}
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{tc.description}</p>

          {/* Steps */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Lépések</p>
            <ol className="space-y-1.5 bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
              {tc.steps.map((step, i) => (
                <li key={i} className="text-sm text-gray-600 dark:text-gray-400 flex gap-2.5">
                  <span className="text-[#198296] font-bold font-mono text-xs mt-0.5 min-w-[18px]">{i + 1}.</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          {/* Expected */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-4 mb-4">
            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">Elvárt eredmény</p>
            <p className="text-sm text-blue-800 dark:text-blue-300">{tc.expected}</p>
          </div>

          {/* Assignee */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block">Felelős</label>
              <select
                value={result?.assignedTo || ""}
                onChange={(e) => onUpdate({ assignedTo: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white"
              >
                <option value="">Nincs kijelölve</option>
                {team.map((m) => (
                  <option key={m.id} value={m.name}>{m.name} ({m.role})</option>
                ))}
              </select>
            </div>

            {result?.updatedBy && (
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block">Utolsó módosító</label>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{result.updatedBy} — {new Date(result.updatedAt).toLocaleString("hu-HU")}</p>
              </div>
            )}
          </div>

          {/* Status buttons */}
          <div className="flex flex-wrap gap-2 mb-4">
            {Object.entries(statusConfig).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => onUpdate({ status: key })}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
                  status === key ? `${cfg.bg} ${cfg.color} border-current ring-2 ring-current/20` : "border-gray-200 dark:border-gray-600 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                {cfg.label}
              </button>
            ))}
          </div>

          {/* Notes */}
          <div className="mb-4">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block">Megjegyzés</label>
            <div className="flex gap-2">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Mi volt a hiba? Részletek..."
                rows={2}
                className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white resize-none"
              />
              <button
                onClick={() => { onUpdate({ notes }); toast.success("Megjegyzés mentve"); }}
                className="px-3 py-2 bg-[#198296] text-white rounded-lg text-xs font-medium hover:bg-[#146d7d] transition self-end"
              >
                Mentés
              </button>
            </div>
          </div>

          {/* Screenshots */}
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Screenshotok</label>
            {/* Existing screenshots */}
            {(result?.screenshots?.length ?? 0) > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {result!.screenshots.map((key, i) => (
                  <ScreenshotThumb key={i} storageKey={key} />
                ))}
              </div>
            )}
            {/* Upload */}
            <button
              onClick={() => screenshotRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-xs text-gray-500 hover:border-[#198296] hover:text-[#198296] transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {uploading ? "Feltöltés..." : "Screenshot feltöltése"}
            </button>
            <input
              ref={screenshotRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (file.size > 5 * 1024 * 1024) { toast.error("Max 5MB"); return; }
                setUploading(true);
                const reader = new FileReader();
                reader.onload = async () => {
                  onUpdate({ screenshotBase64: reader.result as string });
                  toast.success("Screenshot feltöltve!");
                  setUploading(false);
                };
                reader.readAsDataURL(file);
                e.target.value = "";
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function ScreenshotThumb({ storageKey }: { storageKey: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    api.get(`/admin/testing/screenshot/${storageKey}`)
      .then((res) => setUrl(res.data.data.url))
      .catch(() => {});
  }, [storageKey]);

  if (!url) return <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />;

  return (
    <>
      <button onClick={() => setFullscreen(true)} className="relative group">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt="Screenshot" className="w-16 h-16 object-cover rounded-lg border border-gray-200 dark:border-gray-600 hover:ring-2 hover:ring-[#198296] transition" />
        <span className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 rounded-lg transition">
          <svg className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
          </svg>
        </span>
      </button>
      {fullscreen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setFullscreen(false)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="Screenshot nagyítva" className="max-w-full max-h-full rounded-lg shadow-2xl" />
          <button onClick={() => setFullscreen(false)} className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white text-xl transition">
            ✕
          </button>
        </div>
      )}
    </>
  );
}
