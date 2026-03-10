"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import toast from "react-hot-toast";

interface ReferralStats {
  totalInvites: number;
  converted: number;
  pending: number;
  bonusContracts: number;
}

interface Referral {
  id: string;
  referralCode: string;
  referredEmail: string | null;
  referredId: string | null;
  bonusApplied: boolean;
  createdAt: string;
  convertedAt: string | null;
  referred: { id: string; name: string; email: string } | null;
}

export default function ReferralSettings() {
  const [code, setCode] = useState("");
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [codeRes, statsRes, referralsRes] = await Promise.all([
        api.get("/referrals/code"),
        api.get("/referrals/stats"),
        api.get("/referrals/my"),
      ]);
      setCode(codeRes.data.data.referralCode);
      setStats(statsRes.data.data);
      setReferrals(referralsRes.data.data);
    } catch {
      toast.error("Hiba az ajánlási adatok betöltésekor");
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    const url = `https://legitas.hu/register?ref=${code}`;
    navigator.clipboard.writeText(url);
    toast.success("Ajánló link másolva!");
  };

  if (loading) {
    return (
      <div className="max-w-2xl py-12 text-center text-gray-400 text-sm">
        Betöltés...
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Referral Code */}
      <div className="bg-gradient-to-br from-[#198296] to-[#41A5B9] rounded-xl p-6 text-white">
        <h2 className="text-lg font-semibold mb-2">Hívd meg ismerőseidet!</h2>
        <p className="text-sm text-white/80 mb-4">
          Minden sikeres ajánlás után Te és a meghívott is kap +5 bónusz
          szerződést. Oszd meg az ajánló linkedet!
        </p>
        <div className="flex gap-2">
          <div className="flex-1 bg-white/10 rounded-lg px-4 py-3 font-mono text-sm backdrop-blur">
            legitas.hu/register?ref={code}
          </div>
          <button
            onClick={copyCode}
            className="bg-white text-[#198296] px-5 py-3 rounded-lg font-medium hover:bg-white/90 transition flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Másolás
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Meghívások", value: stats.totalInvites, color: "text-blue-600" },
            { label: "Csatlakozott", value: stats.converted, color: "text-green-600" },
            { label: "Függőben", value: stats.pending, color: "text-yellow-600" },
            { label: "Bónusz szerződés", value: stats.bonusContracts, color: "text-[#198296]" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border p-4 text-center">
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Referral History */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Ajánlási előzmények
        </h2>
        {referrals.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">
            Még nincs ajánlásod. Oszd meg a kódodat!
          </p>
        ) : (
          <div className="space-y-3">
            {referrals
              .filter((r) => r.referredId)
              .map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between py-3 border-b last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {r.referred?.name || r.referredEmail || "Felhasználó"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {r.referred?.email}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-green-600 font-medium">
                      {r.bonusApplied ? "+5 szerződés" : "Feldolgozás alatt"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {r.convertedAt
                        ? new Date(r.convertedAt).toLocaleDateString("hu-HU")
                        : ""}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* How It Works */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Hogyan működik?
        </h2>
        <div className="space-y-4">
          {[
            { step: "1", title: "Oszd meg", desc: "Küldd el az ajánló linkedet ismerőseidnek" },
            { step: "2", title: "Regisztrálnak", desc: "Az ismerősöd a linkeden keresztül regisztrál" },
            { step: "3", title: "Mindketten kapnak", desc: "Te és az ismerősöd is kap +5 bónusz szerződést" },
          ].map((item) => (
            <div key={item.step} className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-[#198296] text-white flex items-center justify-center text-sm font-bold shrink-0">
                {item.step}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{item.title}</p>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
