"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { useAuth } from "@/lib/auth-store";
import VersionDiff from "@/components/version-diff";
import QrSigningModal from "@/components/qr-signing-modal";
import RiskAnalysis from "@/components/risk-analysis";

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

const statusLabels: Record<string, string> = {
  draft: "Piszkozat",
  sent: "Elküldve",
  partially_signed: "Részben aláírt",
  completed: "Teljesítve",
  declined: "Visszautasítva",
  expired: "Lejárt",
  cancelled: "Visszavonva",
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

interface AiAnalysis {
  summary: string;
  risks: string[];
  suggestions: string[];
  missingClauses: string[];
  legalCompliance: string;
}

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
      toast.success("Szerzodes archivalva");
      loadContract();
    } catch {
      toast.error("Hiba az archivalaskor");
    } finally {
      setArchiving(false);
    }
  };

  const handleCloneAsTemplate = async () => {
    setCloning(true);
    try {
      const res = await api.post(`/contracts/${id}/clone-as-template`);
      toast.success("Sablon letrehozva!");
      router.push(`/templates/${res.data.data.id}/edit`);
    } catch {
      toast.error("Hiba a sablon letrehozasakor");
    } finally {
      setCloning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!contract) return null;

  const signerStatusColor: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    signed: "bg-green-100 text-green-700",
    declined: "bg-red-100 text-red-700",
    expired: "bg-gray-100 text-gray-500",
  };

  const contractTagIds = new Set((contract.tags ?? []).map((ct) => ct.tag.id));

  return (
    <div>
      <button
        onClick={() => router.push("/dashboard")}
        className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block"
      >
        &larr; Vissza a főoldalra
      </button>

      <div className="flex justify-between items-start mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {contract.title}
          </h1>
          <div className="flex gap-3 mt-2 items-center flex-wrap">
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                contract.status === "completed"
                  ? "bg-green-100 text-green-700"
                  : contract.status === "draft"
                    ? "bg-gray-100 text-gray-700"
                    : "bg-yellow-100 text-yellow-700"
              }`}
            >
              {statusLabels[contract.status]}
            </span>
            {contract.template && (
              <span className="text-sm text-gray-400">
                {contract.template.name}
              </span>
            )}
            {/* Tags */}
            {contract.tags && contract.tags.length > 0 && (
              <div className="flex gap-1">
                {contract.tags.map((ct) => (
                  <span
                    key={ct.tag.id}
                    className="inline-block px-2 py-0.5 rounded text-xs font-medium text-white"
                    style={{ backgroundColor: ct.tag.color }}
                  >
                    {ct.tag.name}
                  </span>
                ))}
              </div>
            )}
            {/* Tag menu */}
            <div className="relative">
              <button
                onClick={() => setShowTagMenu(!showTagMenu)}
                className="text-xs text-gray-400 hover:text-gray-600 border border-dashed rounded px-2 py-0.5"
              >
                + Címke
              </button>
              {showTagMenu && allTags.length > 0 && (
                <div className="absolute top-7 left-0 bg-white border rounded-lg shadow-lg z-50 py-1 w-40">
                  {allTags.map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => handleToggleTag(tag.id, contractTagIds.has(tag.id))}
                      className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 flex items-center gap-2"
                    >
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color }} />
                      <span>{tag.name}</span>
                      {contractTagIds.has(tag.id) && (
                        <svg className="w-3 h-3 ml-auto text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleAiAnalysis}
            disabled={aiLoading}
            className="text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
            style={{ backgroundColor: aiLoading ? "#46A0A0" : "#198296" }}
            onMouseEnter={(e) => {
              if (!aiLoading) (e.target as HTMLButtonElement).style.backgroundColor = "#0e5f6e";
            }}
            onMouseLeave={(e) => {
              if (!aiLoading) (e.target as HTMLButtonElement).style.backgroundColor = "#198296";
            }}
          >
            {aiLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Elemzés...
              </span>
            ) : "AI Elemzés"}
          </button>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="border px-5 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {showPreview ? "Előnézet elrejtése" : "Tartalom megtekintése"}
          </button>
          <button
            onClick={loadVersions}
            className="border px-5 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Verziók
          </button>
          {contract.status === "draft" && (
            <button
              onClick={handleSend}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              Elküldés aláírásra
            </button>
          )}
          <button
            onClick={handleDuplicate}
            disabled={duplicating}
            className="text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
            style={{ backgroundColor: duplicating ? "#e0b430" : "#D29B01" }}
            onMouseEnter={(e) => {
              if (!duplicating) (e.target as HTMLButtonElement).style.backgroundColor = "#b38300";
            }}
            onMouseLeave={(e) => {
              if (!duplicating) (e.target as HTMLButtonElement).style.backgroundColor = "#D29B01";
            }}
          >
            {duplicating ? "Duplikálás..." : "Duplikálás"}
          </button>
          {contract.pdfUrl && (
            <button
              onClick={handleDownload}
              className="border px-5 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              PDF letöltés
            </button>
          )}
          <button
            onClick={handleCloneAsTemplate}
            disabled={cloning}
            className="border px-5 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {cloning ? "Mentes..." : "Sablonkent mentes"}
          </button>
          {!["completed", "cancelled", "archived"].includes(contract.status) && (
            <button
              onClick={handleArchive}
              disabled={archiving}
              className="border px-5 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {archiving ? "Archivalas..." : "Archivalas"}
            </button>
          )}
          {!["completed", "cancelled"].includes(contract.status) && (
            <button
              onClick={handleCancel}
              className="border border-red-200 px-5 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50"
            >
              Visszavonás
            </button>
          )}
        </div>
      </div>

      {/* Content Preview */}
      {showPreview && (
        <div className="mb-6 bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold mb-4">Szerződés tartalma</h2>
          <div
            className="prose prose-sm max-w-none border rounded-lg p-6 bg-gray-50"
            dangerouslySetInnerHTML={{ __html: contract.contentHtml }}
          />
        </div>
      )}

      {/* Version History */}
      {showVersions && (
        <div className="mb-6 bg-white rounded-xl border p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Verzió előzmények</h2>
            <button onClick={() => setShowVersions(false)} className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {versions.length === 0 ? (
            <p className="text-gray-400 text-sm">Nincs korábbi verzió</p>
          ) : (
            <>
              {versions.length >= 2 && (
                <button
                  onClick={() => setShowDiff(!showDiff)}
                  className="mb-3 text-sm font-medium text-blue-600 hover:underline"
                >
                  {showDiff ? "Lista nézet" : "Verziók összehasonlítása"}
                </button>
              )}
              {showDiff ? (
                <VersionDiff versions={versions} />
              ) : (
                <div className="space-y-2">
                  {versions.map((v) => (
                    <div key={v.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                      <div>
                        <span className="font-medium text-gray-900 text-sm">v{v.version}</span>
                        {v.changeNote && (
                          <span className="text-sm text-gray-500 ml-2">- {v.changeNote}</span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(v.createdAt).toLocaleString("hu-HU")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Signers */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-lg font-semibold mb-4">Aláírók</h2>
            <div className="space-y-3">
              {contract.signers
                .sort((a, b) => a.signingOrder - b.signingOrder)
                .map((signer) => (
                  <div
                    key={signer.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {signer.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {signer.email}
                        {signer.role && ` - ${signer.role}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {signer.status === "pending" && ["sent", "partially_signed"].includes(contract.status) && (
                        <>
                          <button
                            onClick={() => handleReminder(signer.id)}
                            disabled={reminderLoading === signer.id}
                            className="text-xs px-3 py-1 rounded-lg border border-yellow-300 text-yellow-700 hover:bg-yellow-50 transition disabled:opacity-50"
                          >
                            {reminderLoading === signer.id ? "Küldés..." : "Emlékeztető"}
                          </button>
                          <button
                            onClick={() => setQrSigner({ name: signer.name, token: (signer as any).signToken })}
                            className="text-xs px-2 py-1 rounded-lg border text-gray-500 hover:bg-gray-50 transition"
                            title="QR kod"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7zm14 3h.01M17 14h.01M14 17h.01M14 14h3v3h-3v-3zm3 3h3v3h-3v-3z" />
                            </svg>
                          </button>
                        </>
                      )}
                      <div className="text-right">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                            signerStatusColor[signer.status] ?? "bg-gray-100"
                          }`}
                        >
                          {signer.status === "pending"
                            ? "Várakozik"
                            : signer.status === "signed"
                              ? "Aláírta"
                              : signer.status === "declined"
                                ? "Visszautasította"
                                : signer.status}
                        </span>
                        {signer.signedAt && (
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(signer.signedAt).toLocaleString("hu-HU")}
                          </p>
                        )}
                        {signer.signerNote && (
                          <p className="text-xs italic text-gray-500 dark:text-gray-400 mt-1">
                            &ldquo;{signer.signerNote}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Audit log */}
        <div>
          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-lg font-semibold mb-4">Napló</h2>
            <div className="space-y-3">
              {contract.auditLogs.map((log) => (
                <div key={log.id} className="text-sm">
                  <p className="text-gray-900">
                    {eventLabels[log.eventType] ?? log.eventType}
                  </p>
                  {log.signer && (
                    <p className="text-xs text-gray-400">{log.signer.name}</p>
                  )}
                  <p className="text-xs text-gray-300">
                    {new Date(log.createdAt).toLocaleString("hu-HU")}
                  </p>
                </div>
              ))}
              {contract.auditLogs.length === 0 && (
                <p className="text-gray-400">Nincs bejegyzés</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Megjegyzések */}
      <div className="mt-8 bg-white rounded-2xl border p-6">
        <h2 className="text-lg font-semibold mb-4" style={{ color: "#198296" }}>
          Megjegyzések
        </h2>

        <div className="mb-6">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Írj megjegyzést..."
            rows={3}
            className="w-full border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 resize-none"
            onFocus={(e) => (e.target.style.borderColor = "#198296")}
            onBlur={(e) => (e.target.style.borderColor = "")}
          />
          <div className="flex justify-end mt-2">
            <button
              onClick={handleAddComment}
              disabled={commentLoading || !newComment.trim()}
              className="text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              style={{ backgroundColor: "#198296" }}
              onMouseEnter={(e) =>
                (e.target as HTMLButtonElement).style.backgroundColor = "#0e5f6e"
              }
              onMouseLeave={(e) =>
                (e.target as HTMLButtonElement).style.backgroundColor = "#198296"
              }
            >
              {commentLoading ? "Mentés..." : "Hozzáadás"}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {comments.length === 0 && (
            <p className="text-gray-400 text-sm">Nincs megjegyzés</p>
          )}
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="p-4 rounded-xl bg-gray-50 relative group"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-gray-900 text-sm">
                    {comment.user.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(comment.createdAt).toLocaleString("hu-HU")}
                  </p>
                </div>
                {currentUser?.id === comment.user.id && (
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    title="Törlés"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                )}
              </div>
              <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">
                {comment.content}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* AI Analysis Results */}
      {aiLoading && (
        <div className="mt-8 bg-white rounded-2xl border p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <svg className="animate-spin h-10 w-10" style={{ color: "#198296" }} viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-gray-600 font-medium">AI elemzés folyamatban...</p>
            <p className="text-sm text-gray-400">A Claude AI elemzi a szerződés tartalmát</p>
          </div>
        </div>
      )}

      {aiAnalysis && !aiLoading && (
        <div className="mt-8 space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: "#198296" }}>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 00.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-2.47 2.47a2.25 2.25 0 01-1.59.659H9.06a2.25 2.25 0 01-1.59-.659L5 14.5m14 0V17a2.25 2.25 0 01-2.25 2.25H7.25A2.25 2.25 0 015 17v-2.5" />
            </svg>
            AI Elemzés
          </h2>

          <div className="rounded-2xl p-6 border-l-4" style={{ backgroundColor: "#FDF8E8", borderLeftColor: "#D29B01" }}>
            <h3 className="font-semibold mb-2" style={{ color: "#a67c00" }}>Összefoglaló</h3>
            <p className="text-gray-700 leading-relaxed">{aiAnalysis.summary}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {aiAnalysis.risks.length > 0 && (
              <div className="bg-white rounded-2xl border p-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2 text-red-700">Kockázatok</h3>
                <ul className="space-y-2">
                  {aiAnalysis.risks.map((risk, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="mt-1 h-2 w-2 rounded-full bg-red-500 shrink-0" />
                      <span className="text-gray-700">{risk}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {aiAnalysis.suggestions.length > 0 && (
              <div className="bg-white rounded-2xl border p-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2 text-blue-700">Javaslatok</h3>
                <ul className="space-y-2">
                  {aiAnalysis.suggestions.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="mt-1 h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                      <span className="text-gray-700">{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {aiAnalysis.missingClauses.length > 0 && (
              <div className="bg-white rounded-2xl border p-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2 text-orange-700">Hiányzó záradékok</h3>
                <ul className="space-y-2">
                  {aiAnalysis.missingClauses.map((c, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="mt-1 h-2 w-2 rounded-full bg-orange-500 shrink-0" />
                      <span className="text-gray-700">{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="bg-white rounded-2xl border p-6">
              <h3 className="font-semibold mb-3" style={{ color: "#198296" }}>Jogi megfelelőség (Ptk.)</h3>
              <p className="text-sm text-gray-700 leading-relaxed">{aiAnalysis.legalCompliance}</p>
            </div>
          </div>
        </div>
      )}

      {/* AI Risk Analysis */}
      <div className="mt-8">
        <RiskAnalysis contractId={contract.id} />
      </div>

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
