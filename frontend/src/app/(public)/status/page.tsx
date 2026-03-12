"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface HealthData {
  status: "ok" | "degraded" | "error";
  timestamp: string;
  uptime: number;
  version: string;
  services: Record<string, string>;
  responseTime?: number;
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    ok: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    degraded: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    error: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };
  const labels: Record<string, string> = {
    ok: "Működik",
    degraded: "Részleges kiesés",
    error: "Leállt",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${colors[status] || colors.error}`}>
      <span className={`w-2 h-2 rounded-full ${status === "ok" ? "bg-emerald-500" : status === "degraded" ? "bg-amber-500" : "bg-red-500"}`} />
      {labels[status] || "Ismeretlen"}
    </span>
  );
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d} nap ${h} óra`;
  if (h > 0) return `${h} óra ${m} perc`;
  return `${m} perc`;
}

export default function StatusPage() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const fetchHealth = async () => {
    setLoading(true);
    const start = Date.now();
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "";
      const url = apiBase.endsWith("/api") ? `${apiBase}/health` : `${apiBase}/api/health`;
      const res = await fetch(url, {
        cache: "no-store",
      });
      const data = await res.json();
      data.responseTime = Date.now() - start;
      setHealth(data);
      setError(false);
    } catch {
      setError(true);
      setHealth(null);
    } finally {
      setLoading(false);
      setLastCheck(new Date());
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const overallStatus = error ? "error" : health?.status || "error";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="max-w-3xl mx-auto px-4 py-6 flex items-center justify-between">
          <Link href="/landing" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">L</span>
            </div>
            <span className="font-semibold text-gray-900 dark:text-white">Legitas</span>
          </Link>
          <span className="text-sm text-gray-500 dark:text-gray-400">Rendszer állapot</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {/* Overall Status */}
        <div className={`rounded-2xl p-8 text-center ${
          overallStatus === "ok"
            ? "bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800"
            : overallStatus === "degraded"
            ? "bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800"
            : "bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800"
        }`}>
          {loading && !health ? (
            <div className="flex items-center justify-center gap-2 text-gray-500">
              <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Ellenőrzés...
            </div>
          ) : (
            <>
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                overallStatus === "ok" ? "bg-emerald-100 dark:bg-emerald-900/50" :
                overallStatus === "degraded" ? "bg-amber-100 dark:bg-amber-900/50" :
                "bg-red-100 dark:bg-red-900/50"
              }`}>
                {overallStatus === "ok" ? (
                  <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                )}
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {overallStatus === "ok" ? "Minden rendszer működik" :
                 overallStatus === "degraded" ? "Részleges szolgáltatáskiesés" :
                 "Szolgáltatás nem elérhető"}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Utolsó ellenőrzés: {lastCheck?.toLocaleTimeString("hu-HU") || "–"}
                {" · "}
                <button onClick={fetchHealth} className="text-blue-600 hover:underline">
                  Frissítés
                </button>
              </p>
            </>
          )}
        </div>

        {/* Services */}
        {health && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
            <div className="px-6 py-4">
              <h2 className="font-semibold text-gray-900 dark:text-white">Szolgáltatások</h2>
            </div>

            {/* API */}
            <div className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2" />
                </svg>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">API szerver</p>
                  <p className="text-xs text-gray-500">Backend szolgáltatás (NestJS)</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {health.responseTime && (
                  <span className="text-xs text-gray-400">{health.responseTime}ms</span>
                )}
                <StatusBadge status={health.status === "ok" ? "ok" : "error"} />
              </div>
            </div>

            {/* Database */}
            <div className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Adatbázis</p>
                  <p className="text-xs text-gray-500">PostgreSQL</p>
                </div>
              </div>
              <StatusBadge status={health.services.database} />
            </div>

            {/* WebSocket */}
            <div className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">WebSocket</p>
                  <p className="text-xs text-gray-500">Valós idejű értesítések</p>
                </div>
              </div>
              <StatusBadge status={health.services.websocket} />
            </div>

            {/* Email */}
            <div className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Email szolgáltatás</p>
                  <p className="text-xs text-gray-500">Resend (noreply@legitas.hu)</p>
                </div>
              </div>
              <StatusBadge status={health.services.email || "ok"} />
            </div>

            {/* Storage */}
            <div className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Fájltárolás</p>
                  <p className="text-xs text-gray-500">Cloudflare R2</p>
                </div>
              </div>
              <StatusBadge status={health.services.storage || "ok"} />
            </div>
          </div>
        )}

        {/* Metrics */}
        {health && (
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{health.responseTime || "–"}ms</p>
              <p className="text-xs text-gray-500 mt-1">Válaszidő</p>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatUptime(health.uptime)}</p>
              <p className="text-xs text-gray-500 mt-1">Üzemidő</p>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">v{health.version}</p>
              <p className="text-xs text-gray-500 mt-1">Verzió</p>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-red-200 dark:border-red-800 p-8 text-center">
            <p className="text-red-600 dark:text-red-400 font-medium mb-2">Nem sikerült csatlakozni az API szerverhez</p>
            <p className="text-sm text-gray-500 mb-4">A szerver lehet, hogy karbantartás alatt áll.</p>
            <button
              onClick={fetchHealth}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
            >
              Újrapróbálás
            </button>
          </div>
        )}

        {/* Info */}
        <div className="text-center text-sm text-gray-400 dark:text-gray-500 space-y-1">
          <p>Az oldal automatikusan frissül 30 másodpercenként.</p>
          <p>Probléma esetén írj nekünk: <a href="mailto:support@legitas.hu" className="text-blue-600 hover:underline">support@legitas.hu</a></p>
        </div>
      </main>
    </div>
  );
}
