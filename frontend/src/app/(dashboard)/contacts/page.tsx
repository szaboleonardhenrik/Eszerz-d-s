"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import toast from "react-hot-toast";
import FeatureGate from "@/components/feature-gate";
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
  contractCount: number;
  lastSignedAt: string | null;
  companies?: { company: { id: string; name: string; taxNumber?: string }; role?: string }[];
}

interface Company {
  id: string;
  name: string;
  taxNumber?: string;
  address?: string;
  phone?: string;
  email?: string;
  notes?: string;
  contacts: { contact: { id: string; name: string; email: string }; role?: string }[];
}

const emptyForm = { name: "", email: "", company: "", phone: "", taxNumber: "", address: "", notes: "", group: "" };
const emptyCompanyForm = { name: "", taxNumber: "", address: "", phone: "", email: "", notes: "" };
const defaultGroups = ["Ügyfelek", "Beszállítók", "Alvállalkozók", "Partnerek", "Egyéb"];

export default function PartnersPage() {
  const { t } = useI18n();
  const [tab, setTab] = useState<"partners" | "companies">("partners");
  const [partners, setPartners] = useState<Partner[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const [groups, setGroups] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  // Company state
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);
  const [companyForm, setCompanyForm] = useState(emptyCompanyForm);
  const [companySearch, setCompanySearch] = useState("");

  // Link contact to company state
  const [linkModal, setLinkModal] = useState<{ contactId: string; contactName: string } | null>(null);
  const [linkCompanyId, setLinkCompanyId] = useState("");
  const [linkRole, setLinkRole] = useState("");

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [search, groupFilter]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadGroups(); loadCompanies(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { withStats: "true" };
      if (search) params.search = search;
      if (groupFilter) params.group = groupFilter;
      const res = await api.get("/contacts", { params });
      setPartners(res.data.data ?? []);
    } catch { toast.error(t("contacts.loadError")); }
    finally { setLoading(false); }
  };

  const loadGroups = async () => {
    try {
      const res = await api.get("/contacts/groups");
      setGroups(res.data.data ?? []);
    } catch {}
  };

  const loadCompanies = async () => {
    try {
      const params: Record<string, string> = {};
      if (companySearch) params.search = companySearch;
      const res = await api.get("/contacts/companies/list", { params });
      setCompanies(res.data.data ?? []);
    } catch {}
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (tab === "companies") loadCompanies(); }, [companySearch, tab]);

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.email.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/contacts/${editingId}`, form);
        toast.success(t("contacts.partnerUpdated"));
      } else {
        await api.post("/contacts", form);
        toast.success(t("contacts.partnerAdded"));
      }
      setForm(emptyForm);
      setShowForm(false);
      setEditingId(null);
      load();
      loadGroups();
    } catch (err: unknown) {
      const axiosMsg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      toast.error(axiosMsg ?? t("contacts.genericError"));
    } finally { setSaving(false); }
  };

  const handleCompanySubmit = async () => {
    if (!companyForm.name.trim()) return;
    setSaving(true);
    try {
      if (editingCompanyId) {
        await api.put(`/contacts/companies/${editingCompanyId}`, companyForm);
        toast.success(t("contacts.companyUpdated"));
      } else {
        await api.post("/contacts/companies", companyForm);
        toast.success(t("contacts.companyAdded"));
      }
      setCompanyForm(emptyCompanyForm);
      setShowCompanyForm(false);
      setEditingCompanyId(null);
      loadCompanies();
    } catch (err: unknown) {
      const axiosMsg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      toast.error(axiosMsg ?? t("contacts.genericError"));
    } finally { setSaving(false); }
  };

  const handleLinkSubmit = async () => {
    if (!linkModal || !linkCompanyId) return;
    try {
      await api.post(`/contacts/${linkModal.contactId}/companies/${linkCompanyId}`, { role: linkRole || undefined });
      toast.success(t("contacts.partnerLinked"));
      setLinkModal(null);
      setLinkCompanyId("");
      setLinkRole("");
      load();
      loadCompanies();
    } catch (err: unknown) {
      const axiosMsg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      toast.error(axiosMsg ?? t("contacts.genericError"));
    }
  };

  const handleUnlink = async (contactId: string, companyId: string) => {
    try {
      await api.delete(`/contacts/${contactId}/companies/${companyId}`);
      toast.success(t("contacts.companyUnlinked"));
      load();
      loadCompanies();
    } catch { toast.error(t("contacts.genericError")); }
  };

  const startEdit = (p: Partner) => {
    setEditingId(p.id);
    setForm({ name: p.name, email: p.email, company: p.company ?? "", phone: p.phone ?? "", taxNumber: p.taxNumber ?? "", address: p.address ?? "", notes: p.notes ?? "", group: p.group ?? "" });
    setShowForm(true);
  };

  const startEditCompany = (c: Company) => {
    setEditingCompanyId(c.id);
    setCompanyForm({ name: c.name, taxNumber: c.taxNumber ?? "", address: c.address ?? "", phone: c.phone ?? "", email: c.email ?? "", notes: c.notes ?? "" });
    setShowCompanyForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("contacts.deleteConfirm"))) return;
    try {
      await api.delete(`/contacts/${id}`);
      toast.success(t("contacts.partnerDeleted"));
      load();
    } catch { toast.error(t("contacts.deleteError")); }
  };

  const handleDeleteCompany = async (id: string) => {
    if (!confirm(t("contacts.deleteCompanyConfirm"))) return;
    try {
      await api.delete(`/contacts/companies/${id}`);
      toast.success(t("contacts.companyDeleted"));
      loadCompanies();
    } catch { toast.error(t("contacts.deleteError")); }
  };

  const handleExport = async (format: "csv" | "json") => {
    try {
      const params: Record<string, string> = { format };
      if (groupFilter) params.group = groupFilter;
      const res = await api.get("/contacts/export", { params, responseType: "blob" });
      const blob = new Blob([res.data], { type: format === "json" ? "application/json" : "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = format === "json" ? "partnerek.json" : "partnerek.csv";
      a.click();
      URL.revokeObjectURL(url);
      toast.success(t("contacts.exportSuccess"));
    } catch { toast.error(t("contacts.exportError")); }
  };

  const formatDate = (d: string | null) => {
    if (!d) return "-";
    return new Date(d).toLocaleDateString("hu-HU", { year: "numeric", month: "short", day: "numeric" });
  };

  const allGroups = [...new Set([...defaultGroups, ...groups])];
  const inputCls = "w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#41A5B9]";

  return (
    <FeatureGate requiredTier="medium" featureName="Partnerlista (CRM)">
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t("contacts.title")}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {tab === "partners"
              ? (groupFilter ? t("contacts.subtitleFiltered", { count: partners.length, group: groupFilter }) : t("contacts.subtitle", { count: partners.length }))
              : t("contacts.subtitleCompanies", { count: companies.length })}
          </p>
        </div>
        <div className="flex gap-2">
          {tab === "partners" && (
            <>
              <button onClick={() => handleExport("csv")}
                className="px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                CSV
              </button>
              <button onClick={() => handleExport("json")}
                className="px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                JSON
              </button>
              <button onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(true); }}
                className="bg-[#198296] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#146d7d] transition text-sm">
                + {t("contacts.new")}
              </button>
            </>
          )}
          {tab === "companies" && (
            <button onClick={() => { setCompanyForm(emptyCompanyForm); setEditingCompanyId(null); setShowCompanyForm(true); }}
              className="bg-[#198296] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#146d7d] transition text-sm">
              + {t("contacts.newCompany")}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 w-fit">
        <button
          onClick={() => setTab("partners")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            tab === "partners"
              ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
          }`}
        >
          {t("contacts.tabs.partners")}
        </button>
        <button
          onClick={() => setTab("companies")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            tab === "companies"
              ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
          }`}
        >
          {t("contacts.tabs.companies")}
        </button>
      </div>

      {/* ── PARTNERS TAB ── */}
      {tab === "partners" && (
        <>
          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-4">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("contacts.searchPlaceholder")}
              className="flex-1 min-w-[200px] max-w-md px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#41A5B9]"
            />
            <select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="">{t("contacts.allGroups")}</option>
              {allGroups.map(g => <option key={g} value={g}>{g}</option>)}
              <option value="__none">{t("contacts.noGroup")}</option>
            </select>
            {(search || groupFilter) && (
              <button onClick={() => { setSearch(""); setGroupFilter(""); }}
                className="px-3 py-2 text-sm text-red-500 hover:underline">{t("contacts.clearFilters")}</button>
            )}
          </div>

          {/* Partner list */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#198296] mx-auto" />
              </div>
            ) : partners.length === 0 ? (
              <div className="p-12 text-center">
                <svg className="w-12 h-12 mx-auto text-gray-200 dark:text-gray-700 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="text-gray-500 dark:text-gray-400 font-medium">
                  {search || groupFilter ? t("contacts.emptyFiltered") : t("contacts.empty")}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  {t("contacts.emptyDesc")}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                      <th className="px-4 py-3 font-medium">{t("contacts.table.partner")}</th>
                      <th className="px-4 py-3 font-medium hidden sm:table-cell">{t("contacts.table.companies")}</th>
                      <th className="px-4 py-3 font-medium hidden md:table-cell">{t("contacts.table.group")}</th>
                      <th className="px-4 py-3 font-medium hidden md:table-cell">{t("contacts.table.contracts")}</th>
                      <th className="px-4 py-3 font-medium hidden lg:table-cell">{t("contacts.table.lastSigned")}</th>
                      <th className="px-4 py-3 font-medium w-48"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {partners.map((p) => (
                      <tr key={p.id} className="border-b border-gray-200 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                        <td className="px-4 py-3">
                          <Link href={`/contacts/${p.id}`} className="group">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-[#198296] transition">{p.name}</p>
                            <p className="text-xs text-gray-400">{p.email}</p>
                          </Link>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          {p.companies && p.companies.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {p.companies.map((cc) => (
                                <span key={cc.company.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                                  {cc.company.name}
                                  <button onClick={() => handleUnlink(p.id, cc.company.id)}
                                    className="text-blue-400 hover:text-red-500 ml-0.5" title="Leválasztás">&times;</button>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-300">{p.company || "-"}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          {p.group ? (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#198296]/10 text-[#198296]">{p.group}</span>
                          ) : (
                            <span className="text-xs text-gray-300">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          {p.contractCount > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                              {p.contractCount}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-300">0</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400 hidden lg:table-cell">
                          {formatDate(p.lastSignedAt)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1 justify-end">
                            <button onClick={() => setLinkModal({ contactId: p.id, contactName: p.name })}
                              className="text-xs px-2 py-1 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition" title="Céghez rendelés">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                            </button>
                            <Link href={`/create?signerName=${encodeURIComponent(p.name)}&signerEmail=${encodeURIComponent(p.email)}${p.company ? `&signerCompany=${encodeURIComponent(p.company)}` : ""}`}
                              className="text-xs px-2 py-1 rounded-lg text-[#198296] hover:bg-[#198296]/10 transition" title="Új szerződés">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                            </Link>
                            <Link href={`/contacts/${p.id}`}
                              className="text-xs px-2 py-1 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-600 transition">{t("contacts.actions.profile")}</Link>
                            <button onClick={() => startEdit(p)}
                              className="text-xs px-2 py-1 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600 transition">{t("contacts.actions.edit")}</button>
                            <button onClick={() => handleDelete(p.id)}
                              className="text-xs px-2 py-1 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition">{t("contacts.actions.delete")}</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── COMPANIES TAB ── */}
      {tab === "companies" && (
        <>
          <div className="flex flex-wrap gap-3 mb-4">
            <input
              type="text"
              value={companySearch}
              onChange={(e) => setCompanySearch(e.target.value)}
              placeholder={t("contacts.searchCompanyPlaceholder")}
              className="flex-1 min-w-[200px] max-w-md px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#41A5B9]"
            />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            {companies.length === 0 ? (
              <div className="p-12 text-center">
                <svg className="w-12 h-12 mx-auto text-gray-200 dark:text-gray-700 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <p className="text-gray-500 dark:text-gray-400 font-medium">{t("contacts.emptyCompanies")}</p>
                <p className="text-sm text-gray-400 mt-1">{t("contacts.emptyCompaniesDesc")}</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {companies.map((c) => (
                  <div key={c.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{c.name}</h3>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-gray-500 dark:text-gray-400">
                              {c.taxNumber && <span>Adószám: {c.taxNumber}</span>}
                              {c.address && <span>{c.address}</span>}
                              {c.phone && <span>{c.phone}</span>}
                              {c.email && <span>{c.email}</span>}
                            </div>
                          </div>
                        </div>
                        {c.contacts.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {c.contacts.map((cc) => (
                              <Link
                                key={cc.contact.id}
                                href={`/contacts/${cc.contact.id}`}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                              >
                                <span className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-[9px] font-bold">
                                  {cc.contact.name.charAt(0).toUpperCase()}
                                </span>
                                {cc.contact.name}
                                {cc.role && <span className="text-gray-400">({cc.role})</span>}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => startEditCompany(c)}
                          className="text-xs px-2 py-1 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600 transition">{t("contacts.actions.edit")}</button>
                        <button onClick={() => handleDeleteCompany(c.id)}
                          className="text-xs px-2 py-1 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition">{t("contacts.actions.delete")}</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Partner form modal ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {editingId ? t("contacts.form.editPartner") : t("contacts.form.newPartner")}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t("contacts.form.name")} *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t("contacts.form.email")} *</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t("contacts.form.companyName")}</label>
                <input type="text" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t("contacts.form.phone")}</label>
                <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t("contacts.form.taxNumber")}</label>
                <input type="text" value={form.taxNumber} onChange={(e) => setForm({ ...form, taxNumber: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t("contacts.form.address")}</label>
                <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t("contacts.form.group")}</label>
                <select value={form.group} onChange={(e) => setForm({ ...form, group: e.target.value })}
                  className={inputCls}>
                  <option value="">{t("contacts.form.noGroup")}</option>
                  {allGroups.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t("contacts.form.notes")}</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2} className={inputCls} />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => { setShowForm(false); setEditingId(null); }}
                className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">{t("common.cancel")}</button>
              <button onClick={handleSubmit} disabled={saving || !form.name.trim() || !form.email.trim()}
                className="px-5 py-2 text-sm font-medium text-white bg-[#198296] hover:bg-[#146d7d] rounded-lg transition disabled:opacity-50">
                {saving ? t("contacts.form.saving") : editingId ? t("contacts.form.update") : t("contacts.form.create")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Company form modal ── */}
      {showCompanyForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {editingCompanyId ? t("contacts.form.editCompany") : t("contacts.form.newCompany")}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t("contacts.form.companyName")} *</label>
                <input type="text" value={companyForm.name} onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t("contacts.form.taxNumber")}</label>
                <input type="text" value={companyForm.taxNumber} onChange={(e) => setCompanyForm({ ...companyForm, taxNumber: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t("contacts.form.address")}</label>
                <input type="text" value={companyForm.address} onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t("contacts.form.phone")}</label>
                <input type="text" value={companyForm.phone} onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t("contacts.form.email")}</label>
                <input type="email" value={companyForm.email} onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })} className={inputCls} />
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t("contacts.form.notes")}</label>
                <textarea value={companyForm.notes} onChange={(e) => setCompanyForm({ ...companyForm, notes: e.target.value })}
                  rows={2} className={inputCls} />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => { setShowCompanyForm(false); setEditingCompanyId(null); }}
                className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">{t("common.cancel")}</button>
              <button onClick={handleCompanySubmit} disabled={saving || !companyForm.name.trim()}
                className="px-5 py-2 text-sm font-medium text-white bg-[#198296] hover:bg-[#146d7d] rounded-lg transition disabled:opacity-50">
                {saving ? t("contacts.form.saving") : editingCompanyId ? t("contacts.form.update") : t("contacts.form.create")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Link contact to company modal ── */}
      {linkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
              {t("contacts.linkModal.title")}
            </h2>
            <p className="text-sm text-gray-500 mb-4">{linkModal.contactName}</p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t("contacts.linkModal.company")} *</label>
                <select value={linkCompanyId} onChange={(e) => setLinkCompanyId(e.target.value)} className={inputCls}>
                  <option value="">{t("contacts.linkModal.selectCompany")}</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t("contacts.linkModal.role")}</label>
                <input type="text" value={linkRole} onChange={(e) => setLinkRole(e.target.value)}
                  placeholder={t("contacts.linkModal.rolePlaceholder")} className={inputCls} />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => { setLinkModal(null); setLinkCompanyId(""); setLinkRole(""); }}
                className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">{t("common.cancel")}</button>
              <button onClick={handleLinkSubmit} disabled={!linkCompanyId}
                className="px-5 py-2 text-sm font-medium text-white bg-[#198296] hover:bg-[#146d7d] rounded-lg transition disabled:opacity-50">
                {t("contacts.linkModal.assign")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </FeatureGate>
  );
}
