"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import api from "@/lib/api";
import toast from "react-hot-toast";
import FeatureGate from "@/components/feature-gate";
import { useI18n } from "@/lib/i18n";

/* ── Interfaces ──────────────────────────────────────────────────── */

interface AlertContract {
  id: string;
  title: string;
  status: string;
  expiresAt?: string;
  createdAt?: string;
  daysUntilExpiry?: number;
  daysSinceCreated?: number;
  signers?: { name: string; email: string }[];
}

interface AlertsData {
  expiringIn7Days: AlertContract[];
  expiringIn30Days: AlertContract[];
  staleUnsigned: AlertContract[];
  totalAlerts: number;
}

interface Reminder {
  id: string;
  contractId: string;
  type: string;
  message: string;
  remindAt: string;
  sent: boolean;
  createdAt: string;
  contract?: { id: string; title: string; status: string };
}

interface ContractOption {
  id: string;
  title: string;
}

const typeLabels: Record<string, string> = {
  expiry: "Lejárati emlékeztető",
  renewal: "Megújítás",
  signing_deadline: "Aláírási határidő",
  custom: "Egyedi",
};

/* ══════════════════════════════════════════════════════════════════ */
/*  REMINDERS PAGE                                                    */
/* ══════════════════════════════════════════════════════════════════ */

