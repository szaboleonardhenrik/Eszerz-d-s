"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { useI18n } from "@/lib/i18n";

interface Partner {
  id: string;
  name: string;
  email: string;
  company?: string;
  phone?: string;
  taxNumber?: string;
  address?: string;
  notes?: string;
  group?: string;
  contracts: PartnerContract[];
}

interface PartnerContract {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  signers: { status: string; signedAt: string | null; signatureMethod: string | null }[];
}

interface TimelineEvent {
  id: string;
  eventType: string;
  createdAt: string;
  ipAddress?: string;
  contract: { title: string } | null;
  signer: { name: string; email: string } | null;
}

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600", sent: "bg-blue-100 text-blue-700",
  partially_signed: "bg-yellow-100 text-yellow-700", completed: "bg-green-100 text-green-700",
  declined: "bg-red-100 text-red-700", expired: "bg-orange-100 text-orange-700",
  cancelled: "bg-gray-100 text-gray-500",
};
const eventIcons: Record<string, { color: string; icon: string }> = {
  signed: { color: "bg-green-500", icon: "M5 13l4 4L19 7" },
  declined: { color: "bg-red-500", icon: "M6 18L18 6M6 6l12 12" },
  email_sent: { color: "bg-blue-500", icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
  contract_created: { color: "bg-teal-500", icon: "M12 4v16m8-8H4" },
  document_viewed: { color: "bg-purple-500", icon: "M15 12a3 3 0 11-6 0 3 3 0 016 0z" },
  downloaded: { color: "bg-cyan-500", icon: "M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
};
const defaultEventIcon = { color: "bg-gray-400", icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" };

export default function PartnerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { t } = useI18n();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"contracts" | "timeline">("contracts");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ company: "", phone: "", taxNumber: "", address: "", notes: "", group: "" });
  const [saving, setSaving] = useState(false);

  const statusLabels: Record<string, string> = {
    draft: t("contracts.status.draft"), sent: t("contracts.status.sent"),
    partially_signed: t("contracts.status.partially_signed"),
    completed: t("contracts.status.completed"), declined: t("contracts.status.declined"),
    expired: t("contracts.status.expired"), cancelled: t("contracts.status.cancelled"),
  };

  const eventLabels: Record<string, string> = {
    contract_created: t("contactDetail.eventContractCreated"),
    email_sent: t("contactDetail.eventEmailSent"),
    document_viewed: t("contactDetail.eventDocumentViewed"),
    signed: t("contactDetail.eventSigned"),
    declined: t("contactDetail.eventDeclined"),
    reminder_sent: t("contactDetail.eventReminderSent"),
    expired: t("contactDetail.eventExpired"),
    downloaded: t("contactDetail.eventDownloaded"),
    contract_duplicated: t("contactDetail.eventDuplicated"),
    contract_updated: t("contactDetail.eventUpdated"),
    contract_archived: t("contactDetail.eventArchived"),
    contract_unarchived: t("contactDetail.eventUnarchived"),
  };

  const groups = [
    t("contactDetail.groupClients"),
    t("contactDetail.groupSuppliers"),
    t("contactDetail.groupSubcontractors"),
    t("contactDetail.groupPartners"),
    t("contactDetail.groupOther"),
  ];

  useEffect(() => {
    loadPartner();
    loadTimeline();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadPartner = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/contacts/${id}`, { params: { withContracts: "true" } });
      setPartner(res.data.data);
      const p = res.data.data;
      setForm({ company: p.company ?? "", phone: p.phone ?? "", taxNumber: p.taxNumber ?? "", address: p.address ?? "", notes: p.notes ?? "", group: p.group ?? "" });
    } catch { toast.error(t("contactDetail.loadError")); router.push("/contacts"); }
    finally { setLoading(false); }
  };

  const loadTimeline = async () => {
    try {
      const res = await api.get(`/contacts/${id}/timeline`);
      setTimeline(res.data.data ?? []);
    } catch {}
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/contacts/${id}`, form);
      toast.success(t("contactDetail.saveSuccess"));
      setEditing(false);
      loadPartner();
    } catch { toast.error(t("contactDetail.saveError")); }
    finally { setSaving(false); }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString("hu-HU", { year: "numeric", month: "short", day: "numeric" });
  const formatDateTime = (d: string) => new Date(d).toLocaleString("hu-HU", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#198296]" />
    </div>
  );

  if (!partner) return null;

  const signedContracts = partner.contracts?.filter(c => c.signers.some(s => s.status === "signed")).length ?? 0;
  const totalContracts = partner.contracts?.length ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Link href="/contacts" className="hover:text-[#198296] transition">{t("nav.contacts")}</Link>
        <span>/</span>
        <span className="text-gray-600 dark:text-gray-300">{partner.name}</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: Partner info */}
        <div className="lg:w-80 shrink-0 space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl border p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#198296] to-[#41A5B9] flex items-center justify-center text-white font-bold text-xl">
                {(partner.name || "").split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{partner.name}</h1>
                <p className="text-sm text-gray-500">{partner.email}</p>
              </div>
            </div>

            {partner.group && (
              <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-[#198296]/10 text-[#198296] mb-4">
                {partner.group}
              </span>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalContracts}</p>
                <p className="text-xs text-gray-400">{t("contactDetail.contract")}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-green-600">{signedContracts}</p>
                <p className="text-xs text-gray-400">{t("contactDetail.signed")}</p>
              </div>
            </div>

            {/* Details */}
            {!editing ? (
              <div className="space-y-3">
                {partner.company && <InfoRow label={t("contactDetail.companyName")} value={partner.company} />}
                {partner.phone && <InfoRow label={t("contactDetail.phone")} value={partner.phone} />}
                {partner.taxNumber && <InfoRow label={t("contactDetail.taxNumber")} value={partner.taxNumber} />}
                {partner.address && <InfoRow label={t("contactDetail.address")} value={partner.address} />}
                {partner.notes && <InfoRow label={t("contactDetail.notes")} value={partner.notes} />}
                <button onClick={() => setEditing(true)}
                  className="w-full mt-2 px-4 py-2 text-sm font-medium border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                  {t("contactDetail.editData")}
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <EditField label={t("contactDetail.companyName")} value={form.company} onChange={v => setForm({ ...form, company: v })} />
                <EditField label={t("contactDetail.phone")} value={form.phone} onChange={v => setForm({ ...form, phone: v })} />
                <EditField label={t("contactDetail.taxNumber")} value={form.taxNumber} onChange={v => setForm({ ...form, taxNumber: v })} />
                <EditField label={t("contactDetail.address")} value={form.address} onChange={v => setForm({ ...form, address: v })} />
                <div>
                  <label className="block text-xs text-gray-400 mb-1">{t("contactDetail.group")}</label>
                  <select value={form.group} onChange={e => setForm({ ...form, group: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-700 dark:border-gray-600">
                    <option value="">{t("contactDetail.noGroup")}</option>
                    {groups.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">{t("contactDetail.notes")}</label>
                  <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-700 dark:border-gray-600" />
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={() => setEditing(false)} className="flex-1 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">{t("contactDetail.cancel")}</button>
                  <button onClick={handleSave} disabled={saving}
                    className="flex-1 px-3 py-2 text-sm font-medium text-white bg-[#198296] hover:bg-[#146d7d] rounded-lg transition disabled:opacity-50">
                    {saving ? t("contactDetail.saving") : t("contactDetail.save")}
                  </button>
                </div>
              </div>
            )}

            {/* Quick action */}
            <Link
              href={`/create?signerName=${encodeURIComponent(partner.name)}&signerEmail=${encodeURIComponent(partner.email)}${partner.company ? `&signerCompany=${encodeURIComponent(partner.company)}` : ""}`}
              className="flex items-center justify-center gap-2 w-full mt-4 px-4 py-2.5 text-sm font-medium text-white bg-[#198296] hover:bg-[#146d7d] rounded-lg transition"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t("contactDetail.newContractWith")}
            </Link>
          </div>
        </div>

        {/* Right: Contracts + Timeline */}
        <div className="flex-1 min-w-0">
          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 mb-4">
            <button onClick={() => setActiveTab("contracts")}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition ${activeTab === "contracts" ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm" : "text-gray-500"}`}>
              {t("contactDetail.contractsTab")} ({totalContracts})
            </button>
            <button onClick={() => setActiveTab("timeline")}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition ${activeTab === "timeline" ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm" : "text-gray-500"}`}>
              {t("contactDetail.activityTab")}
            </button>
          </div>

          {activeTab === "contracts" ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl border">
              {!partner.contracts?.length ? (
                <div className="p-12 text-center">
                  <p className="text-gray-400">{t("contactDetail.noContracts")}</p>
                  <Link href={`/create?signerName=${encodeURIComponent(partner.name)}&signerEmail=${encodeURIComponent(partner.email)}`}
                    className="inline-block mt-3 text-sm text-[#198296] hover:underline">
                    {t("contactDetail.createOne")}
                  </Link>
                </div>
              ) : (
                <div className="divide-y dark:divide-gray-700">
                  {partner.contracts.map(c => {
                    const signerStatus = c.signers?.[0];
                    return (
                      <Link key={c.id} href={`/contracts/${c.id}`}
                        className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{c.title}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-gray-400">{formatDate(c.createdAt)}</span>
                            {signerStatus?.signedAt && (
                              <span className="text-xs text-green-600">{t("contactDetail.signedAt")}: {formatDate(signerStatus.signedAt)}</span>
                            )}
                          </div>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[c.status] ?? "bg-gray-100 text-gray-600"}`}>
                          {statusLabels[c.status] ?? c.status}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl border p-5">
              {timeline.length === 0 ? (
                <p className="text-center text-gray-400 py-8">{t("contactDetail.noActivity")}</p>
              ) : (
                <div className="relative">
                  <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-gray-100 dark:bg-gray-700" />
                  <div className="space-y-4">
                    {timeline.map(event => {
                      const ei = eventIcons[event.eventType] ?? defaultEventIcon;
                      return (
                        <div key={event.id} className="flex gap-4 relative">
                          <div className={`w-8 h-8 rounded-full ${ei.color} flex items-center justify-center shrink-0 z-10`}>
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={ei.icon} />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0 pb-1">
                            <p className="text-sm text-gray-900 dark:text-gray-100">
                              <span className="font-medium">{eventLabels[event.eventType] ?? event.eventType}</span>
                              {event.contract && (
                                <span className="text-gray-500"> — {event.contract.title}</span>
                              )}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(event.createdAt)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm text-gray-900 dark:text-gray-100">{value}</p>
    </div>
  );
}

function EditField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1">{label}</label>
      <input type="text" value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-700 dark:border-gray-600" />
    </div>
  );
}
