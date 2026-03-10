"use client";

import { useState } from "react";
import Link from "next/link";
import api from "@/lib/api";

interface PortalContract {
  contractId: string;
  title: string;
  contractStatus: string;
  createdAt: string;
  verificationHash: string | null;
  ownerName: string;
  ownerCompany: string | null;
  signerStatus: string;
  signedAt: string | null;
  signToken: string | null;
}

const statusLabels: Record<string, string> = {
  draft: "Piszkozat",
  sent: "Elkuldve",
  partially_signed: "Reszben alairt",
  completed: "Teljesitve",
  declined: "Visszautasitva",
  expired: "Lejart",
  cancelled: "Visszavonva",
};

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
  sent: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
  partially_signed: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300",
  completed: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
  declined: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
  expired: "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400",
  cancelled: "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400",
};

export default function PortalPage() {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [contracts, setContracts] = useState<PortalContract[]>([]);
  const [portalEmail, setPortalEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRequestAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/portal/request-access", { email });
      const t = res.data.data.token;
      setToken(t);
      // Immediately fetch contracts
      const contractsRes = await api.get(`/portal/contracts?token=${t}`);
      setContracts(contractsRes.data.data.contracts);
      setPortalEmail(contractsRes.data.data.email);
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message ?? "Hiba tortent. Probald ujra."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setContracts([]);
    setPortalEmail("");
    setEmail("");
    setError("");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/landing" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">SZ</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-bold text-gray-900 dark:text-white">
                Legitas
              </span>
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                Ugyfelportal
              </span>
            </div>
          </Link>
          {token && (
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Kijelentkezes
            </button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {!token ? (
          /* State 1: Email entry */
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-full max-w-md">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 sm:p-10">
                <div className="text-center mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-7 h-7 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                    </svg>
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Ugyfelportal
                  </h1>
                  <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                    Adja meg az email cimet a szerzodesek megtekintegesehez
                  </p>
                </div>

                <form onSubmit={handleRequestAccess} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Email cim
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="pelda@ceg.hu"
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition"
                    />
                  </div>

                  {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 text-sm text-red-700 dark:text-red-400">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Betoltes...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                        Hozzaferes kerese
                      </>
                    )}
                  </button>
                </form>

                <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-6">
                  Csak azok a szerzodesek jelennek meg, amelyeknel On alairoként szerepel.
                </p>
              </div>

              <div className="text-center mt-6">
                <Link
                  href="/login"
                  className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
                >
                  Van fiokja? Bejelentkezes
                </Link>
              </div>
            </div>
          </div>
        ) : (
          /* State 2: Contract list */
          <div>
            {/* User info bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                  {portalEmail.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {portalEmail}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {contracts.length} szerzodes talalhato
                  </p>
                </div>
              </div>
            </div>

            {contracts.length === 0 ? (
              /* Empty state */
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Nincsenek szerzodesek
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm mx-auto">
                  Ehhez az email cimhez jelenleg nem tartozik egyetlen szerzodes sem.
                </p>
              </div>
            ) : (
              /* Contract cards */
              <div className="space-y-4">
                {contracts.map((c) => (
                  <div
                    key={c.contractId}
                    className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 sm:p-6 hover:border-blue-200 dark:hover:border-blue-700 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-3 mb-2">
                          <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0 mt-0.5">
                            <svg className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                              {c.title}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                              {c.ownerCompany ?? c.ownerName}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 mt-3 ml-12">
                          {/* Contract status */}
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[c.contractStatus] ?? statusColors.draft}`}>
                            {statusLabels[c.contractStatus] ?? c.contractStatus}
                          </span>

                          {/* Signer status */}
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            c.signerStatus === "signed"
                              ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"
                              : c.signerStatus === "declined"
                              ? "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300"
                              : "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"
                          }`}>
                            {c.signerStatus === "signed"
                              ? "Alairt"
                              : c.signerStatus === "declined"
                              ? "Visszautasitva"
                              : "Fuggeben"}
                          </span>

                          {/* Date */}
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            {new Date(c.createdAt).toLocaleDateString("hu-HU", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Action button */}
                      <div className="sm:ml-4 shrink-0">
                        {c.signerStatus === "pending" && c.signToken ? (
                          <Link
                            href={`/sign/${c.signToken}`}
                            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                            Alairas
                          </Link>
                        ) : c.verificationHash ? (
                          <Link
                            href={`/verify/${c.verificationHash}`}
                            className="inline-flex items-center gap-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm font-medium px-4 py-2 rounded-xl transition"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Megtekintes
                          </Link>
                        ) : (
                          <span className="text-xs text-gray-400 dark:text-gray-500 italic">
                            Nincs elerheto muvelet
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-700 mt-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            &copy; {new Date().getFullYear()} Legitas. Minden jog fenntartva.
          </p>
          <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500">
            <Link href="/adatvedelem" className="hover:text-gray-600 dark:hover:text-gray-300 transition">
              Adatvedelem
            </Link>
            <Link href="/aszf" className="hover:text-gray-600 dark:hover:text-gray-300 transition">
              ASZF
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
