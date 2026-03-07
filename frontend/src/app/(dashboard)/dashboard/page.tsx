"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { SkeletonStats, SkeletonRow } from "@/components/skeleton";
import EmptyState from "@/components/empty-state";
import ActivityFeed from "@/components/activity-feed";
import WidgetReorder from "@/components/widget-reorder";

interface MonthlyData {
  month: string;
  created: number;
  signed: number;
}

interface Usage {
  used: number;
  limit: number;
  tier: string;
}

interface Stats {
  total: number;
  draft: number;
  awaitingSignature: number;
  completed: number;
  declined: number;
  expired: number;
  monthlyStats: MonthlyData[];
  usage: Usage;
}

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface Contract {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  signers: { name: string; email: string; status: string; role: string }[];
  template?: { name: string; category: string };
  tags?: { tag: Tag }[];
}

interface Pagination {
  items: Contract[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface Widget {
  expiringContracts: { id: string; title: string; expiresAt: string; pendingSigners: number; totalSigners: number }[];
  awaitingSignature: { id: string; title: string; pendingSigners: string[]; waitingSince: string }[];
  recentlyCompleted: { id: string; title: string; updatedAt: string }[];
}

/* ── Mini Chart Components (SVG-based, no external deps) ─────────── */

function MiniLineChart({ data, dataKeyA, dataKeyB, colorA, colorB, height = 200 }: {
  data: MonthlyData[];
  dataKeyA: "created" | "signed";
  dataKeyB: "created" | "signed";
  colorA: string;
  colorB: string;
  height?: number;
}) {
  if (!data.length) return null;
  const w = 100;
  const h = height;
  const pad = { t: 20, r: 10, b: 30, l: 35 };
  const iw = w - pad.l - pad.r;
  const ih = h - pad.t - pad.b;

  const maxVal = Math.max(1, ...data.map(d => Math.max(d[dataKeyA], d[dataKeyB])));
  const xStep = data.length > 1 ? iw / (data.length - 1) : iw;

  const toPath = (key: "created" | "signed") =>
    data.map((d, i) => {
      const x = pad.l + (data.length > 1 ? i * xStep : iw / 2);
      const y = pad.t + ih - (d[key] / maxVal) * ih;
      return `${i === 0 ? "M" : "L"}${x},${y}`;
    }).join(" ");

  const toArea = (key: "created" | "signed") => {
    const line = data.map((d, i) => {
      const x = pad.l + (data.length > 1 ? i * xStep : iw / 2);
      const y = pad.t + ih - (d[key] / maxVal) * ih;
      return `${x},${y}`;
    });
    return `M${line[0]} ${line.join(" L")} L${pad.l + (data.length > 1 ? (data.length - 1) * xStep : iw / 2)},${pad.t + ih} L${pad.l},${pad.t + ih} Z`;
  };

  const gridLines = [0, 0.25, 0.5, 0.75, 1].map(f => ({
    y: pad.t + ih - f * ih,
    label: Math.round(maxVal * f),
  }));

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="xMidYMid meet">
      {/* Grid */}
      {gridLines.map((g, i) => (
        <g key={i}>
          <line x1={pad.l} y1={g.y} x2={w - pad.r} y2={g.y} stroke="#e5e7eb" strokeWidth="0.3" strokeDasharray="1,1" />
          <text x={pad.l - 2} y={g.y + 1} textAnchor="end" className="fill-gray-400" fontSize="3">{g.label}</text>
        </g>
      ))}
      {/* X labels */}
      {data.map((d, i) => (
        <text key={i} x={pad.l + (data.length > 1 ? i * xStep : iw / 2)} y={h - 5} textAnchor="middle" className="fill-gray-400" fontSize="2.8">
          {d.month.slice(0, 3)}
        </text>
      ))}
      {/* Area fills */}
      <path d={toArea(dataKeyA)} fill={colorA} opacity="0.1" />
      <path d={toArea(dataKeyB)} fill={colorB} opacity="0.1" />
      {/* Lines */}
      <path d={toPath(dataKeyA)} fill="none" stroke={colorA} strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d={toPath(dataKeyB)} fill="none" stroke={colorB} strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" />
      {/* Dots */}
      {data.map((d, i) => (
        <g key={i}>
          <circle cx={pad.l + (data.length > 1 ? i * xStep : iw / 2)} cy={pad.t + ih - (d[dataKeyA] / maxVal) * ih} r="1.2" fill={colorA} />
          <circle cx={pad.l + (data.length > 1 ? i * xStep : iw / 2)} cy={pad.t + ih - (d[dataKeyB] / maxVal) * ih} r="1.2" fill={colorB} />
        </g>
      ))}
    </svg>
  );
}

function DonutChart({ segments, size = 120 }: {
  segments: { label: string; value: number; color: string }[];
  size?: number;
}) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) return null;
  const r = 40;
  const cx = 50;
  const cy = 50;
  const strokeW = 12;
  const circ = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      <svg viewBox="0 0 100 100" width={size} height={size} className="shrink-0">
        {segments.filter(s => s.value > 0).map((seg, i) => {
          const pct = seg.value / total;
          const dash = pct * circ;
          const gap = circ - dash;
          const cur = offset;
          offset += dash;
          return (
            <circle
              key={i}
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={strokeW}
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={-cur}
              strokeLinecap="round"
              transform={`rotate(-90 ${cx} ${cy})`}
              className="transition-all duration-700"
            />
          );
        })}
        <text x={cx} y={cy - 3} textAnchor="middle" className="fill-gray-900 dark:fill-gray-100 font-bold" fontSize="14">{total}</text>
        <text x={cx} y={cy + 8} textAnchor="middle" className="fill-gray-400" fontSize="5">szerződés</text>
      </svg>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {segments.filter(s => s.value > 0).map((seg, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
            <span className="text-gray-600 dark:text-gray-400">{seg.label}</span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BarChart({ data, height = 160 }: { data: MonthlyData[]; height?: number }) {
  if (!data.length) return null;
  const maxVal = Math.max(1, ...data.map(d => d.created + d.signed));
  const barW = Math.min(8, 60 / data.length);

  return (
    <div className="flex items-end gap-1 justify-center" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="flex flex-col items-center gap-0.5">
          <div className="flex gap-px items-end">
            <div
              className="rounded-t transition-all duration-500"
              style={{
                width: barW,
                height: Math.max(2, (d.created / maxVal) * (height - 30)),
                backgroundColor: "#198296",
              }}
              title={`Létrehozott: ${d.created}`}
            />
            <div
              className="rounded-t transition-all duration-500"
              style={{
                width: barW,
                height: Math.max(2, (d.signed / maxVal) * (height - 30)),
                backgroundColor: "#D29B01",
              }}
              title={`Aláírt: ${d.signed}`}
            />
          </div>
          <span className="text-[9px] text-gray-400 mt-1">{d.month.slice(0, 3)}</span>
        </div>
      ))}
    </div>
  );
}

