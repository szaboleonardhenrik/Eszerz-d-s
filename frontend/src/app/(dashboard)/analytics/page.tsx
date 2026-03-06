"use client";

import { useEffect, useState, useMemo } from "react";
import api from "@/lib/api";
import toast from "react-hot-toast";

interface Overview {
  total: number;
  completionRate: number;
  avgSigningTime: number;
  totalSigners: number;
  activeThisMonth: number;
}

interface StatusItem {
  status: string;
  count: number;
}

interface MonthlyItem {
  month: string;
  created: number;
  completed: number;
}

interface TemplateItem {
  name: string;
  count: number;
}

interface SignerStats {
  avgSignersPerContract: number;
  fastestSigner: { name: string; email: string; days: number } | null;
  mostActiveSigner: { email: string; count: number } | null;
}

interface AnalyticsData {
  overview: Overview;
  statusBreakdown: StatusItem[];
  monthlyTrend: MonthlyItem[];
  topTemplates: TemplateItem[];
  signerStats: SignerStats;
  expirationRate: number;
}

const statusLabels: Record<string, string> = {
  draft: "Piszkozat",
  sent: "Elk\u00fcldve",
  partially_signed: "R\u00e9szben al\u00e1\u00edrt",
  completed: "K\u00e9sz",
  declined: "Visszautas\u00edtva",
  expired: "Lej\u00e1rt",
  cancelled: "Visszavonva",
};

