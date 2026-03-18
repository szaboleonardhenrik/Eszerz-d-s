"use client";

import { useEffect, useState, useMemo } from "react";
import api from "@/lib/api";
import toast from "react-hot-toast";
import FeatureGate from "@/components/feature-gate";
import { useI18n } from "@/lib/i18n";

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

// statusLabels now come from i18n via contracts.status.* keys

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
  const { t } = useI18n();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const res = await api.get("/contracts/analytics");
      setData(res.data.data);
    } catch {
      toast.error(t("analytics.loadErrorToast"));
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
    return Math.max(...data.topTemplates.map((tmpl) => tmpl.count), 1);
  }, [data]);

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-8">{t("analytics.title")}</h1>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl p-5 bg-gray-100 dark:bg-gray-800 animate-pulse h-28" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          <div className="lg:col-span-2 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-xl h-72" />
          <div className="bg-gray-100 dark:bg-gray-800 animate-pulse rounded-xl h-72" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-8">{t("analytics.title")}</h1>
        <p className="text-gray-500">{t("analytics.loadError")}</p>
      </div>
    );
  }

  return (
    <FeatureGate featureKey="advanced_analytics" requiredTier="premium" featureName="Statisztika dashboard">
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-8">{t("analytics.title")}</h1>

      {/* Overview row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <OverviewCard
          label={t("analytics.overview.totalContracts")}
          value={String(data.overview.total)}
          icon="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
        <OverviewCard
          label={t("analytics.overview.completionRate")}
          value={`${data.overview.completionRate}%`}
          icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
        <OverviewCard
          label={t("analytics.overview.avgSigningTime")}
          value={t("analytics.overview.avgSigningTimeDays", { days: data.overview.avgSigningTime })}
          icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
        <OverviewCard
          label={t("analytics.overview.activeThisMonth")}
          value={String(data.overview.activeThisMonth)}
          icon="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        {/* Monthly trend */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {t("analytics.charts.monthlyTrend")}
          </h3>
          {data.monthlyTrend.length > 0 ? (
            <>
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
                        title={`${t("analytics.charts.created")}: ${m.created}`}
                      />
                      <div
                        className="flex-1 max-w-4 rounded-t transition-all"
                        style={{
                          height: `${Math.max((m.completed / chartMax) * 100, 4)}%`,
                          backgroundColor: "#D29B01",
                        }}
                        title={`${t("analytics.charts.completed")}: ${m.completed}`}
                      />
                    </div>
                    <span className="text-[10px] text-gray-400 truncate w-full text-center">
                      {m.month.replace(".", "")}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex gap-6 mt-4 text-xs text-gray-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: "#41A5B9" }} />
                  {t("analytics.charts.created")}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: "#D29B01" }} />
                  {t("analytics.charts.completed")}
                </span>
              </div>
            </>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
              {t("analytics.charts.noData")}
            </div>
          )}
        </div>

        {/* Status donut */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {t("analytics.statusBreakdown")}
          </h3>
          <div className="flex justify-center mb-4">
            <div
              className="w-40 h-40 rounded-full relative"
              style={{ background: donutGradient }}
            >
              <div className="absolute inset-5 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {data.overview.total}
                  </p>
                  <p className="text-xs text-gray-400">{t("analytics.totalLabel")}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            {data.statusBreakdown.map((item) => (
              <div key={item.status} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full inline-block"
                    style={{ backgroundColor: statusColors[item.status] ?? "#9CA3AF" }}
                  />
                  <span className="text-gray-600 dark:text-gray-400">
                    {t(`contracts.status.${item.status}`) !== `contracts.status.${item.status}` ? t(`contracts.status.${item.status}`) : item.status}
                  </span>
                </span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top templates */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {t("analytics.topTemplates")}
          </h3>
          {data.topTemplates.length === 0 ? (
            <p className="text-sm text-gray-400">{t("analytics.noTemplateUsage")}</p>
          ) : (
            <div className="space-y-3">
              {data.topTemplates.map((tmpl, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700 dark:text-gray-300 font-medium truncate mr-2">{tmpl.name}</span>
                    <span className="text-gray-500 flex-shrink-0">{t("analytics.templateCount", { count: tmpl.count })}</span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(tmpl.count / templateMax) * 100}%`,
                        backgroundColor: "#41A5B9",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Signer stats */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {t("analytics.signerStats.title")}
          </h3>
          <div className="space-y-4">
            <StatRow
              label={t("analytics.signerStats.avgPerContract")}
              value={String(data.signerStats.avgSignersPerContract)}
            />
            <StatRow
              label={t("analytics.signerStats.fastest")}
              value={
                data.signerStats.fastestSigner
                  ? t("analytics.signerStats.fastestDays", { name: data.signerStats.fastestSigner.name, days: data.signerStats.fastestSigner.days })
                  : "-"
              }
              sub={data.signerStats.fastestSigner?.email}
            />
            <StatRow
              label={t("analytics.signerStats.mostActive")}
              value={
                data.signerStats.mostActiveSigner
                  ? `${data.signerStats.mostActiveSigner.email}`
                  : "-"
              }
              sub={
                data.signerStats.mostActiveSigner
                  ? t("analytics.signerStats.mostActiveContracts", { count: data.signerStats.mostActiveSigner.count })
                  : undefined
              }
            />
            <StatRow
              label={t("analytics.signerStats.expirationRate")}
              value={`${data.expirationRate}%`}
              sub={t("analytics.signerStats.expirationSub")}
            />
          </div>
        </div>
      </div>
    </div>
    </FeatureGate>
  );
}

function OverviewCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div
      className="rounded-xl p-5 text-white transition hover:shadow-md"
      style={{ background: "linear-gradient(135deg, #41A5B9 0%, #198296 100%)" }}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm opacity-80">{label}</p>
        <svg className="w-5 h-5 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={icon} />
        </svg>
      </div>
      <p className="text-3xl font-bold mt-1">{value}</p>
    </div>
  );
}

function StatRow({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="border-b border-gray-100 dark:border-gray-700 pb-3 last:border-0 last:pb-0">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}
