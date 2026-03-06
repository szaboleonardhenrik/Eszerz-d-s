"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-store";
import api from "@/lib/api";
import toast from "react-hot-toast";

const plans = [
  {
    id: "free",
    name: "Ingyenes",
    price: "0 Ft",
    period: "",
    features: [
      "5 szerződés/hó",
      "1 felhasználó",
      "Alap sablonok",
      "Egyszerű e-aláírás",
      "Email értesítések",
    ],
    notIncluded: ["Egyéni sablonok", "API hozzáférés", "Csapatkezelés"],
  },
  {
    id: "basic",
    name: "Kezdő",
    price: "2 990 Ft",
    period: "/hó",
    features: [
      "30 szerződés/hó",
      "3 felhasználó",
      "Összes sablon",
      "Egyéni sablonok",
      "AES e-aláírás",
      "Számlázz.hu integráció",
    ],
    notIncluded: ["Minősített aláírás", "Korlátlan API"],
  },
  {
    id: "pro",
    name: "Profi",
    price: "9 990 Ft",
    period: "/hó",
    popular: true,
    features: [
      "Korlátlan szerződés",
      "10 felhasználó",
      "QES (Microsec/DÁP)",
      "API hozzáférés (korlátlan)",
      "AI szerződés elemzés",
      "Analytics dashboard",
      "Webhook integráció",
      "Dedikált támogatás",
    ],
    notIncluded: [],
  },
  {
    id: "enterprise",
    name: "Nagyvállalati",
    price: "Egyedi",
    period: "",
    features: [
      "Korlátlan minden",
      "SSO (SAML/OIDC)",
      "Dedikált account manager",
      "SLA garancia",
      "White-label aláírás",
      "Cégkapu integráció",
      "On-premise lehetőség",
    ],
    notIncluded: [],
  },
];

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

  useEffect(() => {
    api.get("/contracts/stats").then((res) => {
      setUsage(res.data.data.usage);
    }).catch(() => {});
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
      if (msg.includes("Invalid API Key") || msg.includes("placeholder") || !msg) {
        toast.error("Stripe hamarosan elerheto");
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
      if (msg.includes("Invalid API Key") || msg.includes("placeholder") || msg.includes("Nincs Stripe")) {
        toast.error("Stripe hamarosan elerheto");
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="max-w-5xl space-y-6">
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Előfizetés</h2>
            <p className="text-sm text-gray-500 mt-1">
              Válts magasabb csomagra a további funkciókért. Éves fizetésnél 2 hónap ingyen.
            </p>
          </div>
          <span className="inline-block bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full capitalize">
            {currentPlan} csomag
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((plan) => {
            const isCurrent = plan.id === currentPlan;
            return (
              <div
                key={plan.id}
                className={`relative rounded-xl border-2 p-5 transition flex flex-col ${
                  plan.popular
                    ? "border-blue-500 shadow-lg shadow-blue-500/10"
                    : isCurrent
                    ? "border-blue-500 bg-blue-50/50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-semibold px-3 py-0.5 rounded-full">
                    Legnépszerűbb
                  </span>
                )}
                {isCurrent && !plan.popular && (
                  <span className="inline-block bg-blue-600 text-white text-xs font-medium px-2.5 py-0.5 rounded-full mb-3 w-fit">
                    Jelenlegi
                  </span>
                )}
                <h3 className="text-base font-bold text-gray-900">{plan.name}</h3>
                <p className="mt-2">
                  <span className="text-2xl font-extrabold text-gray-900">{plan.price}</span>
                  {plan.period && (
                    <span className="text-sm text-gray-400">{plan.period}</span>
                  )}
                </p>
                <ul className="mt-4 space-y-2 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                      <svg className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                  {plan.notIncluded?.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-300">
                      <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-5">
                  {isCurrent && currentPlan !== "free" ? (
                    <button
                      onClick={handlePortal}
                      disabled={loading === "portal"}
                      className="w-full text-center py-2.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition disabled:opacity-50"
                    >
                      {loading === "portal" ? "Betoltes..." : "Kezeles"}
                    </button>
                  ) : isCurrent ? (
                    <div className="w-full text-center py-2.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg">
                      Jelenlegi csomag
                    </div>
                  ) : plan.id === "enterprise" ? (
                    <button
                      onClick={() => toast("Kerjuk, vegye fel velunk a kapcsolatot: hello@szerzodesportal.hu")}
                      className="w-full py-2.5 rounded-lg text-sm font-medium border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition"
                    >
                      Kapcsolatfelvetel
                    </button>
                  ) : (
                    <button
                      onClick={() => handleCheckout(plan.id)}
                      disabled={loading === plan.id}
                      className={`w-full py-2.5 rounded-lg text-sm font-medium transition disabled:opacity-50 ${
                        plan.popular
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "bg-gray-900 text-white hover:bg-gray-800"
                      }`}
                    >
                      {loading === plan.id
                        ? "Betoltes..."
                        : plans.findIndex((p) => p.id === plan.id) < plans.findIndex((p) => p.id === currentPlan)
                        ? "Downgrade"
                        : "Upgrade"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Usage */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Használat (aktuális hónap)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <UsageMeter
            label="Szerződések"
            used={usage?.used ?? 0}
            limit={currentPlan === "free" ? 5 : currentPlan === "basic" ? 30 : -1}
          />
          <UsageMeter
            label="Csapattagok"
            used={1}
            limit={currentPlan === "free" ? 1 : currentPlan === "basic" ? 3 : currentPlan === "pro" ? 10 : -1}
          />
          <UsageMeter
            label="API kérések (ma)"
            used={0}
            limit={currentPlan === "free" ? 0 : currentPlan === "basic" ? 100 : -1}
          />
        </div>
      </div>

      {/* Annual discount */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-6 text-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-lg">Spórolj éves fizetéssel</h3>
            <p className="text-blue-100 text-sm mt-1">
              Éves előfizetésnél 2 hónap ingyen — ez 17% megtakarítás!
            </p>
          </div>
          <button
            onClick={() => toast("Éves fizetés hamarosan elérhető!")}
            className="bg-white text-blue-700 px-6 py-2.5 rounded-lg font-medium hover:bg-blue-50 transition whitespace-nowrap"
          >
            Váltás éves fizetésre
          </button>
        </div>
      </div>
    </div>
  );
}

function UsageMeter({ label, used, limit }: { label: string; used: number; limit: number }) {
  const pct = limit <= 0 ? 5 : Math.min((used / limit) * 100, 100);
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <p className="text-sm font-medium text-gray-700">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">
        {used}
        <span className="text-sm font-normal text-gray-400">
          {limit > 0 ? ` / ${limit}` : limit === 0 ? " (nem elérhető)" : " / korlátlan"}
        </span>
      </p>
      <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${pct > 80 ? "bg-red-500" : "bg-blue-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
