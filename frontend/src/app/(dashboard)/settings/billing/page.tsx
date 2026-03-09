"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-store";
import api from "@/lib/api";
import toast from "react-hot-toast";

type BillingCycle = "monthly" | "yearly";

interface Plan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  monthlyPriceId: string;
  yearlyPriceId: string;
  contractsPerMonth: number;
  subAccounts: number;
  signersPerContract: number;
  timestampsPerYear: number;
  supportResponseTime: string;
  popular?: boolean;
  features: string[];
  notIncluded: string[];
}

const plans: Plan[] = [
  {
    id: "starter",
    name: "Kezdő",
    description: "Egyéni vállalkozóknak",
    monthlyPrice: 975,
    yearlyPrice: 11700,
    monthlyPriceId: "price_1T96w70CjO0XpW1r4a09Iuga",
    yearlyPriceId: "price_1T96w90CjO0XpW1rrKk2XqDG",
    contractsPerMonth: 2,
    subAccounts: 0,
    signersPerContract: 2,
    timestampsPerYear: 24,
    supportResponseTime: "72 óra",
    features: [
      "2 szerződés / hó",
      "2 aláíró / szerződés",
      "Korlátlan tárolás és letöltés",
      "AI asszisztens és elemző",
      "Elektronikus kézi aláírás",
      "Adatvédelmi pajzs",
    ],
    notIncluded: [
      "Társfiókok",
      "Sablontár",
      "CRM",
      "Tömeges műveletek",
      "API hozzáférés",
    ],
  },
  {
    id: "medium",
    name: "Közepes",
    description: "Mikro-vállalkozásoknak",
    monthlyPrice: 14950,
    yearlyPrice: 179400,
    monthlyPriceId: "price_1T96w80CjO0XpW1rdd6PZov3",
    yearlyPriceId: "price_1T96wA0CjO0XpW1rF6syDHHp",
    contractsPerMonth: 12,
    subAccounts: 2,
    signersPerContract: 10,
    timestampsPerYear: 144,
    supportResponseTime: "36 óra",
    features: [
      "12 szerződés / hó",
      "2 társfiók, 10 aláíró",
      "Korlátlan saját sablon",
      "Partnerlista (CRM)",
      "Email követés és ütemezés",
      "Excel/CSV export",
    ],
    notIncluded: [
      "Tömeges műveletek",
      "API hozzáférés",
      "Branding",
    ],
  },
  {
    id: "premium",
    name: "Prémium",
    description: "KKV-knak",
    monthlyPrice: 26000,
    yearlyPrice: 312000,
    monthlyPriceId: "price_1T96w80CjO0XpW1rcI3G3km6",
    yearlyPriceId: "price_1T96wB0CjO0XpW1rMJVopbNa",
    contractsPerMonth: 35,
    subAccounts: 5,
    signersPerContract: 10,
    timestampsPerYear: 420,
    supportResponseTime: "24 óra",
    popular: true,
    features: [
      "35 szerződés / hó",
      "5 társfiók, 10 aláíró",
      "Tömeges műveletek és branding",
      "Statisztika dashboard",
      "XML Agent API + JSON szinkron",
      "2FA és automatizált műveletek",
    ],
    notIncluded: [],
  },
  {
    id: "enterprise",
    name: "Nagyvállalati",
    description: "Nagyvállalatoknak",
    monthlyPrice: 149500,
    yearlyPrice: 1794000,
    monthlyPriceId: "price_1T96w90CjO0XpW1rNK3MSf49",
    yearlyPriceId: "price_1T96wB0CjO0XpW1rAoJI5LbM",
    contractsPerMonth: 500,
    subAccounts: 20,
    signersPerContract: 10,
    timestampsPerYear: 6000,
    supportResponseTime: "12 óra",
    features: [
      "500 szerződés / hó",
      "20 társfiók, 10 aláíró",
      "Kiemelt kapcsolattartó",
      "Onboarding oktatás (2 óra)",
      "Védett hálózati hozzáférés",
      "Haladó jogosultságkezelő",
    ],
    notIncluded: [],
  },
];