const statusColors: Record<string, string> = {
  draft: "#9CA3AF",
  sent: "#F59E0B",
  partially_signed: "#F97316",
  completed: "#10B981",
  declined: "#EF4444",
  expired: "#6B7280",
  cancelled: "#D1D5DB",
};

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const res = await api.get("/contracts/analytics");
      setData(res.data.data);
    } catch {
      toast.error("Hiba az analitika bet\u00f6lt\u00e9sekor");
    } finally {
      setLoading(false);
    }
  };

  const chartMax = useMemo(() => {
    if (!data?.monthlyTrend) return 1;
    return Math.max(
      ...data.monthlyTrend.map((m) => Math.max(m.created, m.completed)),
      1
    );
  }, [data]);

  const donutGradient = useMemo(() => {
    if (!data?.statusBreakdown) return "conic-gradient(#E5E7EB 0deg 360deg)";
    const total = data.statusBreakdown.reduce((s, i) => s + i.count, 0);
    if (total === 0) return "conic-gradient(#E5E7EB 0deg 360deg)";

    let currentDeg = 0;
    const segments: string[] = [];
    for (const item of data.statusBreakdown) {
      const deg = (item.count / total) * 360;
      const color = statusColors[item.status] ?? "#9CA3AF";
      segments.push(`${color} ${currentDeg}deg ${currentDeg + deg}deg`);
      currentDeg += deg;
    }
    return `conic-gradient(${segments.join(", ")})`;
  }, [data]);

  const templateMax = useMemo(() => {
    if (!data?.topTemplates?.length) return 1;
    return Math.max(...data.topTemplates.map((t) => t.count), 1);
  }, [data]);

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Analitika</h1>
        {/* Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-xl p-5 bg-gray-100 animate-pulse h-28"
            />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          <div className="lg:col-span-2 bg-gray-100 animate-pulse rounded-xl h-72" />
          <div className="bg-gray-100 animate-pulse rounded-xl h-72" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-gray-100 animate-pulse rounded-xl h-64" />
          <div className="bg-gray-100 animate-pulse rounded-xl h-64" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Analitika</h1>
        <p className="text-gray-500">Nem siker\u00fclt bet\u00f6lteni az adatokat.</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Analitika</h1>

      {/* Overview row - 4 stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <OverviewCard
          label="\u00d6sszes szerz\u0151d\u00e9s"
          value={String(data.overview.total)}
          icon="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
        <OverviewCard
          label="Teljes\u00edt\u00e9si ar\u00e1ny"
          value={`${data.overview.completionRate}%`}
          icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
        <OverviewCard
          label="\u00c1tl. al\u00e1\u00edr\u00e1si id\u0151"
          value={`${data.overview.avgSigningTime} nap`}
          icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
        <OverviewCard
          label="Akt\u00edv e h\u00f3napban"
          value={String(data.overview.activeThisMonth)}
          icon="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        {/* Monthly trend bar chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            Havi trend (utols\u00f3 12 h\u00f3nap)
          </h3>
          <div className="flex items-end gap-2 h-48">
            {data.monthlyTrend.map((m, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex gap-0.5 items-end justify-center h-40">
                  <div
                    className="flex-1 max-w-4 rounded-t transition-all"
                    style={{
                      height: `${Math.max((m.created / chartMax) * 100, 4)}%`,
                      backgroundColor: "#41A5B9",
                    }}
                    title={`L\u00e9trehozott: ${m.created}`}
                  />
                  <div
                    className="flex-1 max-w-4 rounded-t transition-all"
                    style={{
                      height: `${Math.max((m.completed / chartMax) * 100, 4)}%`,
                      backgroundColor: "#D29B01",
                    }}
                    title={`Teljes\u00edtett: ${m.completed}`}
                  />
                </div>
                <span className="text-[10px] text-gray-400 truncate w-full text-center leading-tight">
                  {m.month.replace(".", "")}
                </span>
              </div>
            ))}
          </div>
          <div className="flex gap-6 mt-4 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <span
                className="w-3 h-3 rounded-sm inline-block"
                style={{ backgroundColor: "#41A5B9" }}
              />{" "}
              L\u00e9trehozott
            </span>
            <span className="flex items-center gap-1.5">
              <span
                className="w-3 h-3 rounded-sm inline-block"
                style={{ backgroundColor: "#D29B01" }}
              />{" "}
              Teljes\u00edtett
            </span>
          </div>
        </div>

        {/* Status donut chart */}
        <div className="bg-white rounded-xl border p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            St\u00e1tusz megoszl\u00e1s
          </h3>
          <div className="flex justify-center mb-4">
            <div
              className="w-40 h-40 rounded-full relative"
              style={{ background: donutGradient }}
            >
              <div className="absolute inset-5 bg-white rounded-full flex items-center justify-center">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">
                    {data.overview.total}
                  </p>
                  <p className="text-xs text-gray-400">\u00f6sszes</p>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            {data.statusBreakdown.map((item) => (
              <div
                key={item.status}
                className="flex items-center justify-between text-sm"
              >
                <span className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full inline-block"
                    style={{
                      backgroundColor:
                        statusColors[item.status] ?? "#9CA3AF",
                    }}
                  />
                  <span className="text-gray-600">
                    {statusLabels[item.status] ?? item.status}
                  </span>
                </span>
                <span className="font-medium text-gray-900">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tables row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top 5 templates */}
        <div className="bg-white rounded-xl border p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            Top 5 sablon
          </h3>
          {data.topTemplates.length === 0 ? (
            <p className="text-sm text-gray-400">
              M\u00e9g nincs sablon-haszn\u00e1lat.
            </p>
          ) : (
            <div className="space-y-3">
              {data.topTemplates.map((t, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700 font-medium truncate mr-2">
                      {t.name}
                    </span>
                    <span className="text-gray-500 flex-shrink-0">
                      {t.count} szerz\u0151d\u00e9s
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(t.count / templateMax) * 100}%`,
                        backgroundColor: "#41A5B9",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Signer performance stats */}
        <div className="bg-white rounded-xl border p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            Al\u00e1\u00edr\u00f3 statisztik\u00e1k
          </h3>
          <div className="space-y-4">
            <StatRow
              label="\u00c1tlagos al\u00e1\u00edr\u00f3k sz\u00e1ma / szerz\u0151d\u00e9s"
              value={String(data.signerStats.avgSignersPerContract)}
            />
            <StatRow
              label="Leggyorsabb al\u00e1\u00edr\u00f3"
              value={
                data.signerStats.fastestSigner
                  ? `${data.signerStats.fastestSigner.name} (${data.signerStats.fastestSigner.days} nap)`
                  : "-"
              }
              sub={data.signerStats.fastestSigner?.email}
            />
            <StatRow
              label="Legakt\u00edvabb al\u00e1\u00edr\u00f3"
              value={
                data.signerStats.mostActiveSigner
                  ? `${data.signerStats.mostActiveSigner.email}`
                  : "-"
              }
              sub={
                data.signerStats.mostActiveSigner
                  ? `${data.signerStats.mostActiveSigner.count} szerz\u0151d\u00e9s`
                  : undefined
              }
            />
            <StatRow
              label="Lej\u00e1rati ar\u00e1ny"
              value={`${data.expirationRate}%`}
              sub="Lej\u00e1rt / \u00f6sszes szerz\u0151d\u00e9s"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function OverviewCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  return (
    <div
      className="rounded-xl p-5 text-white transition hover:shadow-md"
      style={{
        background: "linear-gradient(135deg, #41A5B9 0%, #198296 100%)",
      }}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm opacity-80">{label}</p>
        <svg
          className="w-5 h-5 opacity-50"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d={icon}
          />
        </svg>
      </div>
      <p className="text-3xl font-bold mt-1">{value}</p>
    </div>
  );
}

function StatRow({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-sm font-semibold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}
