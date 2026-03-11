"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { useAuth } from "@/lib/auth-store";
import VersionDiff from "@/components/version-diff";
import QrSigningModal from "@/components/qr-signing-modal";
import RiskAnalysis from "@/components/risk-analysis";
import { sanitizeHtml } from "@/lib/sanitize";

/* ── Interfaces ──────────────────────────────────────────────────── */

interface Signer {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  signedAt: string | null;
  signingOrder: number;
  signatureMethod: string | null;
  signerNote?: string | null;
}

interface AuditEntry {
  id: string;
  eventType: string;
  eventData: any;
  ipAddress: string;
  createdAt: string;
  signer?: { name: string; email: string };
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: { id: string; name: string; email: string };
}

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface ContractVersion {
  id: string;
  version: number;
  contentHtml: string;
  changeNote: string | null;
  createdAt: string;
}

interface Contract {
  id: string;
  title: string;
  status: string;
  contentHtml: string;
  pdfUrl: string | null;
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
  signers: Signer[];
  auditLogs: AuditEntry[];
  template?: { name: string; category: string };
  tags?: { tag: Tag }[];
}

interface AiAnalysis {
  summary: string;
  risks: string[];
  suggestions: string[];
  missingClauses: string[];
  legalCompliance: string;
}

/* ── Constants ───────────────────────────────────────────────────── */

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
  draft: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
  sent: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  partially_signed: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  completed: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  declined: "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300",
  expired: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  cancelled: "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400",
};

const statusDotColors: Record<string, string> = {
  draft: "bg-gray-400",
  sent: "bg-blue-500",
  partially_signed: "bg-yellow-500",
  completed: "bg-green-500",
  declined: "bg-red-500",
  expired: "bg-orange-500",
  cancelled: "bg-gray-500",
};