export default function RemindersPage() {
  const { t } = useI18n();
  const [alerts, setAlerts] = useState<AlertsData | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [contracts, setContracts] = useState<ContractOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [formContractId, setFormContractId] = useState("");
  const [formType, setFormType] = useState("custom");
  const [formMessage, setFormMessage] = useState("");
  const [formDate, setFormDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [alertsRes, remindersRes, contractsRes] = await Promise.all([
        api.get("/reminders/alerts"),
        api.get("/reminders/upcoming"),
        api.get("/contracts", { params: { limit: 100 } }),
      ]);
      setAlerts(alertsRes.data.data);
      setReminders(remindersRes.data.data);
      const items = contractsRes.data.data?.items ?? [];
      setContracts(items.map((c: any) => ({ id: c.id, title: c.title })));
    } catch {
      toast.error("Hiba az adatok betöltésekor");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formContractId || !formDate || !formMessage) {
      toast.error("Töltsd ki az összes mezőt!");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/reminders", {
        contractId: formContractId,
        type: formType,
        message: formMessage,
        remindAt: new Date(formDate).toISOString(),
      });
      toast.success("Emlékeztető létrehozva!");
      setFormContractId("");
      setFormType("custom");
      setFormMessage("");
      setFormDate("");
      loadData();
    } catch {
      toast.error("Hiba az emlékeztető létrehozásakor");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/reminders/${id}`);
      toast.success("Emlékeztető törölve");
      setReminders((prev) => prev.filter((r) => r.id !== id));
    } catch {
      toast.error("Hiba a törléskor");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded-xl w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-gray-100 dark:bg-gray-800 rounded-xl" />
          ))}
        </div>
        <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-xl" />
      </div>
    );
  }

  return (
    <FeatureGate featureKey="contract_reminders" featureName="Emlékeztetők">
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {t("reminders.title")}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t("reminders.subtitle")}
          </p>
        </div>
        {alerts && alerts.totalAlerts > 0 && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            {alerts.totalAlerts} {t("reminders.activeAlerts")}
          </span>
        )}
      </div>

      {/* ── Alert Cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Expiring in 7 days - RED */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border-l-4 border-l-red-500 border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
              <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-red-700 dark:text-red-400">{t("reminders.expiringSoon")}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">7 napon belül</p>
            </div>
            <span className="ml-auto text-lg font-bold text-red-600 dark:text-red-400">
              {alerts?.expiringIn7Days.length ?? 0}
            </span>
          </div>
          {alerts?.expiringIn7Days.length ? (
            <div className="space-y-2">
              {alerts.expiringIn7Days.map((c) => (
                <Link
                  key={c.id}
                  href={`/contracts/${c.id}`}
                  className="block p-2.5 rounded-lg bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition"
                >
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{c.title}</p>
                  <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                    {c.daysUntilExpiry === 0 ? "Ma lejár!" : `${c.daysUntilExpiry} nap múlva jár le`}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic">Nincs lejáró szerződés</p>
          )}
        </div>

        {/* Expiring in 30 days - YELLOW */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border-l-4 border-l-yellow-500 border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-yellow-100 dark:bg-yellow-900/40 flex items-center justify-center">
              <svg className="w-4 h-4 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-yellow-700 dark:text-yellow-400">{t("reminders.warning")}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">30 napon belül</p>
            </div>
            <span className="ml-auto text-lg font-bold text-yellow-600 dark:text-yellow-400">
              {alerts?.expiringIn30Days.length ?? 0}
            </span>
          </div>
          {alerts?.expiringIn30Days.length ? (
            <div className="space-y-2">
              {alerts.expiringIn30Days.map((c) => (
                <Link
                  key={c.id}
                  href={`/contracts/${c.id}`}
                  className="block p-2.5 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition"
                >
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{c.title}</p>
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-0.5">
                    {c.daysUntilExpiry} nap múlva jár le
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic">Nincs figyelmeztetés</p>
          )}
        </div>

        {/* Stale unsigned - BLUE */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border-l-4 border-l-blue-500 border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-400">{t("reminders.awaitingSignature")}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">3+ napja elkuldve</p>
            </div>
            <span className="ml-auto text-lg font-bold text-blue-600 dark:text-blue-400">
              {alerts?.staleUnsigned.length ?? 0}
            </span>
          </div>
          {alerts?.staleUnsigned.length ? (
            <div className="space-y-2">
              {alerts.staleUnsigned.slice(0, 5).map((c) => (
                <Link
                  key={c.id}
                  href={`/contracts/${c.id}`}
                  className="block p-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition"
                >
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{c.title}</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                    {c.daysSinceCreated} napja vár aláírásra
                    {c.signers && c.signers.length > 0 && (
                      <span className="text-gray-400"> - {c.signers.map((s) => s.name).join(", ")}</span>
                    )}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic">Nincs várakozó szerződés</p>
          )}
        </div>
      </div>

      {/* ── Two-Column: Upcoming + Add Form ────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT: Upcoming Reminders */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
            <h2 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
              {t("reminders.upcoming")}
            </h2>
          </div>
          {reminders.length > 0 ? (
            <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
              {reminders.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
                >
                  <div className="min-w-0 flex-1 mr-4">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ${
                        r.type === "expiry"
                          ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                          : r.type === "renewal"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                          : r.type === "signing_deadline"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                          : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                      }`}>
                        {typeLabels[r.type] ?? r.type}
                      </span>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {r.message}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-xs text-gray-400">
                        {new Date(r.remindAt).toLocaleDateString("hu-HU", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                      {r.contract && (
                        <Link
                          href={`/contracts/${r.contract.id}`}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {r.contract.title}
                        </Link>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(r.id)}
                    className="shrink-0 p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                    title="Törlés"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-5 py-12 text-center">
              <svg className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <p className="text-sm text-gray-400">{t("reminders.empty")}</p>
              <p className="text-xs text-gray-400 mt-1">{t("reminders.emptyDesc")}</p>
            </div>
          )}
        </div>

        {/* RIGHT: Add Reminder Form */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-4">
            {t("reminders.newReminder")}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Contract select */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Szerződés
              </label>
              <select
                value={formContractId}
                onChange={(e) => setFormContractId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="">Válassz szerződést...</option>
                {contracts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Type select */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Típus
              </label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                {Object.entries(typeLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Date picker */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Dátum
              </label>
              <input
                type="datetime-local"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            {/* Message */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Üzenet
              </label>
              <textarea
                value={formMessage}
                onChange={(e) => setFormMessage(e.target.value)}
                rows={3}
                placeholder="Pl.: Szerződés megújítása szükséges..."
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gray-900 dark:bg-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition disabled:opacity-50"
            >
              {submitting ? t("reminders.creating") : t("reminders.createReminder")}
            </button>
          </form>
        </div>
      </div>
    </div>
    </FeatureGate>
  );
}
