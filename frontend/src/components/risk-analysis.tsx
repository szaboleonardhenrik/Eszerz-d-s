"use client";

import { useState } from "react";
import api from "@/lib/api";
import toast from "react-hot-toast";

interface Issue {
  title: string;
  description: string;
  severity: "info" | "warning" | "error" | "critical";
  suggestion: string;
}

interface Category {
  name: string;
  risk: "low" | "medium" | "high" | "critical";
  issues: Issue[];
}

interface RiskData {
  overallRisk: "low" | "medium" | "high" | "critical";
  score: number;
  categories: Category[];
  summary: string;
}

const riskColors = {
  low: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", badge: "bg-green-100 text-green-800", bar: "bg-green-500" },
  medium: { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200", badge: "bg-yellow-100 text-yellow-800", bar: "bg-yellow-500" },
  high: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", badge: "bg-orange-100 text-orange-800", bar: "bg-orange-500" },
  critical: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", badge: "bg-red-100 text-red-800", bar: "bg-red-500" },
};

const riskLabels = {
  low: "Alacsony",
  medium: "Közepes",
  high: "Magas",
  critical: "Kritikus",
};

const severityIcons: Record<string, string> = {
  info: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  warning: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z",
  error: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z",
  critical: "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
};

const severityColors: Record<string, string> = {
  info: "text-blue-500",
  warning: "text-yellow-500",
  error: "text-orange-500",
  critical: "text-red-500",
};

export default function RiskAnalysis({ contractId }: { contractId: string }) {
  const [data, setData] = useState<RiskData | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const analyze = async () => {
    setLoading(true);
    try {
      const res = await api.post(`/ai/risk-analysis/${contractId}`);
      setData(res.data.data);
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message ?? "Hiba a kockázatelemzés során");
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (i: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  if (!data) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center">
              <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">AI Kockázatelemzés</h3>
              <p className="text-xs text-gray-500">Automatikus jogi kockázat-feltérképezés Claude AI-val</p>
            </div>
          </div>
          <button
            onClick={analyze}
            disabled={loading}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Elemzés...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Kockázatelemzés indítása
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  const rc = riskColors[data.overallRisk];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header with score */}
      <div className={`${rc.bg} p-6 border-b ${rc.border}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Risk gauge */}
            <div className="relative w-20 h-20 shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="42" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="42" fill="none"
                  stroke={data.score >= 70 ? "#ef4444" : data.score >= 40 ? "#f59e0b" : "#22c55e"}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${(data.score / 100) * 264} 264`}
                  className="transition-all duration-1000"
                />
              </svg>
              <span className={`absolute inset-0 flex items-center justify-center text-xl font-bold ${rc.text}`}>
                {data.score}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-gray-900 text-lg">Kockázati szint</h3>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${rc.badge}`}>
                  {riskLabels[data.overallRisk]}
                </span>
              </div>
              <p className="text-sm text-gray-600">{data.summary}</p>
            </div>
          </div>
          <button
            onClick={analyze}
            disabled={loading}
            className="text-sm text-gray-500 hover:text-gray-700 transition flex items-center gap-1 shrink-0"
          >
            <svg className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Újraelemzés
          </button>
        </div>
      </div>

      {/* Categories */}
      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {data.categories.map((cat, i) => {
          const cc = riskColors[cat.risk];
          const isExpanded = expanded.has(i);
          return (
            <div key={i}>
              <button
                onClick={() => toggleCategory(i)}
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
              >
                <div className="flex items-center gap-3">
                  <span className={`w-2.5 h-2.5 rounded-full ${cc.bar}`} />
                  <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">{cat.name}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${cc.badge}`}>
                    {riskLabels[cat.risk]}
                  </span>
                  {cat.issues.length > 0 && (
                    <span className="text-xs text-gray-400">{cat.issues.length} probléma</span>
                  )}
                </div>
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isExpanded && cat.issues.length > 0 && (
                <div className="px-6 pb-4 space-y-3">
                  {cat.issues.map((issue, j) => (
                    <div
                      key={j}
                      className="border border-gray-100 dark:border-gray-700 rounded-lg p-4"
                    >
                      <div className="flex items-start gap-3">
                        <svg
                          className={`w-5 h-5 mt-0.5 shrink-0 ${severityColors[issue.severity]}`}
                          fill="none" viewBox="0 0 24 24" stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d={severityIcons[issue.severity]} />
                        </svg>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">{issue.title}</p>
                          <p className="text-xs text-gray-500 mt-1">{issue.description}</p>
                          {issue.suggestion && (
                            <div className="mt-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg px-3 py-2">
                              <p className="text-xs text-blue-700 dark:text-blue-400">
                                <span className="font-semibold">Javaslat:</span> {issue.suggestion}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {data.categories.length === 0 && (
        <div className="p-8 text-center text-gray-400 text-sm">
          Nem találtunk konkrét kockázati kategóriákat.
        </div>
      )}
    </div>
  );
}
