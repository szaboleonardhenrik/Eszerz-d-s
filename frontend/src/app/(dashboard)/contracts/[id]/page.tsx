"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { useAuth } from "@/lib/auth-store";

interface Signer {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  signedAt: string | null;
  signingOrder: number;
  signatureMethod: string | null;
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
  const { user: currentUser } = useAuth();

  useEffect(() => {
    loadContract();
    loadComments();
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
        toast.error(
          res.data.error?.message ?? "Hiba az AI elemzés során"
        );
      }
    } catch (err: any) {
      toast.error(
        err.response?.data?.error?.message ?? "Hiba az AI elemzés során"
      );
    } finally {
      setAiLoading(false);
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
          <div className="flex gap-3 mt-2 items-center">
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
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleAiAnalysis}
            disabled={aiLoading}
            className="text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
            style={{ backgroundColor: aiLoading ? "#46A0A0" : "#198296" }}
            onMouseEnter={(e) => {
              if (!aiLoading)
                (e.target as HTMLButtonElement).style.backgroundColor =
                  "#0e5f6e";
            }}
            onMouseLeave={(e) => {
              if (!aiLoading)
                (e.target as HTMLButtonElement).style.backgroundColor =
                  "#198296";
            }}
          >
            {aiLoading ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Elemzés folyamatban...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 00.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-2.47 2.47a2.25 2.25 0 01-1.59.659H9.06a2.25 2.25 0 01-1.59-.659L5 14.5m14 0V17a2.25 2.25 0 01-2.25 2.25H7.25A2.25 2.25 0 015 17v-2.5"
                  />
                </svg>
                AI Elemzés
              </span>
            )}
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
              if (!duplicating)
                (e.target as HTMLButtonElement).style.backgroundColor = "#b38300";
            }}
            onMouseLeave={(e) => {
              if (!duplicating)
                (e.target as HTMLButtonElement).style.backgroundColor = "#D29B01";
            }}
          >
            {duplicating ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Duplikálás...
              </span>
            ) : (
              "Duplikálás"
            )}
          </button>
          {contract.pdfUrl && (
            <button
              onClick={handleDownload}
              className="border px-5 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              PDF letöltés
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

        {/* Comment form */}
        <div className="mb-6">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Írj megjegyzést..."
            rows={3}
            className="w-full border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 resize-none"
            style={{ focusRingColor: "#198296" } as any}
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

        {/* Comments list */}
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
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                      />
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
            <svg
              className="animate-spin h-10 w-10"
              style={{ color: "#198296" }}
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            <p className="text-gray-600 font-medium">
              AI elemzés folyamatban...
            </p>
            <p className="text-sm text-gray-400">
              A Claude AI elemzi a szerződés tartalmát
            </p>
          </div>
        </div>
      )}

      {aiAnalysis && !aiLoading && (
        <div className="mt-8 space-y-4">
          <h2
            className="text-xl font-bold flex items-center gap-2"
            style={{ color: "#198296" }}
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 00.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-2.47 2.47a2.25 2.25 0 01-1.59.659H9.06a2.25 2.25 0 01-1.59-.659L5 14.5m14 0V17a2.25 2.25 0 01-2.25 2.25H7.25A2.25 2.25 0 015 17v-2.5"
              />
            </svg>
            AI Elemzés
          </h2>

          {/* Summary */}
          <div
            className="rounded-2xl p-6 border-l-4"
            style={{
              backgroundColor: "#FDF8E8",
              borderLeftColor: "#D29B01",
            }}
          >
            <h3
              className="font-semibold mb-2 flex items-center gap-2"
              style={{ color: "#a67c00" }}
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
                />
              </svg>
              Összefoglaló
            </h3>
            <p className="text-gray-700 leading-relaxed">
              {aiAnalysis.summary}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Risks */}
            {aiAnalysis.risks.length > 0 && (
              <div className="bg-white rounded-2xl border p-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2 text-red-700">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                    />
                  </svg>
                  Kockázatok
                </h3>
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

            {/* Suggestions */}
            {aiAnalysis.suggestions.length > 0 && (
              <div className="bg-white rounded-2xl border p-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2 text-blue-700">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18"
                    />
                  </svg>
                  Javaslatok
                </h3>
                <ul className="space-y-2">
                  {aiAnalysis.suggestions.map((suggestion, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="mt-1 h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                      <span className="text-gray-700">{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Missing Clauses */}
            {aiAnalysis.missingClauses.length > 0 && (
              <div className="bg-white rounded-2xl border p-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2 text-orange-700">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                    />
                  </svg>
                  Hiányzó záradékok
                </h3>
                <ul className="space-y-2">
                  {aiAnalysis.missingClauses.map((clause, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="mt-1 h-2 w-2 rounded-full bg-orange-500 shrink-0" />
                      <span className="text-gray-700">{clause}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Legal Compliance */}
            <div className="bg-white rounded-2xl border p-6">
              <h3
                className="font-semibold mb-3 flex items-center gap-2"
                style={{ color: "#198296" }}
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                  />
                </svg>
                Jogi megfelelőség (Ptk.)
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                {aiAnalysis.legalCompliance}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
