"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-store";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { useI18n } from "@/lib/i18n";

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
    contractsPerMonth: 10,
    subAccounts: 0,
    signersPerContract: 2,
    timestampsPerYear: 24,
    supportResponseTime: "72 óra",
    features: [
      "10 szerződés / hó",
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
  free: { contracts: 3, users: 1 },
  starter: { contracts: 10, users: 1 },
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
  const { t } = useI18n();
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
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Előfizetés
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Válassz a csomagok közül. Minden ár + ÁFA.
            </p>
          </div>
          <span className="inline-block bg-brand-teal/10 text-brand-teal-dark text-xs font-semibold px-3 py-1 rounded-full">
            {planNameMap[currentPlan] ?? currentPlan} csomag
          </span>
        </div>

        {/* Monthly / Yearly Toggle */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <span
            className={`text-sm font-medium ${
              cycle === "monthly"
                ? "text-gray-900"
                : "text-gray-400"
            }`}
          >
            Havi
          </span>
          <button
            onClick={() => setCycle(cycle === "monthly" ? "yearly" : "monthly")}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
              cycle === "yearly"
                ? "bg-brand-teal-dark"
                : "bg-gray-300"
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
                ? "text-gray-900"
                : "text-gray-400"
            }`}
          >
            Éves
          </span>
          {cycle === "yearly" && (
            <span className="ml-1 inline-flex items-center bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">
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
                    ? "border-brand-teal shadow-lg shadow-brand-teal/10"
                    : isCurrent
                    ? "border-brand-teal bg-brand-teal/5"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                {/* Popular badge */}
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-gold text-white text-xs font-semibold px-3 py-0.5 rounded-full whitespace-nowrap">
                    Legnépszerűbb
                  </span>
                )}

                {/* Current badge */}
                {isCurrent && (
                  <span className="inline-block bg-brand-teal-dark text-white text-xs font-medium px-2.5 py-0.5 rounded-full mb-3 w-fit">
                    Jelenlegi
                  </span>
                )}

                <h3 className="text-base font-bold text-gray-900">
                  {plan.name}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {plan.description}
                </p>

                <p className="mt-3">
                  <span className="text-2xl font-extrabold text-gray-900">
                    {formatPrice(price)} Ft
                  </span>
                  <span className="text-xs text-gray-400">
                    {" "}
                    + áfa {periodLabel}
                  </span>
                </p>

                {cycle === "yearly" && (
                  <p className="text-xs text-green-600 mt-1">
                    {formatPrice(Math.round(plan.yearlyPrice / 12))} Ft + áfa /
                    hó-ra vetítve
                  </p>
                )}

                {/* Key stats */}
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-gray-50 rounded-lg px-2 py-1.5 text-center">
                    <span className="block font-bold text-gray-900">
                      {plan.contractsPerMonth}
                    </span>
                    <span className="text-gray-500">
                      szerz./hó
                    </span>
                  </div>
                  <div className="bg-gray-50 rounded-lg px-2 py-1.5 text-center">
                    <span className="block font-bold text-gray-900">
                      {plan.subAccounts === 0
                        ? "—"
                        : plan.subAccounts}
                    </span>
                    <span className="text-gray-500">
                      társfiók
                    </span>
                  </div>
                  <div className="bg-gray-50 rounded-lg px-2 py-1.5 text-center">
                    <span className="block font-bold text-gray-900">
                      {plan.timestampsPerYear}
                    </span>
                    <span className="text-gray-500">
                      időbélyeg/év
                    </span>
                  </div>
                  <div className="bg-gray-50 rounded-lg px-2 py-1.5 text-center">
                    <span className="block font-bold text-gray-900">
                      {plan.supportResponseTime}
                    </span>
                    <span className="text-gray-500">
                      válaszidő
                    </span>
                  </div>
                </div>

                {/* Features */}
                <ul className="mt-4 space-y-2 flex-1">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2 text-sm text-gray-600"
                    >
                      <svg
                        className="w-4 h-4 text-brand-teal shrink-0 mt-0.5"
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
                      className="flex items-start gap-2 text-sm text-gray-300"
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
                      className="w-full text-center py-2.5 text-sm font-medium text-brand-teal-dark bg-brand-teal/10 rounded-lg hover:bg-brand-teal/20 transition disabled:opacity-50"
                    >
                      {loading === "portal" ? "Betöltés..." : "Kezelés"}
                    </button>
                  ) : isCurrent ? (
                    <div className="w-full text-center py-2.5 text-sm font-medium text-brand-teal-dark bg-brand-teal/10 rounded-lg">
                      {t("billing.currentPlan")}
                    </div>
                  ) : (
                    <button
                      onClick={() => handleCheckout(priceId)}
                      disabled={loading === priceId}
                      className={`w-full py-2.5 rounded-lg text-sm font-medium transition disabled:opacity-50 ${
                        plan.popular
                          ? "bg-brand-gold hover:bg-brand-gold-dark text-white shadow-lg shadow-brand-gold/30"
                          : "bg-brand-teal-dark text-white hover:bg-brand-teal-darker"
                      }`}
                    >
                      {loading === priceId
                        ? "Betöltés..."
                        : planIdx < currentIdx
                        ? "Visszalépés"
                        : "Előfizetés"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Credits */}
      <CreditSection />

      {/* Promo Code */}
      <PromoCodeSection />

      {/* Usage */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {t("billing.usage")}
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

      {/* Annual discount banner */}
      <div className="bg-gradient-to-r from-brand-teal-dark to-brand-teal rounded-xl p-6 text-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-lg">Spórolj éves fizetéssel</h3>
            <p className="text-white/70 text-sm mt-1">
              Éves előfizetésnél ~23% kedvezményt kapsz a havi árhoz képest!
            </p>
          </div>
          <button
            onClick={() => setCycle("yearly")}
            className="bg-brand-gold hover:bg-brand-gold-dark text-white px-6 py-2.5 rounded-lg font-medium transition whitespace-nowrap shadow-lg shadow-brand-gold/30"
          >
            Váltás éves fizetésre
          </button>
        </div>
      </div>
    </div>
  );
}

interface CreditPack {
  id: string;
  amount: number;
  price: number;
  label: string;
}

interface CreditTransaction {
  id: string;
  amount: number;
  balance: number;
  type: string;
  description: string;
  createdAt: string;
  contract?: { title: string } | null;
}

function CreditSection() {
  const { t } = useI18n();
  const [balance, setBalance] = useState<number | null>(null);
  const [packs, setPacks] = useState<CreditPack[]>([]);
  const [history, setHistory] = useState<CreditTransaction[]>([]);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    api.get("/credits/balance").then((res) => setBalance(res.data.data.balance ?? 0)).catch(() => {});
    api.get("/credits/packs").then((res) => setPacks(res.data.data.packs ?? [])).catch(() => {});
  }, []);

  const loadHistory = async () => {
    try {
      const res = await api.get("/credits/history?limit=20");
      setHistory(res.data.data.transactions ?? []);
      setShowHistory(true);
    } catch {
      toast.error("Nem sikerült betölteni az előzményeket");
    }
  };

  const handlePurchase = async (packId: string) => {
    setPurchasing(packId);
    try {
      const res = await api.post("/credits/purchase", { packId });
      const { balance: newBalance, added } = res.data.data;
      setBalance(newBalance);
      toast.success(`${added} kredit jóváírva! Új egyenleg: ${newBalance}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message ?? "Hiba a vásárlás során");
    } finally {
      setPurchasing(null);
    }
  };

  const typeLabelsCredit: Record<string, string> = {
    purchase: "Vásárlás",
    usage: "Felhasználás",
    admin_grant: "Admin jóváírás",
    refund: "Visszatérítés",
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{t("billing.credits")}</h2>
          <p className="text-sm text-gray-500 mt-1">
            Szerződés kiküldésekor 1 kredit kerül levonásra. Vásárolj kredit csomagot, ha elfogy.
          </p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-gray-900">{balance ?? "..."}</p>
          <p className="text-xs text-gray-500">kredit egyenleg</p>
        </div>
      </div>

      {/* Credit Packs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {packs.map((pack) => (
          <div
            key={pack.id}
            className="border border-gray-200 rounded-xl p-4 text-center hover:border-brand-teal hover:shadow-md transition"
          >
            <p className="text-2xl font-bold text-gray-900">{pack.amount}</p>
            <p className="text-xs text-gray-500 mb-2">kredit</p>
            <p className="text-sm font-semibold text-gray-700 mb-3">
              {pack.price.toLocaleString("hu-HU")} Ft
            </p>
            <p className="text-[10px] text-gray-400 mb-2">
              {Math.round(pack.price / pack.amount)} Ft / kredit
            </p>
            <button
              onClick={() => handlePurchase(pack.id)}
              disabled={purchasing === pack.id}
              className="w-full py-2 rounded-lg text-sm font-medium bg-brand-teal-dark text-white hover:bg-brand-teal-darker transition disabled:opacity-50"
            >
              {purchasing === pack.id ? "Feldolgozás..." : "Vásárlás"}
            </button>
          </div>
        ))}
      </div>

      {/* History Toggle */}
      <div className="border-t border-gray-100 pt-4">
        <button
          onClick={showHistory ? () => setShowHistory(false) : loadHistory}
          className="text-sm text-brand-teal-dark hover:underline font-medium"
        >
          {showHistory ? "Előzmények elrejtése" : "Kredit előzmények"}
        </button>

        {showHistory && history.length > 0 && (
          <div className="mt-3 space-y-2">
            {history.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50 text-sm"
              >
                <div>
                  <span className={`font-medium ${tx.amount > 0 ? "text-green-600" : "text-red-600"}`}>
                    {tx.amount > 0 ? "+" : ""}{tx.amount}
                  </span>
                  <span className="text-gray-500 ml-2">
                    {tx.description || typeLabelsCredit[tx.type] || tx.type}
                  </span>
                  {tx.contract && (
                    <span className="text-gray-400 ml-1">({tx.contract.title})</span>
                  )}
                </div>
                <div className="text-xs text-gray-400">
                  {new Date(tx.createdAt).toLocaleDateString("hu-HU")}
                </div>
              </div>
            ))}
          </div>
        )}
        {showHistory && history.length === 0 && (
          <p className="mt-3 text-sm text-gray-400">Nincs kredit tranzakció.</p>
        )}
      </div>
    </div>
  );
}