const signerStatusConfig: Record<string, { dot: string; bg: string; label: string }> = {
  pending: { dot: "bg-yellow-400", bg: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300", label: "Várakozik" },
  signed: { dot: "bg-green-500", bg: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300", label: "Aláírta" },
  declined: { dot: "bg-red-500", bg: "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300", label: "Visszautasította" },
  expired: { dot: "bg-gray-400", bg: "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400", label: "Lejárt" },
};

const eventLabels: Record<string, string> = {
  contract_created: "Szerződés létrehozva",
  contract_updated: "Szerződés szerkesztve",
  email_sent: "Email elküldve",
  document_viewed: "Dokumentum megtekintve",
  signed: "Aláírva",
  declined: "Visszautasítva",
  reminder_sent: "Emlékeztető küldve",
  expired: "Lejárt / Visszavonva",
  downloaded: "Letöltve",
  contract_duplicated: "Szerződés duplikálva",
};

const eventIcons: Record<string, string> = {
  contract_created: "M12 4v16m8-8H4",
  contract_updated: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
  email_sent: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
  document_viewed: "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z",
  signed: "M5 13l4 4L19 7",
  declined: "M6 18L18 6M6 6l12 12",
  reminder_sent: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
  expired: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  downloaded: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4",
  contract_duplicated: "M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z",
};

/* ── Signing Timeline Component ──────────────────────────────────── */

function SigningTimeline({ signers }: { signers: Signer[] }) {
  const sorted = [...signers].sort((a, b) => a.signingOrder - b.signingOrder);

  return (
    <div className="relative">
      {sorted.map((signer, idx) => {
        const config = signerStatusConfig[signer.status] ?? signerStatusConfig.pending;
        const isLast = idx === sorted.length - 1;

        return (
          <div key={signer.id} className="relative flex gap-4">
            {/* Timeline line + dot */}
            <div className="flex flex-col items-center">
              <div className={`w-3.5 h-3.5 rounded-full border-2 border-white dark:border-gray-800 ring-2 ${
                signer.status === "signed" ? "ring-green-500 bg-green-500" :
                signer.status === "declined" ? "ring-red-500 bg-red-500" :
                "ring-yellow-400 bg-yellow-400"
              } z-10 shrink-0 mt-1`}>
                {signer.status === "signed" && (
                  <svg className="w-3.5 h-3.5 text-white p-[1px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {signer.status === "declined" && (
                  <svg className="w-3.5 h-3.5 text-white p-[1px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              {!isLast && (
                <div className={`w-0.5 flex-1 min-h-[2rem] ${
                  signer.status === "signed" ? "bg-green-300 dark:bg-green-700" : "bg-gray-200 dark:bg-gray-700"
                }`} />
              )}
            </div>

            {/* Signer card */}
            <div className={`flex-1 pb-6 ${isLast ? "pb-0" : ""}`}>
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                    {signer.name}
                    {signer.role && (
                      <span className="ml-2 text-xs font-normal text-gray-400 dark:text-gray-500">({signer.role})</span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{signer.email}</p>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${config.bg}`}>
                  {config.label}
                </span>
              </div>
              {signer.signedAt && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {new Date(signer.signedAt).toLocaleString("hu-HU")}
                  {signer.signatureMethod && ` - ${signer.signatureMethod}`}
                </p>
              )}
              {signer.signerNote && (
                <p className="text-xs italic text-gray-500 dark:text-gray-400 mt-1 bg-gray-50 dark:bg-gray-700/50 rounded px-2 py-1">
                  &ldquo;{signer.signerNote}&rdquo;
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Section Card Component ──────────────────────────────────────── */

function SectionCard({ title, icon, children, className = "", headerAction }: {
  title: string;
  icon: string;
  children: React.ReactNode;
  className?: string;
  headerAction?: React.ReactNode;
}) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
          </svg>
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
        </div>
        {headerAction}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

/* ── Main Page Component ─────────────────────────────────────────── */

export default function ContractDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiAnalysis, setAiAnalysis] = useState<AiAnalysis | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [versions, setVersions] = useState<ContractVersion[]>([]);
  const [showVersions, setShowVersions] = useState(false);
  const [reminderLoading, setReminderLoading] = useState<string | null>(null);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [showTagMenu, setShowTagMenu] = useState(false);
  const [showDiff, setShowDiff] = useState(false);
  const [qrSigner, setQrSigner] = useState<{ name: string; token: string } | null>(null);
  const [archiving, setArchiving] = useState(false);
  const [cloning, setCloning] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [addingSelf, setAddingSelf] = useState(false);
  const { user: currentUser } = useAuth();

  useEffect(() => {
    loadContract();
    loadComments();
    api.get("/tags").then((res) => setAllTags(res.data.data ?? [])).catch(() => {});
  }, [id]);

  const loadContract = async () => {
    try {
      const res = await api.get(`/contracts/${id}`);
      setContract(res.data.data);
    } catch {
      toast.error("Hiba a szerződés betöltésekor");
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    try {
      const res = await api.get(`/contracts/${id}/comments`);
      setComments(res.data.data);
    } catch {
      // silently fail
    }
  };

  const loadVersions = async () => {
    try {
      const res = await api.get(`/contracts/${id}/versions`);
      setVersions(res.data.data);
      setShowVersions(true);
    } catch {
      toast.error("Hiba a verziók betöltésekor");
    }
  };

  const handleReminder = async (signerId: string) => {
    setReminderLoading(signerId);
    try {
      await api.post(`/contracts/${id}/remind/${signerId}`);
      toast.success("Emlékeztető elküldve!");
      loadContract();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message ?? "Hiba az emlékeztető küldésekor");
    } finally {
      setReminderLoading(null);
    }
  };

  const handleToggleTag = async (tagId: string, isActive: boolean) => {
    try {
      if (isActive) {
        await api.delete(`/tags/${tagId}/contracts/${id}`);
      } else {
        await api.post(`/tags/${tagId}/contracts/${id}`);
      }
      loadContract();
    } catch {
      toast.error("Hiba a címke módosításakor");
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    setCommentLoading(true);
    try {
      await api.post(`/contracts/${id}/comments`, { content: newComment });
      setNewComment("");
      await loadComments();
      toast.success("Megjegyzés hozzáadva");
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message ?? "Hiba a megjegyzés mentésekor");
    } finally {
      setCommentLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await api.delete(`/comments/${commentId}`);
      await loadComments();
      toast.success("Megjegyzés törölve");
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message ?? "Hiba a törléskor");
    }
  };

  const handleSend = async () => {
    try {
      await api.post(`/contracts/${id}/send`);
      toast.success("Szerződés elküldve aláírásra!");
      loadContract();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message ?? "Hiba az elküldéskor");
    }
  };

  const handleCancel = async () => {
    if (!confirm("Biztosan visszavonod a szerződést?")) return;
    try {
      await api.post(`/contracts/${id}/cancel`);
      toast.success("Szerződés visszavonva");
      loadContract();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message ?? "Hiba");
    }
  };

  const handleDuplicate = async () => {
    setDuplicating(true);
    try {
      const res = await api.post(`/contracts/${id}/duplicate`);
      toast.success("Szerződés duplikálva!");
      router.push(`/contracts/${res.data.data.id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message ?? "Hiba a duplikáláskor");
    } finally {
      setDuplicating(false);
    }
  };

  const handleDownload = async () => {
    try {
      const res = await api.get(`/contracts/${id}/download`);
      window.open(res.data.data.url, "_blank");
    } catch {
      toast.error("Hiba a letöltéskor");
    }
  };

  const handleAiAnalysis = async () => {
    setAiLoading(true);
    setAiAnalysis(null);
    try {
      const res = await api.post(`/ai/analyze/${id}`);
      if (res.data.success) {
        setAiAnalysis(res.data.data);
      } else {
        toast.error(res.data.error?.message ?? "Hiba az AI elemzés során");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message ?? "Hiba az AI elemzés során");
    } finally {
      setAiLoading(false);
    }
  };

  const handleArchive = async () => {
    setArchiving(true);
    try {
      await api.post(`/contracts/${id}/archive`);
      toast.success("Szerződés archiválva");
      loadContract();
    } catch {
      toast.error("Hiba az archiváláskor");
    } finally {
      setArchiving(false);
    }
  };

  const handleCloneAsTemplate = async () => {
    setCloning(true);
    try {
      const res = await api.post(`/contracts/${id}/clone-as-template`);
      toast.success("Sablon létrehozva!");
      router.push(`/templates/${res.data.data.id}/edit`);
    } catch {
      toast.error("Hiba a sablon létrehozásakor");
    } finally {
      setCloning(false);
    }
  };

  const handleAddSelfAsSigner = async () => {
    setAddingSelf(true);
    try {
      await api.post(`/contracts/${id}/add-self-signer`);
      toast.success("Sikeresen hozzáadva aláíróként!");
      loadContract();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message ?? err.response?.data?.message ?? "Hiba a hozzáadáskor");
    } finally {
      setAddingSelf(false);
    }
  };

  /* ── Loading State ───────────────────────────────────────────────── */

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        <p className="text-sm text-gray-400 dark:text-gray-500">Betöltés...</p>
      </div>
    );
  }

  if (!contract) return null;

  const contractTagIds = new Set((contract.tags ?? []).map((ct) => ct.tag.id));
  const signedCount = contract.signers.filter((s) => s.status === "signed").length;
  const totalSigners = contract.signers.length;

  /* ── Render ──────────────────────────────────────────────────────── */

  return (
    <div className="space-y-6">
      {/* ── Back Button ──────────────────────────────────────────────── */}
      <button
        onClick={() => router.push("/dashboard")}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Vissza a főoldalra
      </button>

      {/* ── Header Card ──────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          {/* Left: Title + Meta */}
          <div className="space-y-3 min-w-0 flex-1">
            <div className="flex items-start gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 break-words">
                {contract.title}
              </h1>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${statusColors[contract.status] ?? statusColors.draft}`}>
                <span className={`w-2 h-2 rounded-full ${statusDotColors[contract.status] ?? "bg-gray-400"}`} />
                {statusLabels[contract.status]}
              </span>
            </div>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-500 dark:text-gray-400">
              {contract.template && (
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z" />
                  </svg>
                  {contract.template.name}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Létrehozva: {new Date(contract.createdAt).toLocaleDateString("hu-HU")}
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Módosítva: {new Date(contract.updatedAt).toLocaleDateString("hu-HU")}
              </span>
              {contract.expiresAt && (
                <span className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  Lejárat: {new Date(contract.expiresAt).toLocaleDateString("hu-HU")}
                </span>
              )}
              {totalSigners > 0 && (
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
                  </svg>
                  {signedCount}/{totalSigners} aláírta
                </span>
              )}
            </div>

            {/* Tags */}
            <div className="flex items-center gap-2 flex-wrap">
              {contract.tags && contract.tags.length > 0 && contract.tags.map((ct) => (
                <span
                  key={ct.tag.id}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: ct.tag.color }}
                >
                  {ct.tag.name}
                </span>
              ))}
              <div className="relative">
                <button
                  onClick={() => setShowTagMenu(!showTagMenu)}
                  className="inline-flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 border border-dashed border-gray-300 dark:border-gray-600 rounded-full px-2.5 py-0.5 transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Címke
                </button>
                {showTagMenu && allTags.length > 0 && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowTagMenu(false)} />
                    <div className="absolute top-8 left-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 py-1 w-44">
                      {allTags.map((tag) => (
                        <button
                          key={tag.id}
                          onClick={() => { handleToggleTag(tag.id, contractTagIds.has(tag.id)); setShowTagMenu(false); }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-700 dark:text-gray-300"
                        >
                          <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: tag.color }} />
                          <span className="truncate">{tag.name}</span>
                          {contractTagIds.has(tag.id) && (
                            <svg className="w-4 h-4 ml-auto text-green-600 dark:text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right: Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Primary action */}
            {contract.status === "draft" && (
              <button
                onClick={handleSend}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Elküldés aláírásra
              </button>
            )}

            {/* AI Analysis */}
            <button
              onClick={handleAiAnalysis}
              disabled={aiLoading}
              className="inline-flex items-center gap-2 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
              style={{ backgroundColor: "#198296" }}
              onMouseEnter={(e) => { if (!aiLoading) (e.target as HTMLButtonElement).style.backgroundColor = "#0e5f6e"; }}
              onMouseLeave={(e) => { if (!aiLoading) (e.target as HTMLButtonElement).style.backgroundColor = "#198296"; }}
            >
              {aiLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Elemzés...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19 14.5" />
                  </svg>
                  AI Elemzés
                </>
              )}
            </button>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-xs">
              Az elemzés során a szerződés szövege az Anthropic (USA) szerverére kerül feldolgozásra. Részletek az{" "}
              <a href="/adatvedelem" target="_blank" className="underline hover:text-gray-700 dark:hover:text-gray-300">Adatvédelmi tájékoztatóban</a>.
            </p>

            {/* PDF Download */}
            {contract.pdfUrl && (
              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-2 border border-gray-300 dark:border-gray-600 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                PDF
              </button>
            )}

            {/* More actions dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowActions(!showActions)}
                className="inline-flex items-center gap-1.5 border border-gray-300 dark:border-gray-600 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
                </svg>
                Egyéb
              </button>
              {showActions && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowActions(false)} />
                  <div className="absolute right-0 top-11 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 py-1 w-52">
                    <button
                      onClick={() => { setShowPreview(!showPreview); setShowActions(false); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {showPreview ? "Előnézet elrejtése" : "Tartalom megtekintése"}
                    </button>
                    <button
                      onClick={() => { loadVersions(); setShowActions(false); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Verziók
                    </button>
                    <button
                      onClick={() => { handleDuplicate(); setShowActions(false); }}
                      disabled={duplicating}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 disabled:opacity-50"
                    >
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      {duplicating ? "Duplikálás..." : "Duplikálás"}
                    </button>
                    <button
                      onClick={() => { handleCloneAsTemplate(); setShowActions(false); }}
                      disabled={cloning}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 disabled:opacity-50"
                    >
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                      {cloning ? "Mentés..." : "Sablonként mentés"}
                    </button>
                    {!["completed", "cancelled", "archived"].includes(contract.status) && (
                      <button
                        onClick={() => { handleArchive(); setShowActions(false); }}
                        disabled={archiving}
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 disabled:opacity-50"
                      >
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                        </svg>
                        {archiving ? "Archiválás..." : "Archiválás"}
                      </button>
                    )}
                    {!["completed", "cancelled"].includes(contract.status) && (
                      <>
                        <div className="border-t border-gray-100 dark:border-gray-700 my-1" />
                        <button
                          onClick={() => { handleCancel(); setShowActions(false); }}
                          className="w-full text-left px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                          </svg>
                          Visszavonás
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Content Preview (collapsible) ────────────────────────────── */}
      {showPreview && (
        <SectionCard
          title="Szerződés tartalma"
          icon="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
          headerAction={
            <button onClick={() => setShowPreview(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          }
        >
          <div
            className="prose prose-sm dark:prose-invert max-w-none border border-gray-100 dark:border-gray-700 rounded-lg p-6 bg-gray-50 dark:bg-gray-900/50"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(contract.contentHtml) }}
          />
        </SectionCard>
      )}

      {/* ── Version History (collapsible) ────────────────────────────── */}
      {showVersions && (
        <SectionCard
          title="Verzió előzmények"
          icon="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
          headerAction={
            <div className="flex items-center gap-3">
              {versions.length >= 2 && (
                <button
                  onClick={() => setShowDiff(!showDiff)}
                  className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {showDiff ? "Lista nézet" : "Összehasonlítás"}
                </button>
              )}
              <button onClick={() => setShowVersions(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          }
        >
          {versions.length === 0 ? (
            <p className="text-gray-400 dark:text-gray-500 text-sm">Nincs korábbi verzió</p>
          ) : showDiff ? (
            <VersionDiff versions={versions} />
          ) : (
            <div className="space-y-2">
              {versions.map((v) => (
                <div key={v.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700">
                  <div>
                    <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">v{v.version}</span>
                    {v.changeNote && <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">- {v.changeNote}</span>}
                  </div>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {new Date(v.createdAt).toLocaleString("hu-HU")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      )}

      {/* ── Main Grid: Signers + Sidebar ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Signers + Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Signers Timeline */}
          <SectionCard
            title="Aláírók állapota"
            icon="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0"
            headerAction={
              totalSigners > 0 ? (
                <div className="flex items-center gap-2">
                  <div className="w-24 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all duration-500"
                      style={{ width: `${totalSigners > 0 ? (signedCount / totalSigners) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    {signedCount}/{totalSigners}
                  </span>
                </div>
              ) : undefined
            }
          >
            {contract.signers.length === 0 ? (
              <p className="text-gray-400 dark:text-gray-500 text-sm">Nincs aláíró hozzáadva</p>
            ) : (
              <div className="space-y-0">
                <SigningTimeline signers={contract.signers} />

                {/* Owner sign button — if they're a pending signer */}
                {["sent", "partially_signed"].includes(contract.status) && (() => {
                  const ownerSigner = contract.signers.find(
                    (s) => s.email === currentUser?.email && s.status === "pending"
                  );
                  if (!ownerSigner) return null;
                  // Check if it's their turn (no earlier pending signers)
                  const earlierPending = contract.signers.some(
                    (s) => s.signingOrder < ownerSigner.signingOrder && s.status === "pending"
                  );
                  if (earlierPending) return null;
                  return (
                    <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-800 rounded-lg flex items-center justify-center shrink-0">
                            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">Az Ön aláírása szükséges</p>
                            <p className="text-xs text-blue-600 dark:text-blue-400">Ön is aláíró ezen a szerződésen. Kattintson az aláíráshoz.</p>
                          </div>
                          <a
                            href={`/sign/${(ownerSigner as any).signToken}`}
                            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition shrink-0"
                          >
                            Aláírás most
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Add self as signer button — if owner is NOT yet a signer */}
                {["draft", "sent", "partially_signed"].includes(contract.status) &&
                  currentUser?.email &&
                  !contract.signers.some((s) => s.email.toLowerCase() === currentUser.email.toLowerCase()) && (
                  <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 dark:bg-amber-800 rounded-lg flex items-center justify-center shrink-0">
                          <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">Ön nem aláíró</p>
                          <p className="text-xs text-amber-600 dark:text-amber-400">Adja hozzá magát aláíróként, ha Ön is szeretné aláírni a szerződést.</p>
                        </div>
                        <button
                          onClick={handleAddSelfAsSigner}
                          disabled={addingSelf}
                          className="px-5 py-2.5 bg-amber-600 text-white rounded-lg text-sm font-semibold hover:bg-amber-700 transition shrink-0 disabled:opacity-50"
                        >
                          {addingSelf ? "Hozzáadás..." : "Magam hozzáadása"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Signer action buttons */}
                {["sent", "partially_signed"].includes(contract.status) && contract.signers.some((s) => s.status === "pending") && (
                  <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Műveletek</p>
                    <div className="flex flex-wrap gap-2">
                      {contract.signers
                        .filter((s) => s.status === "pending")
                        .map((signer) => (
                          <div key={signer.id} className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleReminder(signer.id)}
                              disabled={reminderLoading === signer.id}
                              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-yellow-300 dark:border-yellow-700 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition disabled:opacity-50"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                              </svg>
                              {reminderLoading === signer.id ? "Küldés..." : `Emlékeztető: ${signer.name}`}
                            </button>
                            <button
                              onClick={() => setQrSigner({ name: signer.name, token: (signer as any).signToken })}
                              className="inline-flex items-center p-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                              title="QR kód"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7zm14 3h.01M17 14h.01M14 17h.01M14 14h3v3h-3v-3zm3 3h3v3h-3v-3z" />
                              </svg>
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </SectionCard>
        </div>

        {/* Right column: Audit Log */}
        <div>
          <SectionCard
            title="Napló"
            icon="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"
          >
            {contract.auditLogs.length === 0 ? (
              <p className="text-gray-400 dark:text-gray-500 text-sm">Nincs bejegyzés</p>
            ) : (
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gray-200 dark:bg-gray-700" />

                <div className="space-y-4">
                  {contract.auditLogs.map((log) => {
                    const iconPath = eventIcons[log.eventType] ?? "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z";
                    return (
                      <div key={log.id} className="relative flex gap-3 pl-0">
                        {/* Dot */}
                        <div className="relative z-10 w-[15px] h-[15px] mt-0.5 shrink-0">
                          <div className={`w-[15px] h-[15px] rounded-full border-2 border-white dark:border-gray-800 ${
                            log.eventType === "signed" ? "bg-green-500" :
                            log.eventType === "declined" ? "bg-red-500" :
                            log.eventType === "email_sent" || log.eventType === "reminder_sent" ? "bg-blue-500" :
                            "bg-gray-400 dark:bg-gray-500"
                          }`} />
                        </div>
                        {/* Content */}
                        <div className="min-w-0 pb-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {eventLabels[log.eventType] ?? log.eventType}
                          </p>
                          {log.signer && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">{log.signer.name}</p>
                          )}
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            {new Date(log.createdAt).toLocaleString("hu-HU")}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </SectionCard>
        </div>
      </div>

      {/* ── Comments Section ─────────────────────────────────────────── */}
      <SectionCard
        title="Megjegyzések"
        icon="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
        headerAction={
          <span className="text-xs text-gray-400 dark:text-gray-500">{comments.length} megjegyzés</span>
        }
      >
        {/* New comment input */}
        <div className="mb-6">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Írj megjegyzést..."
            rows={3}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-colors"
          />
          <div className="flex justify-end mt-2">
            <button
              onClick={handleAddComment}
              disabled={commentLoading || !newComment.trim()}
              className="inline-flex items-center gap-2 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              style={{ backgroundColor: "#198296" }}
              onMouseEnter={(e) => (e.target as HTMLButtonElement).style.backgroundColor = "#0e5f6e"}
              onMouseLeave={(e) => (e.target as HTMLButtonElement).style.backgroundColor = "#198296"}
            >
              {commentLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Mentés...
                </>
              ) : "Hozzáadás"}
            </button>
          </div>
        </div>

        {/* Comments list */}
        <div className="space-y-3">
          {comments.length === 0 && (
            <div className="text-center py-6">
              <svg className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
              </svg>
              <p className="text-gray-400 dark:text-gray-500 text-sm">Nincs megjegyzés</p>
            </div>
          )}
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 relative group"
            >
              <div className="flex justify-between items-start gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                    {comment.user.name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">{comment.user.name}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {new Date(comment.createdAt).toLocaleString("hu-HU")}
                    </p>
                  </div>
                </div>
                {currentUser?.id === comment.user.id && (
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className="text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                    title="Törlés"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                )}
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-3 whitespace-pre-wrap leading-relaxed">
                {comment.content}
              </p>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ── AI Analysis Results ──────────────────────────────────────── */}
      {aiLoading && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-10 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#198296]/10 dark:bg-[#198296]/20 flex items-center justify-center">
              <svg className="animate-spin h-7 w-7 text-[#198296]" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
            <div>
              <p className="text-gray-900 dark:text-gray-100 font-medium">AI elemzés folyamatban...</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">A Claude AI elemzi a szerződés tartalmát</p>
            </div>
          </div>
        </div>
      )}

      {aiAnalysis && !aiLoading && (
        <div className="space-y-4">
          {/* AI Disclaimer */}
          <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 rounded-lg px-4 py-3">
            <p className="text-xs text-amber-800 dark:text-amber-300">
              {"\u26A0\uFE0F"} Az AI elemzés tájékoztató jellegű, és nem minősül jogi véleménynek vagy tanácsadásnak. A szerződés jogi értékeléshez kérjük, forduljon ügyvédhez.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#198296]/10 dark:bg-[#198296]/20 flex items-center justify-center">
              <svg className="h-5 w-5 text-[#198296]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19 14.5" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">AI Elemzés</h2>
          </div>

          {/* Summary */}
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-5 border border-amber-200 dark:border-amber-800">
            <h3 className="font-semibold text-amber-800 dark:text-amber-300 mb-2 text-sm uppercase tracking-wider">Összefoglaló</h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm">{aiAnalysis.summary}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {aiAnalysis.risks.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                <h3 className="font-semibold text-red-700 dark:text-red-400 mb-3 flex items-center gap-2 text-sm">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
                  </svg>
                  Kockázatok
                </h3>
                <ul className="space-y-2">
                  {aiAnalysis.risks.map((risk, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="mt-1.5 h-2 w-2 rounded-full bg-red-500 shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{risk}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {aiAnalysis.suggestions.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                <h3 className="font-semibold text-blue-700 dark:text-blue-400 mb-3 flex items-center gap-2 text-sm">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                  </svg>
                  Javaslatok
                </h3>
                <ul className="space-y-2">
                  {aiAnalysis.suggestions.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="mt-1.5 h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {aiAnalysis.missingClauses.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                <h3 className="font-semibold text-orange-700 dark:text-orange-400 mb-3 flex items-center gap-2 text-sm">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  Hiányzó záradékok
                </h3>
                <ul className="space-y-2">
                  {aiAnalysis.missingClauses.map((c, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="mt-1.5 h-2 w-2 rounded-full bg-orange-500 shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <h3 className="font-semibold text-[#198296] dark:text-[#41A5B9] mb-3 flex items-center gap-2 text-sm">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
                Jogi megfelelőség (Ptk.)
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{aiAnalysis.legalCompliance}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── AI Risk Analysis Component ───────────────────────────────── */}
      <div>
        <RiskAnalysis contractId={contract.id} />
      </div>

      {/* ── QR Signing Modal ─────────────────────────────────────────── */}
      {qrSigner && (
        <QrSigningModal
          open={!!qrSigner}
          onClose={() => setQrSigner(null)}
          signerName={qrSigner.name}
          signToken={qrSigner.token}
        />
      )}
    </div>
  );
}
