"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import Link from "next/link";

interface VerificationData {
  title: string;
  status: string;
  verificationHash: string;
  createdAt: string;
  signers: {
    name: string;
    status: string;
    signedAt: string | null;
  }[];
  tsa?: {
    timestamp: string;
    authority: string;
    serialNumber: string;
  } | null;
}

const statusConfig: Record<string, { label: string; color: string; bg: string; darkBg: string; darkColor: string }> = {
  draft: { label: "Piszkozat", color: "text-gray-700", bg: "bg-gray-100", darkBg: "dark:bg-gray-700", darkColor: "dark:text-gray-300" },
  sent: { label: "Elkuldve", color: "text-blue-700", bg: "bg-blue-100", darkBg: "dark:bg-blue-900/30", darkColor: "dark:text-blue-400" },
  partially_signed: { label: "Reszben alairt", color: "text-yellow-700", bg: "bg-yellow-100", darkBg: "dark:bg-yellow-900/30", darkColor: "dark:text-yellow-400" },
  completed: { label: "Teljesitve", color: "text-green-700", bg: "bg-green-100", darkBg: "dark:bg-green-900/30", darkColor: "dark:text-green-400" },
  declined: { label: "Visszautasitva", color: "text-red-700", bg: "bg-red-100", darkBg: "dark:bg-red-900/30", darkColor: "dark:text-red-400" },
  expired: { label: "Lejart", color: "text-orange-700", bg: "bg-orange-100", darkBg: "dark:bg-orange-900/30", darkColor: "dark:text-orange-400" },
  cancelled: { label: "Visszavonva", color: "text-gray-700", bg: "bg-gray-100", darkBg: "dark:bg-gray-700", darkColor: "dark:text-gray-300" },
  archived: { label: "Archivalt", color: "text-gray-700", bg: "bg-gray-100", darkBg: "dark:bg-gray-700", darkColor: "dark:text-gray-300" },
};

export default function VerifyPage() {
  const { hash } = useParams<{ hash: string }>();
  const [data, setData] = useState<VerificationData | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hash) return;
    api
      .get(`/contracts/verify/${hash}`)
      .then((res) => {
        setData(res.data.data);
      })
      .catch(() => {
        setError(true);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [hash]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#198296]" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Ervenytelen hivatkozas
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Ez a szerződés nem található vagy érvénytelen.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[#198296] hover:underline text-sm font-medium"
          >
            Vissza a fooldara
          </Link>
        </div>
      </div>
    );
  }

  const status = statusConfig[data.status] ?? statusConfig.draft;
  const createdDate = new Date(data.createdAt).toLocaleDateString("hu-HU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 py-4 px-6">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-lg font-bold text-[#198296]">
            Legitas
          </Link>
          <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">
            Hitelesítés
          </span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg overflow-hidden">
          {/* Header with icon */}
          <div className="bg-gradient-to-r from-[#198296] to-[#14697a] px-8 py-8 text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-white mb-1">
              Szerződés hitelesített
            </h1>
            <p className="text-white/70 text-sm">
              Ez a dokumentum a Legitas rendszerben van nyilvántartva
            </p>
          </div>

          {/* Contract details */}
          <div className="px-8 py-6 space-y-5">
            {/* Title */}
            <div>
              <label className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                Szerzodes cime
              </label>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-1">
                {data.title}
              </p>
            </div>

            {/* Status + Date row */}
            <div className="flex flex-wrap gap-6">
              <div>
                <label className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                  Statusz
                </label>
                <div className="mt-1">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${status.bg} ${status.color} ${status.darkBg} ${status.darkColor}`}
                  >
                    {data.status === "completed" && (
                      <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {status.label}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                  Letrehozva
                </label>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                  {createdDate}
                </p>
              </div>
            </div>

            {/* Signers */}
            <div>
              <label className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                Aláírók
              </label>
              <div className="mt-2 space-y-2">
                {data.signers.map((signer, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-2.5 px-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      {signer.name}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                        signer.status === "signed"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : signer.status === "pending"
                            ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      }`}
                    >
                      {signer.status === "signed" && (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {signer.status === "pending" && (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                      {signer.status === "signed"
                        ? "Alairta"
                        : signer.status === "pending"
                          ? "Varakozik"
                          : "Visszautasitotta"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* TSA Timestamp */}
            {data.tsa && (
              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <label className="text-xs font-medium text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                    Hiteles idobélyeg (TSA)
                  </label>
                </div>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Idopont:</span>
                    <span className="font-medium text-gray-800 dark:text-gray-200">
                      {new Date(data.tsa.timestamp).toLocaleString("hu-HU")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Szolgaltato:</span>
                    <span className="font-medium text-gray-800 dark:text-gray-200">{data.tsa.authority}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Sorozatszam:</span>
                    <span className="font-mono text-xs text-gray-600 dark:text-gray-400">{data.tsa.serialNumber}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Verification Hash */}
            <div>
              <label className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                Hitelesítési azonosito
              </label>
              <p className="text-sm font-mono text-gray-600 dark:text-gray-400 mt-1 bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg break-all">
                {data.verificationHash}
              </p>
            </div>

            {/* Footer note */}
            <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
              <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
                Ez a szerződés a Legitas rendszerben lett létrehozva és hitelesítve. A hitelesítési azonosító egyedi, és a szerződés változatlanságát garantálja.
              </p>
            </div>
          </div>
        </div>

        {/* Back link */}
        <div className="text-center mt-6">
          <Link
            href="/"
            className="text-sm text-[#198296] hover:underline font-medium"
          >
            legitas.hu
          </Link>
        </div>
      </div>
    </div>
  );
}