function PromoCodeSection() {
  const [code, setCode] = useState("");
  const [applying, setApplying] = useState(false);
  const [validating, setValidating] = useState(false);
  const [info, setInfo] = useState<{ valid: boolean; description?: string; discountType?: string; discountValue?: number; message?: string } | null>(null);

  const typeLabels: Record<string, string> = {
    percent: "százalékos kedvezmény",
    fixed: "fix összegű kedvezmény",
    tier_upgrade: "csomag frissítés",
    trial_days: "próba napok",
  };

  const validate = async () => {
    if (!code.trim()) return;
    setValidating(true);
    setInfo(null);
    try {
      const res = await api.post("/admin/promo-codes/validate", { code: code.trim() });
      setInfo(res.data.data);
    } catch {
      setInfo({ valid: false, message: "Hiba a kód ellenőrzésekor" });
    } finally {
      setValidating(false);
    }
  };

  const apply = async () => {
    if (!code.trim()) return;
    setApplying(true);
    try {
      await api.post("/admin/promo-codes/apply", { code: code.trim() });
      toast.success("Promó kód sikeresen beváltva!");
      setCode("");
      setInfo(null);
      window.location.reload();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message ?? "Hiba a kód beváltásakor");
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Promó kód beváltása</h2>
      <p className="text-sm text-gray-500 mb-4">Ha rendelkezel promóciós kóddal, itt válthatod be.</p>
      <div className="flex gap-3">
        <input
          type="text"
          value={code}
          onChange={(e) => { setCode(e.target.value.toUpperCase()); setInfo(null); }}
          placeholder="Pl. WELCOME50"
          className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white text-gray-900 uppercase tracking-wider font-mono outline-none focus:ring-2 focus:ring-brand-teal focus:border-transparent"
        />
        <button
          onClick={validate}
          disabled={!code.trim() || validating}
          className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
        >
          {validating ? "..." : "Ellenőrzés"}
        </button>
        <button
          onClick={apply}
          disabled={!code.trim() || applying || (info !== null && !info.valid)}
          className="px-5 py-2.5 bg-brand-teal-dark text-white rounded-lg text-sm font-medium hover:bg-brand-teal-darker transition disabled:opacity-50"
        >
          {applying ? "Beváltás..." : "Beváltás"}
        </button>
      </div>
      {info && (
        <div className={`mt-3 px-4 py-3 rounded-lg text-sm ${info.valid ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {info.valid ? (
            <>
              <span className="font-semibold">Érvényes kód!</span>{" "}
              {info.description && <span>{info.description} — </span>}
              {info.discountType && (
                <span>{info.discountValue} {info.discountType === "percent" ? "%" : info.discountType === "fixed" ? "Ft" : ""} {typeLabels[info.discountType] || info.discountType}</span>
              )}
            </>
          ) : (
            <span>{info.message || "Érvénytelen kód"}</span>
          )}
        </div>
      )}
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
    <div className="bg-gray-50 rounded-lg p-4">
      <p className="text-sm font-medium text-gray-700">
        {label}
      </p>
      <p className="text-2xl font-bold text-gray-900 mt-1">
        {used}
        <span className="text-sm font-normal text-gray-400">
          {limit > 0
            ? ` / ${limit}`
            : limit === 0
            ? " (nem elérhető)"
            : " / korlátlan"}
        </span>
      </p>
      <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            pct > 80 ? "bg-red-500" : "bg-brand-teal"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
