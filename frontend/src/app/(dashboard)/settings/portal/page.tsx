"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { useI18n } from "@/lib/i18n";

interface PortalInvitation {
  id: string;
  email: string;
  status: string;
  createdAt: string;
}

export default function PortalSettingsPage() {
  const { t } = useI18n();
  const [invitations, setInvitations] = useState<PortalInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const loadInvitations = useCallback(async () => {
    try {
      const res = await api.get("/portal/invitations");
      setInvitations(res.data.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInvitations();
  }, [loadInvitations]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError("");
    setSuccess("");
    try {
      await api.post("/portal/invite", { email });
      setSuccess(t("portal.inviteSent"));
      setEmail("");
      loadInvitations();
    } catch (err: unknown) {
      const axiosMsg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      setError(axiosMsg ?? t("portal.inviteError"));
    } finally {
      setSending(false);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm(t("portal.confirmRevoke"))) return;
    try {
      await api.delete(`/portal/invitations/${id}`);
      loadInvitations();
    } catch {
      // ignore
    }
  };

  const statusLabels: Record<string, string> = {
    pending: t("portal.statusPending"),
    accepted: t("portal.statusAccepted"),
    revoked: t("portal.statusRevoked"),
  };

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300",
    accepted: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
    revoked: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          {t("portal.settingsTitle")}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {t("portal.settingsSubtitle")}
        </p>
      </div>

      {/* Invite form */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
          {t("portal.invitePartner")}
        </h3>
        <form onSubmit={handleInvite} className="flex items-end gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t("portal.partnerEmail")}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="partner@ceg.hu"
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-teal/50 focus:border-brand-teal outline-none transition text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={sending}
            className="px-6 py-2.5 bg-brand-teal-dark hover:bg-brand-teal text-white font-medium rounded-xl transition disabled:opacity-50 text-sm whitespace-nowrap"
          >
            {sending ? t("common.loading") : t("portal.sendInvite")}
          </button>
        </form>
        {success && (
          <p className="mt-3 text-sm text-green-600 dark:text-green-400">{success}</p>
        )}
        {error && (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>

      {/* Invitations list */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {t("portal.invitedPartners")}
          </h3>
        </div>
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-teal-dark mx-auto" />
          </div>
        ) : invitations.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">
            {t("portal.noInvitations")}
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {invitations.map((inv) => (
              <div key={inv.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {inv.email}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(inv.createdAt).toLocaleDateString("hu-HU")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[inv.status] ?? ""}`}>
                    {statusLabels[inv.status] ?? inv.status}
                  </span>
                  {inv.status === "pending" && (
                    <button
                      onClick={() => handleRevoke(inv.id)}
                      className="text-xs text-red-500 hover:text-red-700 font-medium"
                    >
                      {t("portal.revoke")}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
