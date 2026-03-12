"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { useAuth } from "@/lib/auth-store";
import ActivityFeed from "@/components/activity-feed";

/* ── Tier Limits ─────────────────────────────────────────────────── */

const tierLimits: Record<string, { contracts: number; team: number; api: number; storage: number }> = {
  free: { contracts: 5, team: 1, api: 0, storage: 100 },
  basic: { contracts: 30, team: 3, api: 100, storage: 1000 },
  pro: { contracts: -1, team: 10, api: -1, storage: 5000 },
};

const tierBadgeColors: Record<string, string> = {
  free: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
  basic: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  pro: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
};

const tierLabels: Record<string, string> = {
  free: "Ingyenes",
  basic: "Közepes",
  pro: "Prémium",
};

const statusLabels: Record<string, string> = {
  draft: "Piszkozat",
  sent: "Elküldve",
  partially_signed: "Részben aláírt",
  completed: "Befejezett",
  declined: "Elutasított",
  expired: "Lejárt",
  cancelled: "Visszavont",
};

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
  sent: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  partially_signed: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  completed: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  declined: "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300",
  expired: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  cancelled: "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400",
};

/* ── Interfaces ──────────────────────────────────────────────────── */

interface Stats {
  total: number;
  draft: number;
  awaitingSignature: number;
  completed: number;
  declined: number;
  expired: number;
  usage?: { used: number; limit: number; tier: string };
}

interface Contract {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  signers: { name: string; email: string; status: string }[];
}

interface QuoteStats {
  total: number;
  draft: number;
  sent: number;
  accepted: number;
  declined: number;
  expired: number;
  totalRevenue: number;
}

interface WidgetData {
  teamMembersCount?: number;
  storageUsedMb?: number;
  apiCallsToday?: number;
}

interface DashboardAlerts {
  expiringIn7Days: { id: string; title: string; daysUntilExpiry: number }[];
  expiringIn30Days: { id: string; title: string; daysUntilExpiry: number }[];
  staleUnsigned: { id: string; title: string; daysSinceCreated: number }[];
  totalAlerts: number;
}

/* ── Progress Bar Component ──────────────────────────────────────── */

