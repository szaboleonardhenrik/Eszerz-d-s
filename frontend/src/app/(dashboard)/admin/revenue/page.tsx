"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-store";
import api from "@/lib/api";

const ADMIN_ROLES = ["superadmin", "employee"];

interface RevenueData {
  mrr: number;
  arr: number;
  totalPaid: number;
  totalFree: number;
  conversionRate: number;
  newUsersThisMonth: number;
  newUsersPrevMonth: number;
  userGrowthPct: number;
  conversionsThisMonth: number;
  tierRevenue: Record<string, { count: number; revenue: number }>;
}

const tierLabel: Record<string, string> = {
  free: "Ingyenes",
  starter: "Kezdő",
  medium: "Közepes",
  premium: "Prémium",
  enterprise: "Nagyvállalati",
};

const tierColors: Record<string, string> = {
  free: "#9CA3AF",
  starter: "#38BDF8",
  medium: "#3B82F6",
  premium: "#8B5CF6",
  enterprise: "#F59E0B",
};

function formatHuf(amount: number) {
  return new Intl.NumberFormat("hu-HU", { style: "currency", currency: "HUF", maximumFractionDigits: 0 }).format(amount);
}

export default function AdminRevenuePage() {
  const { user } = useAuth();
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ADMIN_ROLES.includes(user?.role ?? "")) return;
    api.get("/admin/revenue").then((res) => {
      setData(res.data.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user]);

  if (!ADMIN_ROLES.includes(user?.role ?? "")) {
    return <div className="min-h-[60vh] flex items-center justify-center"><p className="text-gray-400">Nincs jogosultságod.</p></div>;
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600 mx-auto" />
      </div>
    );
  }

  if (!data) return <div className="text-center text-gray-400 py-20">Nem sikerült betölteni az adatokat.</div>;

  const totalRevenue = Object.values(data.tierRevenue).reduce((sum, t) => sum + t.revenue, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <Link href="/admin" className="text-violet-600 hover:text-violet-700 dark:text-violet-400">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Bevétel áttekintés</h1>
      </div>

      {/* MRR / ARR cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Havi bevétel (MRR)" value={formatHuf(data.mrr)} color="emerald" />
        <MetricCard label="Éves bevétel (ARR)" value={formatHuf(data.arr)} color="blue" />
        <MetricCard
          label="Konverziós arány"
          value={`${data.conversionRate}%`}
          sub={`${data.totalPaid} fizetős / ${data.totalFree} ingyenes`}
          color="violet"
        />
        <MetricCard
          label="Új felhasználók"
          value={`${data.newUsersThisMonth}`}
          sub={`${data.userGrowthPct >= 0 ? "+" : ""}${data.userGrowthPct}% vs. előző hó`}
          color="amber"
        />
      </div>

      {/* Tier breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Bevétel csomag szerint</h3>
          <div className="space-y-4">
            {Object.entries(data.tierRevenue)
              .sort(([, a], [, b]) => b.revenue - a.revenue)
              .map(([tier, info]) => {
                const pct = totalRevenue > 0 ? (info.revenue / totalRevenue) * 100 : 0;
                return (
                  <div key={tier}>
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: tierColors[tier] || "#6B7280" }} />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{tierLabel[tier] || tier}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{formatHuf(info.revenue)}</span>
                        <span className="text-xs text-gray-400 ml-2">({info.count} fő)</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5">
                      <div className="h-2.5 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: tierColors[tier] || "#6B7280" }} />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Conversion funnel */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Konverziós tölcsér</h3>
          <div className="space-y-4">
            <FunnelStep label="Összes felhasználó" value={data.totalFree + data.totalPaid} pct={100} color="#3B82F6" />
            <FunnelStep label="Fizetős előfizetők" value={data.totalPaid} pct={data.totalFree + data.totalPaid > 0 ? (data.totalPaid / (data.totalFree + data.totalPaid)) * 100 : 0} color="#8B5CF6" />
            <FunnelStep label="Havi konverziók" value={data.conversionsThisMonth} pct={data.newUsersThisMonth > 0 ? (data.conversionsThisMonth / data.newUsersThisMonth) * 100 : 0} color="#10B981" />
          </div>

          <div className="mt-6 pt-4 border-t dark:border-gray-700">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-emerald-600">{formatHuf(data.mrr)}</p>
                <p className="text-xs text-gray-400 mt-1">Havi bevétel</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{formatHuf(data.arr)}</p>
                <p className="text-xs text-gray-400 mt-1">Éves vetítés</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  const bg: Record<string, string> = {
    emerald: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600",
    blue: "bg-blue-50 dark:bg-blue-900/20 text-blue-600",
    violet: "bg-violet-50 dark:bg-violet-900/20 text-violet-600",
    amber: "bg-amber-50 dark:bg-amber-900/20 text-amber-600",
  };
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <div className={`inline-block px-2 py-1 rounded-lg text-[10px] font-semibold uppercase mb-3 ${bg[color] || bg.blue}`}>{label}</div>
      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function FunnelStep({ label, value, pct, color }: { label: string; value: number; pct: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
        <div>
          <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{value}</span>
          <span className="text-xs text-gray-400 ml-1">({pct.toFixed(1)}%)</span>
        </div>
      </div>
      <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
        <div className="h-2 rounded-full transition-all" style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}