function SignatureRateGauge({ completed, total }: { completed: number; total: number }) {
  const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
  const r = 40;
  const circ = Math.PI * r; // half circle
  const fill = (rate / 100) * circ;

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 100 55" width={160} height={90}>
        <path
          d={`M 10 50 A 40 40 0 0 1 90 50`}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <path
          d={`M 10 50 A 40 40 0 0 1 90 50`}
          fill="none"
          stroke={rate >= 70 ? "#22c55e" : rate >= 40 ? "#D29B01" : "#ef4444"}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${fill} ${circ}`}
          className="transition-all duration-1000"
        />
        <text x="50" y="48" textAnchor="middle" className="fill-gray-900 dark:fill-gray-100 font-bold" fontSize="16">{rate}%</text>
      </svg>
      <p className="text-xs text-gray-500 -mt-1">
        {completed} / {total} szerződés aláírva
      </p>
    </div>
  );
}

/* ── Stat Card ─────────────────────────────────────────────────────── */

const statConfig = [
  { key: "total", label: "Összes", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", color: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" },
  { key: "draft", label: "Piszkozat", icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z", color: "bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-400" },
  { key: "awaitingSignature", label: "Aláírásra vár", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", color: "bg-yellow-50 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400" },
  { key: "completed", label: "Befejezett", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", color: "bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400" },
  { key: "declined", label: "Elutasított", icon: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z", color: "bg-red-50 text-red-500 dark:bg-red-900/30 dark:text-red-400" },
  { key: "expired", label: "Lejárt", icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z", color: "bg-orange-50 text-orange-500 dark:bg-orange-900/30 dark:text-orange-400" },
];

/* ══════════════════════════════════════════════════════════════════ */
/*  DASHBOARD PAGE                                                    */
/* ══════════════════════════════════════════════════════════════════ */

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [widgets, setWidgets] = useState<Widget | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  const loadData = useCallback(async () => {
    try {
      const [statsRes, widgetsRes, contractsRes] = await Promise.all([
        api.get("/contracts/stats"),
        api.get("/contracts/widgets"),
        api.get("/contracts", {
          params: {
            page,
            limit: 10,
            ...(statusFilter !== "all" ? { status: statusFilter } : {}),
            ...(search ? { search } : {}),
          },
        }),
      ]);
      setStats(statsRes.data.data);
      setWidgets(widgetsRes.data.data);
      const pagination = contractsRes.data.data;
      setContracts(pagination.items ?? []);
      setTotalPages(pagination.totalPages ?? 1);
    } catch (err) {
      toast.error("Hiba az adatok betöltésekor");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const debouncedSearch = useCallback((val: string) => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setSearch(val);
      setPage(1);
    }, 400);
  }, []);

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
    draft: "bg-gray-100 text-gray-600",
    sent: "bg-blue-100 text-blue-700",
    partially_signed: "bg-yellow-100 text-yellow-700",
    completed: "bg-green-100 text-green-700",
    declined: "bg-red-100 text-red-600",
    expired: "bg-orange-100 text-orange-700",
    cancelled: "bg-gray-200 text-gray-600",
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonStats />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonRow />
          <SkeletonRow />
        </div>
      </div>
    );
  }

  if (stats && stats.total === 0 && contracts.length === 0) {
    return (
      <EmptyState
        icon="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        title="Még nincs szerződésed"
        description="Hozd létre az első szerződésedet, és kezdj el digitálisan szerződni!"
        actionLabel="Első szerződés létrehozása"
        actionHref="/create"
      />
    );
  }

  const donutSegments = stats ? [
    { label: "Piszkozat", value: stats.draft, color: "#6b7280" },
    { label: "Aláírásra vár", value: stats.awaitingSignature, color: "#eab308" },
    { label: "Befejezett", value: stats.completed, color: "#22c55e" },
    { label: "Elutasított", value: stats.declined, color: "#ef4444" },
    { label: "Lejárt", value: stats.expired, color: "#f97316" },
  ] : [];

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Áttekintés</h1>
          <p className="text-sm text-gray-500 mt-1">Szerződéseid aktuális állapota és statisztikái</p>
        </div>
        <Link
          href="/create"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition shadow-sm self-start sm:self-auto"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Új szerződés
        </Link>
      </div>

      {/* ── Stat Cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {statConfig.map((sc) => {
          const value = stats ? (stats as any)[sc.key] : 0;
          return (
            <div
              key={sc.key}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg ${sc.color} flex items-center justify-center shrink-0`}>
                  <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={sc.icon} />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium truncate">{sc.label}</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Usage Bar ───────────────────────────────────────────── */}
      {stats?.usage && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Felhasználás</span>
              <span className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full font-medium">
                {stats.usage.tier} csomag
              </span>
            </div>
            <span className="text-sm text-gray-500">
              {stats.usage.limit === -1
                ? `${stats.usage.used} szerződés (Korlátlan)`
                : `${stats.usage.used} / ${stats.usage.limit} szerződés`}
            </span>
          </div>
          {stats.usage.limit !== -1 && (
            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5">
              <div
                className="h-2.5 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, (stats.usage.used / stats.usage.limit) * 100)}%`,
                  backgroundColor: stats.usage.used / stats.usage.limit > 0.9 ? "#ef4444" : stats.usage.used / stats.usage.limit > 0.7 ? "#eab308" : "#198296",
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* ── Charts Row ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Monthly Trend Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Havi trend</h2>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 rounded bg-[#198296]" />
                <span className="text-gray-500">Létrehozott</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 rounded bg-[#D29B01]" />
                <span className="text-gray-500">Aláírt</span>
              </span>
            </div>
          </div>
          {stats?.monthlyStats && stats.monthlyStats.length > 0 ? (
            <MiniLineChart
              data={stats.monthlyStats}
              dataKeyA="created"
              dataKeyB="signed"
              colorA="#198296"
              colorB="#D29B01"
              height={180}
            />
          ) : (
            <div className="h-44 flex items-center justify-center text-gray-400 text-sm">
              Még nincs elég adat a grafikonhoz
            </div>
          )}
        </div>

        {/* Status Distribution Donut */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-4">Státusz megoszlás</h2>
          {stats && stats.total > 0 ? (
            <DonutChart segments={donutSegments} size={110} />
          ) : (
            <div className="h-32 flex items-center justify-center text-gray-400 text-sm">
              Nincs adat
            </div>
          )}
        </div>
      </div>

      {/* ── Signature Rate + Bar Chart Row ──────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Signature Rate Gauge */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-4">Aláírási arány</h2>
          {stats ? (
            <SignatureRateGauge completed={stats.completed} total={stats.total} />
          ) : null}
        </div>

        {/* Bar Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Havi összehasonlítás</h2>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#198296]" />
                <span className="text-gray-500">Létrehozott</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#D29B01]" />
                <span className="text-gray-500">Aláírt</span>
              </span>
            </div>
          </div>
          {stats?.monthlyStats && stats.monthlyStats.length > 0 ? (
            <BarChart data={stats.monthlyStats} height={140} />
          ) : (
            <div className="h-36 flex items-center justify-center text-gray-400 text-sm">
              Még nincs elég adat
            </div>
          )}
        </div>
      </div>

      {/* ── Widgets ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Expiring Contracts */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center">
              <svg className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">Hamarosan lejáró</h3>
          </div>
          <div className="space-y-2">
            {widgets?.expiringContracts?.length ? (
              widgets.expiringContracts.slice(0, 5).map((c) => (
                <Link
                  key={c.id}
                  href={`/contracts/${c.id}`}
                  className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm group"
                >
                  <span className="text-gray-700 dark:text-gray-300 truncate flex-1 group-hover:text-blue-600">{c.title}</span>
                  <span className="text-xs text-orange-500 shrink-0 ml-2">
                    {new Date(c.expiresAt).toLocaleDateString("hu-HU")}
                  </span>
                </Link>
              ))
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">Nincs lejáró szerződés</p>
            )}
          </div>
        </div>

        {/* Awaiting Signature */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-yellow-50 dark:bg-yellow-900/30 flex items-center justify-center">
              <svg className="w-4 h-4 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">Aláírásra váró</h3>
          </div>
          <div className="space-y-2">
            {widgets?.awaitingSignature?.length ? (
              widgets.awaitingSignature.slice(0, 5).map((c) => (
                <Link
                  key={c.id}
                  href={`/contracts/${c.id}`}
                  className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm group"
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-gray-700 dark:text-gray-300 truncate block group-hover:text-blue-600">{c.title}</span>
                    <span className="text-[11px] text-gray-400">
                      {c.pendingSigners?.length} aláíró vár
                    </span>
                  </div>
                  <span className="text-[11px] text-gray-400 shrink-0 ml-2">
                    {new Date(c.waitingSince).toLocaleDateString("hu-HU")}
                  </span>
                </Link>
              ))
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">Nincs várakozó szerződés</p>
            )}
          </div>
        </div>

        {/* Recently Completed */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-green-50 dark:bg-green-900/30 flex items-center justify-center">
              <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">Nemrég befejezett</h3>
          </div>
          <div className="space-y-2">
            {widgets?.recentlyCompleted?.length ? (
              widgets.recentlyCompleted.slice(0, 5).map((c) => (
                <Link
                  key={c.id}
                  href={`/contracts/${c.id}`}
                  className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm group"
                >
                  <span className="text-gray-700 dark:text-gray-300 truncate flex-1 group-hover:text-blue-600">{c.title}</span>
                  <span className="text-[11px] text-gray-400 shrink-0 ml-2">
                    {new Date(c.updatedAt).toLocaleDateString("hu-HU")}
                  </span>
                </Link>
              ))
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">Nincs befejezett szerződés</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Activity Feed ───────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-4">Legutóbbi tevékenységek</h2>
        <ActivityFeed />
      </div>

      {/* ── Contract List ───────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Szerződés keresése..."
                onChange={(e) => debouncedSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700"
              />
            </div>
            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 min-w-[140px]"
            >
              <option value="all">Minden státusz</option>
              {Object.entries(statusLabels).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table - Desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700 text-left">
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Szerződés</th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Státusz</th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Aláírók</th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Létrehozva</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((c) => (
                <tr key={c.id} className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                  <td className="px-4 py-3">
                    <Link href={`/contracts/${c.id}`} className="font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600 transition">
                      {c.title}
                    </Link>
                    {c.template && (
                      <p className="text-xs text-gray-400 mt-0.5">{c.template.name}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[c.status] ?? "bg-gray-100 text-gray-600"}`}>
                      {statusLabels[c.status] ?? c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex -space-x-1">
                      {c.signers?.slice(0, 3).map((s, i) => (
                        <div
                          key={i}
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold ring-2 ring-white dark:ring-gray-800 ${
                            s.status === "signed" ? "bg-green-500" : s.status === "declined" ? "bg-red-400" : "bg-gray-400"
                          }`}
                          title={`${s.name} (${s.status})`}
                        >
                          {s.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                      ))}
                      {c.signers?.length > 3 && (
                        <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-[10px] font-medium text-gray-600 dark:text-gray-300 ring-2 ring-white dark:ring-gray-800">
                          +{c.signers.length - 3}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(c.createdAt).toLocaleDateString("hu-HU")}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/contracts/${c.id}`}
                      className="text-blue-600 hover:text-blue-700 text-xs font-medium"
                    >
                      Megnyitás
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Cards - Mobile */}
        <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-700">
          {contracts.map((c) => (
            <Link
              key={c.id}
              href={`/contracts/${c.id}`}
              className="block p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{c.title}</p>
                  {c.template && (
                    <p className="text-xs text-gray-400 mt-0.5">{c.template.name}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColors[c.status] ?? "bg-gray-100 text-gray-600"}`}>
                      {statusLabels[c.status] ?? c.status}
                    </span>
                    <span className="text-[11px] text-gray-400">
                      {new Date(c.createdAt).toLocaleDateString("hu-HU")}
                    </span>
                  </div>
                </div>
                <div className="flex -space-x-1 shrink-0">
                  {c.signers?.slice(0, 2).map((s, i) => (
                    <div
                      key={i}
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold ring-2 ring-white dark:ring-gray-800 ${
                        s.status === "signed" ? "bg-green-500" : "bg-gray-400"
                      }`}
                    >
                      {s.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </div>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* No results */}
        {contracts.length === 0 && !loading && (
          <div className="p-8 text-center text-gray-400 text-sm">
            Nincs találat a szűrőknek megfelelő szerződés.
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-700">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              Előző
            </button>
            <span className="text-sm text-gray-500">{page} / {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              Következő
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