function ProgressBar({ used, limit, label, sublabel }: { used: number; limit: number; label: string; sublabel: string }) {
  const isUnlimited = limit === -1;
  const pct = isUnlimited ? 0 : limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
  const barColor = pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-yellow-500" : "bg-green-500";

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</p>
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {isUnlimited ? (
            <>{used} / <span className="text-purple-600 dark:text-purple-400">Korlátlan</span></>
          ) : (
            <>{used} <span className="text-gray-400 font-normal">/ {limit}</span></>
          )}
        </p>
      </div>
      <p className="text-xs text-gray-400 mb-3">{sublabel}</p>
      {!isUnlimited ? (
        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-700 ${barColor}`}
            style={{ width: `${Math.max(pct, 1)}%` }}
          />
        </div>
      ) : (
        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
          <div className="h-2 rounded-full bg-purple-400 dark:bg-purple-500 w-full opacity-30" />
        </div>
      )}
    </div>
  );
}

/* ── Stat Card Component ─────────────────────────────────────────── */

function StatCard({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  const borderClass = accent === "yellow"
    ? "border-l-yellow-400"
    : accent === "green"
    ? "border-l-green-500"
    : accent === "blue"
    ? "border-l-blue-500"
    : "border-l-gray-300 dark:border-l-gray-600";

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 border-l-4 ${borderClass} p-5`}>
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{value}</p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════ */
/*  DASHBOARD PAGE                                                    */
/* ══════════════════════════════════════════════════════════════════ */

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [quoteStats, setQuoteStats] = useState<QuoteStats | null>(null);
  const [widgetData, setWidgetData] = useState<WidgetData | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [alerts, setAlerts] = useState<DashboardAlerts | null>(null);
  const [loading, setLoading] = useState(true);

  const tier = (user?.subscriptionTier ?? "free") as keyof typeof tierLimits;
  const limits = tierLimits[tier] ?? tierLimits.free;

  const loadData = useCallback(async () => {
    try {
      const [statsRes, widgetsRes, contractsRes, quoteStatsRes, alertsRes] = await Promise.all([
        api.get("/contracts/stats"),
        api.get("/contracts/widgets").catch(() => ({ data: { data: null } })),
        api.get("/contracts", { params: { limit: 5 } }),
        api.get("/quotes/stats").catch(() => ({ data: { data: null } })),
        api.get("/reminders/alerts").catch(() => ({ data: { data: null } })),
      ]);
      setStats(statsRes.data.data);
      setWidgetData(widgetsRes.data.data);
      const pagination = contractsRes.data.data;
      setContracts(pagination.items ?? []);
      setQuoteStats(quoteStatsRes.data.data);
      setAlerts(alertsRes.data.data);
    } catch {
      toast.error("Hiba az adatok betöltésekor");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatHuf = (amount: number) =>
    new Intl.NumberFormat("hu-HU").format(Math.round(amount)) + " Ft";

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 bg-gray-100 dark:bg-gray-800 rounded-xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-gray-100 dark:bg-gray-800 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 h-64 bg-gray-100 dark:bg-gray-800 rounded-xl" />
          <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-xl" />
        </div>
      </div>
    );
  }

  const contractsUsed = stats?.usage?.used ?? stats?.total ?? 0;
  const teamUsed = widgetData?.teamMembersCount ?? 1;
  const apiUsed = widgetData?.apiCallsToday ?? 0;
  const storageUsed = widgetData?.storageUsedMb ?? 0;

  return (
    <div className="space-y-6">

      {/* ── 1. Welcome Header ──────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  Üdvözöllek, {user?.name ?? "Felhasználó"}
                </h1>
                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${tierBadgeColors[tier] ?? tierBadgeColors.free}`}>
                  {tierLabels[tier] ?? tier}
                </span>
              </div>
              {user?.companyName && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{user.companyName}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/create"
              className="inline-flex items-center gap-2 bg-gray-900 dark:bg-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Új szerződés
            </Link>
            <Link
              href="/quotes/new"
              className="inline-flex items-center gap-2 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Új ajánlat
            </Link>
            {tier !== "pro" && (
              <Link
                href="/settings/billing"
                className="inline-flex items-center gap-1.5 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 text-sm font-medium transition ml-1"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                Csomag váltás
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ── 1.5 Alerts Banner ──────────────────────────────────── */}
      {alerts && alerts.totalAlerts > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Figyelmeztetések ({alerts.totalAlerts})
              </h2>
            </div>
            <Link
              href="/reminders"
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              Összes megtekintése &rarr;
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {alerts.expiringIn7Days.length > 0 && (
              <Link
                href="/reminders"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30 transition"
              >
                <span className="w-2 h-2 rounded-full bg-red-500" />
                {alerts.expiringIn7Days.length} szerződés 7 napon belül lejár
              </Link>
            )}
            {alerts.expiringIn30Days.length > 0 && (
              <Link
                href="/reminders"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition"
              >
                <span className="w-2 h-2 rounded-full bg-yellow-500" />
                {alerts.expiringIn30Days.length} szerződés 30 napon belül lejár
              </Link>
            )}
            {alerts.staleUnsigned.length > 0 && (
              <Link
                href="/reminders"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition"
              >
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                {alerts.staleUnsigned.length} szerződés 3+ napja aláíratlan
              </Link>
            )}
          </div>
        </div>
      )}

      {/* ── 2. Usage & Limits Row ──────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ProgressBar
          used={contractsUsed}
          limit={limits.contracts}
          label="Szerződések"
          sublabel="Aktív szerződések száma"
        />
        <ProgressBar
          used={teamUsed}
          limit={limits.team}
          label="Csapattagok"
          sublabel="Meghívott felhasználók"
        />
        <ProgressBar
          used={apiUsed}
          limit={limits.api}
          label="API hívások"
          sublabel="Mai napi hívások"
        />
        <ProgressBar
          used={storageUsed}
          limit={limits.storage}
          label="Tárolás"
          sublabel={`${storageUsed} MB használva`}
        />
      </div>

      {/* ── 3. Stats Overview Row ──────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Összes szerződés"
          value={stats?.total ?? 0}
        />
        <StatCard
          label="Aláírásra vár"
          value={stats?.awaitingSignature ?? 0}
          accent="yellow"
        />
        <StatCard
          label="Elfogadott ajánlatok"
          value={quoteStats?.accepted ?? 0}
          accent="green"
        />
        <StatCard
          label="Havi bevétel"
          value={quoteStats?.totalRevenue ? formatHuf(quoteStats.totalRevenue) : "0 Ft"}
          accent="blue"
        />
      </div>

      {/* ── 4. Two-Column Layout ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT: Recent Contracts Table */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
            <h2 className="font-semibold text-sm text-gray-900 dark:text-gray-100">Legutóbbi szerződések</h2>
            <Link href="/contracts" className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 font-medium transition">
              Összes megtekintése &rarr;
            </Link>
          </div>
          {contracts.length > 0 ? (
            <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
              {contracts.map((c) => (
                <Link
                  key={c.id}
                  href={`/contracts/${c.id}`}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition group"
                >
                  <div className="min-w-0 flex-1 mr-4">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                      {c.title}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(c.createdAt).toLocaleDateString("hu-HU")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-gray-400">
                      {c.signers?.length ?? 0} aláíró
                    </span>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ${statusColors[c.status] ?? "bg-gray-100 text-gray-600"}`}>
                      {statusLabels[c.status] ?? c.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="px-5 py-12 text-center">
              <p className="text-sm text-gray-400">Még nincs szerződés</p>
              <Link href="/create" className="text-sm text-blue-600 hover:text-blue-700 font-medium mt-1 inline-block">
                Első szerződés létrehozása &rarr;
              </Link>
            </div>
          )}
        </div>

        {/* RIGHT: Recent Activity Feed */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-4">Legutóbbi események</h2>
          <ActivityFeed limit={8} />
        </div>
      </div>

      {/* ── 5. Quote Stats Row ─────────────────────────────────── */}
      {quoteStats && quoteStats.total > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm text-gray-900 dark:text-gray-100">Ajánlat statisztikák</h2>
            <Link href="/quotes" className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 font-medium transition">
              Összes ajánlat &rarr;
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { label: "Piszkozat", value: quoteStats.draft, color: "text-gray-500" },
              { label: "Elküldve", value: quoteStats.sent, color: "text-blue-600 dark:text-blue-400" },
              { label: "Elfogadva", value: quoteStats.accepted, color: "text-green-600 dark:text-green-400" },
              { label: "Elutasítva", value: quoteStats.declined, color: "text-red-500 dark:text-red-400" },
              { label: "Lejárt", value: quoteStats.expired, color: "text-orange-500 dark:text-orange-400" },
            ].map((s, i) => (
              <div key={i} className="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                <p className="text-[11px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">{s.label}</p>
                <p className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