const USAGE_LIMITS: Record<string, { contracts: number; users: number }> = {
  free: { contracts: 5, users: 1 },
  starter: { contracts: 2, users: 1 },
  medium: { contracts: 12, users: 3 },
  premium: { contracts: 35, users: 6 },
  enterprise: { contracts: 500, users: 21 },
};

const PLAN_ORDER = ["free", "starter", "medium", "premium", "enterprise"];

function formatPrice(price: number): string {
  return price.toLocaleString("hu-HU");
}

interface UsageData {
  used: number;
  limit: number;
  tier: string;
}

export default function BillingSettings() {
  const user = useAuth((s) => s.user);
  const currentPlan = user?.subscriptionTier ?? "free";
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [cycle, setCycle] = useState<BillingCycle>("monthly");

  useEffect(() => {
    api
      .get("/contracts/stats")
      .then((res) => {
        setUsage(res.data.data.usage);
      })
      .catch(() => {});
  }, []);

  const handleCheckout = async (priceId: string) => {
    setLoading(priceId);
    try {
      const res = await api.post("/billing/checkout", { priceId });
      const url = res.data.data.url;
      if (url) {
        window.location.href = url;
      }
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message || err?.message || "";
      if (
        msg.includes("Invalid API Key") ||
        msg.includes("placeholder") ||
        !msg
      ) {
        toast.error("Stripe hamarosan elérhető");
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(null);
    }
  };

  const handlePortal = async () => {
    setLoading("portal");
    try {
      const res = await api.post("/billing/portal");
      const url = res.data.data.url;
      if (url) {
        window.location.href = url;
      }
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message || err?.message || "";
      if (
        msg.includes("Invalid API Key") ||
        msg.includes("placeholder") ||
        msg.includes("Nincs Stripe")
      ) {
        toast.error("Stripe hamarosan elérhető");
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(null);
    }
  };

  const planNameMap: Record<string, string> = {
    free: "Ingyenes",
    starter: "Kezdő",
    basic: "Kezdő",
    medium: "Közepes",
    pro: "Prémium",
    premium: "Prémium",
    enterprise: "Nagyvállalati",
  };

  const limits = USAGE_LIMITS[currentPlan] ?? USAGE_LIMITS.free;

  return (
    <div className="max-w-6xl space-y-6">
      {/* Header + Billing Cycle Toggle */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Előfizetés
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Válassz a csomagok közül. Minden ár + ÁFA.
            </p>
          </div>
          <span className="inline-block bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-semibold px-3 py-1 rounded-full">
            {planNameMap[currentPlan] ?? currentPlan} csomag
          </span>
        </div>

        {/* Monthly / Yearly Toggle */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <span
            className={`text-sm font-medium ${
              cycle === "monthly"
                ? "text-gray-900 dark:text-gray-100"
                : "text-gray-400 dark:text-gray-500"
            }`}
          >
            Havi
          </span>
          <button
            onClick={() => setCycle(cycle === "monthly" ? "yearly" : "monthly")}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
              cycle === "yearly"
                ? "bg-blue-600"
                : "bg-gray-300 dark:bg-gray-600"
            }`}
            aria-label="Számlázási időszak váltás"
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                cycle === "yearly" ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
          <span
            className={`text-sm font-medium ${
              cycle === "yearly"
                ? "text-gray-900 dark:text-gray-100"
                : "text-gray-400 dark:text-gray-500"
            }`}
          >
            Éves
          </span>
          {cycle === "yearly" && (
            <span className="ml-1 inline-flex items-center bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 text-xs font-semibold px-2.5 py-0.5 rounded-full">
              ~23% kedvezmény
            </span>
          )}
        </div>

        {/* Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {plans.map((plan) => {
            const isCurrent = plan.id === currentPlan;
            const price =
              cycle === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;
            const priceId =
              cycle === "monthly" ? plan.monthlyPriceId : plan.yearlyPriceId;
            const periodLabel = cycle === "monthly" ? "/ hó" : "/ év";
            const currentIdx = PLAN_ORDER.indexOf(currentPlan);
            const planIdx = PLAN_ORDER.indexOf(plan.id);

            return (
              <div
                key={plan.id}
                className={`relative rounded-xl border-2 p-5 transition flex flex-col ${
                  plan.popular
                    ? "border-blue-500 dark:border-blue-400 shadow-lg shadow-blue-500/10"
                    : isCurrent
                    ? "border-blue-500 dark:border-blue-400 bg-blue-50/50 dark:bg-blue-950/20"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                {/* Popular badge */}
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-semibold px-3 py-0.5 rounded-full whitespace-nowrap">
                    Legnépszerűbb
                  </span>
                )}

                {/* Current badge */}
                {isCurrent && (
                  <span className="inline-block bg-blue-600 text-white text-xs font-medium px-2.5 py-0.5 rounded-full mb-3 w-fit">
                    Jelenlegi
                  </span>
                )}

                <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                  {plan.name}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {plan.description}
                </p>

                <p className="mt-3">
                  <span className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">
                    {formatPrice(price)} Ft
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {" "}
                    + áfa {periodLabel}
                  </span>
                </p>

                {cycle === "yearly" && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    {formatPrice(Math.round(plan.yearlyPrice / 12))} Ft + áfa /
                    hó-ra vetítve
                  </p>
                )}

                {/* Key stats */}
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg px-2 py-1.5 text-center">
                    <span className="block font-bold text-gray-900 dark:text-gray-100">
                      {plan.contractsPerMonth}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      szerz./hó
                    </span>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg px-2 py-1.5 text-center">
                    <span className="block font-bold text-gray-900 dark:text-gray-100">
                      {plan.subAccounts === 0
                        ? "—"
                        : plan.subAccounts}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      társfiók
                    </span>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg px-2 py-1.5 text-center">
                    <span className="block font-bold text-gray-900 dark:text-gray-100">
                      {plan.timestampsPerYear}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      időbélyeg/év
                    </span>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg px-2 py-1.5 text-center">
                    <span className="block font-bold text-gray-900 dark:text-gray-100">
                      {plan.supportResponseTime}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      válaszidő
                    </span>
                  </div>
                </div>

                {/* Features */}
                <ul className="mt-4 space-y-2 flex-1">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300"
                    >
                      <svg
                        className="w-4 h-4 text-blue-500 dark:text-blue-400 shrink-0 mt-0.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      {f}
                    </li>
                  ))}
                  {plan.notIncluded.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2 text-sm text-gray-300 dark:text-gray-600"
                    >
                      <svg
                        className="w-4 h-4 shrink-0 mt-0.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>

                {/* Action Button */}
                <div className="mt-5">
                  {isCurrent && currentPlan !== "free" ? (
                    <button
                      onClick={handlePortal}
                      disabled={loading === "portal"}
                      className="w-full text-center py-2.5 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition disabled:opacity-50"
                    >
                      {loading === "portal" ? "Betöltés..." : "Kezelés"}
                    </button>
                  ) : isCurrent ? (
                    <div className="w-full text-center py-2.5 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                      Jelenlegi csomag
                    </div>
                  ) : (
                    <button
                      onClick={() => handleCheckout(priceId)}
                      disabled={loading === priceId}
                      className={`w-full py-2.5 rounded-lg text-sm font-medium transition disabled:opacity-50 ${
                        plan.popular
                          ? "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                          : "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200"
                      }`}
                    >
                      {loading === priceId
                        ? "Betöltés..."
                        : planIdx < currentIdx
                        ? "Downgrade"
                        : "Előfizetés"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Usage */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Használat (aktuális hónap)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UsageMeter
            label="Szerződések"
            used={usage?.used ?? 0}
            limit={limits.contracts}
          />
          <UsageMeter label="Felhasználók" used={1} limit={limits.users} />
        </div>
      </div>
    </div>
  );
}

function UsageMeter({
  label,
  used,
  limit,
}: {
  label: string;
  used: number;
  limit: number;
}) {
  const pct = limit <= 0 ? 5 : Math.min((used / limit) * 100, 100);
  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </p>
      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
        {used}
        <span className="text-sm font-normal text-gray-400 dark:text-gray-500">
          {limit > 0
            ? ` / ${limit}`
            : limit === 0
            ? " (nem elérhető)"
            : " / korlátlan"}
        </span>
      </p>
      <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            pct > 80 ? "bg-red-500" : "bg-blue-500"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
