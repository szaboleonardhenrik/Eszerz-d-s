"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import Logo from "@/components/logo";

interface PortalContract {
  contractId: string;
  title: string;
  contractStatus: string;
  createdAt: string;
  verificationHash: string | null;
  hasPdf: boolean;
  ownerName: string;
  ownerCompany: string | null;
  signerStatus: string;
  signedAt: string | null;
}

interface AuditEntry {
  id: string;
  eventType: string;
  createdAt: string;
  signer: { name: string; email: string } | null;
}

const statusLabels: Record<string, string> = {
  draft: "Piszkozat",
  sent: "Elküldve",
  partially_signed: "Részben aláírt",
  completed: "Teljesítve",
  declined: "Visszautasítva",
  expired: "Lejárt",
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

const eventTypeLabels: Record<string, string> = {
  contract_created: "Szerződés létrehozva",
  email_sent: "Email elküldve",
  contract_viewed: "Szerződés megtekintve",
  contract_signed: "Aláírás megtörtént",
  contract_declined: "Visszautasítva",
  contract_completed: "Minden fél aláírt",
  pdf_generated: "PDF generálva",
};

export default function PortalPage() {
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get("token");

  const [email, setEmail] = useState("");
  const [token, setToken] = useState<string | null>(tokenFromUrl);
  const [contracts, setContracts] = useState<PortalContract[]>([]);
  const [portalEmail, setPortalEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [requestSent, setRequestSent] = useState(false);

  // Audit log state
  const [auditContractId, setAuditContractId] = useState<string | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  // If token in URL, load contracts immediately
  useEffect(() => {
    if (tokenFromUrl) {
      loadContracts(tokenFromUrl);
    }
  }, [tokenFromUrl]);

  const loadContracts = async (t: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/portal/contracts?token=${t}`);
      setContracts(res.data.data.contracts);
      setPortalEmail(res.data.data.email);
      setToken(t);
    } catch (err: unknown) {
      const axiosMsg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      setError(axiosMsg ?? "Hiba történt. Próbáld újra.");
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/portal/request-access", { email });
      setRequestSent(true);
    } catch (err: unknown) {
      const axiosMsg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      setError(axiosMsg ?? "Hiba történt. Próbáld újra.");
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
    setRequestSent(false);
    // Clear token from URL
    window.history.replaceState({}, "", "/portal");
  };

  const loadAuditLog = async (contractId: string) => {
    if (auditContractId === contractId) {
      setAuditContractId(null);
      return;
    }
    setAuditContractId(contractId);
    setAuditLoading(true);
    try {
      const res = await api.get(`/portal/audit-log/${contractId}?token=${token}`);
      setAuditLogs(res.data.data);
    } catch {
      setAuditLogs([]);
    } finally {
      setAuditLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/landing" className="flex items-center gap-2.5">
            <Logo />
            <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
              Ügyfélportál
            </span>
          </Link>
          {token && (
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Kijelentkezés
            </button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {!token ? (
          /* State 1: Email entry / request sent */
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
                    Ügyfélportál
                  </h1>
                  {requestSent ? (
                    <div className="space-y-3">
                      <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
                        <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                        Ha ez az email cím szerepel aláíróként, a hozzáférési linket elküldtük emailben. A link 24 óráig érvényes.
                      </p>
                      <button
                        onClick={() => { setRequestSent(false); setEmail(""); }}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Új email megadása
                      </button>
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                      Adja meg az email címét a szerződések megtekintéséhez
                    </p>
                  )}
                </div>

                {!requestSent && (
                  <form onSubmit={handleRequestAccess} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Email cím
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
                          Hozzáférés kérése
                        </>
                      )}
                    </button>
                  </form>
                )}

                <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-6">
                  Csak azok a szerződések jelennek meg, amelyeknél Ön aláíróként szerepel.
                </p>
              </div>

              <div className="text-center mt-6">
                <Link
                  href="/login"
                  className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
                >
                  Van fiókja? Bejelentkezés
                </Link>
              </div>
            </div>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto" />
              <p className="mt-4 text-sm text-gray-400">Betoltes...</p>
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
                    {contracts.length} szerződés található
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 text-sm text-red-700 dark:text-red-400 mb-6">
                {error}
              </div>
            )}

            {contracts.length === 0 ? (
              /* Empty state */
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Nincsenek szerződések
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm mx-auto">
                  Ehhez az email címhez jelenleg nem tartozik egyetlen szerződés sem.
                </p>
              </div>
            ) : (
              /* Contract cards */
              <div className="space-y-4">
                {contracts.map((c) => (
                  <div key={c.contractId}>
                    <div
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
                                ? "Aláírt"
                                : c.signerStatus === "declined"
                                ? "Visszautasítva"
                                : "Függőben"}
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

                        {/* Action buttons */}
                        <div className="sm:ml-4 shrink-0 flex items-center gap-2">
                          {/* Audit log toggle */}
                          <button
                            onClick={() => loadAuditLog(c.contractId)}
                            className="inline-flex items-center gap-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 text-sm font-medium px-3 py-2 rounded-xl transition"
                            title="Napló"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Napló
                          </button>

                          {c.verificationHash && (
                            <Link
                              href={`/verify/${c.verificationHash}`}
                              className="inline-flex items-center gap-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm font-medium px-4 py-2 rounded-xl transition"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Megtekintés
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Audit log panel */}
                    {auditContractId === c.contractId && (
                      <div className="mt-2 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                          Aláírás előrehaladás
                        </h4>
                        {auditLoading ? (
                          <div className="flex items-center justify-center py-4">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                          </div>
                        ) : auditLogs.length === 0 ? (
                          <p className="text-sm text-gray-400">Nincs naplóbejegyzés.</p>
                        ) : (
                          <div className="space-y-2">
                            {auditLogs.map((log) => (
                              <div key={log.id} className="flex items-center gap-3 text-sm">
                                <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                                <span className="text-gray-600 dark:text-gray-400">
                                  {eventTypeLabels[log.eventType] ?? log.eventType}
                                  {log.signer && (
                                    <span className="text-gray-400"> - {log.signer.name}</span>
                                  )}
                                </span>
                                <span className="text-xs text-gray-400 ml-auto shrink-0">
                                  {new Date(log.createdAt).toLocaleString("hu-HU")}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
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
              Adatvédelem
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
