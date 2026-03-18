"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api";
import toast from "react-hot-toast";
import WysiwygEditor from "@/components/wysiwyg-editor";
import { sanitizeHtml } from "@/lib/sanitize";
import { getEsignWarning } from "@/lib/esign-warnings";
import { useI18n } from "@/lib/i18n";

interface TemplateVar {
  name: string;
  label: string;
  type: string;
  required: boolean;
  filledBy?: 'creator' | 'signer';
  signerIndex?: number;
}

interface Template {
  id: string;
  name: string;
  category: string;
  variables: TemplateVar[];
  contentHtml: string;
}

interface Signer {
  name: string;
  email: string;
  role: string;
  signingOrder: number;
}

interface AuthorizedSigner {
  id: string;
  name: string;
  email: string;
  title: string | null;
  companyName: string | null;
  companyTaxNumber: string | null;
  companyAddress: string | null;
  isDefault: boolean;
}

/* ── Inline SVG icon helper ── */
function Ico({ d, className = "" }: { d: string; className?: string }) {
  return (
    <svg className={`w-5 h-5 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

/* ── Step colors – visszafogott, brand-közeli tónusok ── */
const stepThemes = [
  { bg: "from-[#2F6482] to-[#3A7CA5]", light: "bg-slate-50 dark:bg-slate-900/20", text: "text-[#2F6482] dark:text-sky-400", border: "border-slate-200 dark:border-slate-700", ring: "ring-slate-100 dark:ring-slate-900/30", btn: "bg-[#2F6482] hover:bg-[#265570]", accent: "#2F6482" },
  { bg: "from-[#2F8A8A] to-[#3AA0A0]", light: "bg-teal-50 dark:bg-teal-900/20", text: "text-[#2F8A8A] dark:text-teal-400", border: "border-teal-200 dark:border-teal-700", ring: "ring-teal-100 dark:ring-teal-900/30", btn: "bg-[#2F8A8A] hover:bg-[#267070]", accent: "#2F8A8A" },
  { bg: "from-[#3D5260] to-[#4A6575]", light: "bg-gray-50 dark:bg-gray-900/20", text: "text-[#3D5260] dark:text-gray-400", border: "border-gray-200 dark:border-gray-700", ring: "ring-gray-100 dark:ring-gray-900/30", btn: "bg-[#3D5260] hover:bg-[#2E3E4A]", accent: "#3D5260" },
  { bg: "from-[#4A8B6F] to-[#5A9E80]", light: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-[#4A8B6F] dark:text-emerald-400", border: "border-emerald-200 dark:border-emerald-700", ring: "ring-emerald-100 dark:ring-emerald-900/30", btn: "bg-[#4A8B6F] hover:bg-[#3D7A60]", accent: "#4A8B6F" },
];

function CreateWizardInner() {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateIdParam = searchParams.get("templateId");
  const signerNameParam = searchParams.get("signerName");
  const signerEmailParam = searchParams.get("signerEmail");

  const [step, setStep] = useState(1);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [signers, setSigners] = useState<Signer[]>([
    { name: signerNameParam ?? "", email: signerEmailParam ?? "", role: "", signingOrder: 1 },
  ]);
  const [title, setTitle] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [uploadMode, setUploadMode] = useState(false);
  const [uploadedHtml, setUploadedHtml] = useState("");
  const [dragOver, setDragOver] = useState(false);

  // Signing mode
  type SigningMode = "partner_only" | "owner_only" | "both_partner_first" | "both_owner_first";
  const [signingMode, setSigningMode] = useState<SigningMode>("partner_only");
  const [ownerName, setOwnerName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");

  // Authorized signers from admin
  const [authorizedSigners, setAuthorizedSigners] = useState<AuthorizedSigner[]>([]);
  const [selectedAuthSigner, setSelectedAuthSigner] = useState<string>("self");

  useEffect(() => {
    api.get("/auth/profile").then((res) => {
      const u = res.data.data;
      setOwnerName(u.name || "");
      setOwnerEmail(u.email || "");
    }).catch(() => {});

    // Load authorized signers
    api.get("/admin/authorized-signers").then((res) => {
      const list: AuthorizedSigner[] = res.data.data;
      setAuthorizedSigners(list);
      const def = list.find(s => s.isDefault);
      if (def) setSelectedAuthSigner(def.id);
    }).catch(() => {});
  }, []);

  // When authorized signer selection changes, update owner fields
  useEffect(() => {
    if (selectedAuthSigner === "self") {
      api.get("/auth/profile").then((res) => {
        const u = res.data.data;
        setOwnerName(u.name || "");
        setOwnerEmail(u.email || "");
      }).catch(() => {});
    } else {
      const found = authorizedSigners.find(s => s.id === selectedAuthSigner);
      if (found) {
        setOwnerName(found.name);
        setOwnerEmail(found.email);
      }
    }
  }, [selectedAuthSigner, authorizedSigners]);

  useEffect(() => {
    api.get("/templates").then((res) => {
      setTemplates(res.data.data);
      if (templateIdParam) {
        const found = res.data.data.find((tpl: Template) => tpl.id === templateIdParam);
        if (found) {
          setSelectedTemplate(found);
          setTitle(found.name);
          setStep(2);
        }
      }
    });
  }, [templateIdParam]);

  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [pdfFileName, setPdfFileName] = useState("");

  const handleFileUpload = async (file: File) => {
    if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
      setUploadingPdf(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await api.post("/contracts/upload-pdf", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setPdfFileName(file.name);
        setUploadedHtml(`<!-- PDF:${res.data.data.key} --><div style="text-align:center;padding:40px;background:#f8f9fa;border-radius:8px;"><p style="font-size:18px;font-weight:bold;color:#198296;">${t("create.upload.pdfUploaded")}</p><p style="color:#666;">${file.name} (${(file.size / 1024).toFixed(0)} KB)</p></div>`);
        if (!title) setTitle(file.name.replace(/\.pdf$/i, ""));
        toast.success(t("create.upload.pdfSuccess"));
      } catch (err: any) {
        toast.error(err.response?.data?.error?.message ?? t("create.upload.pdfError"));
      } finally {
        setUploadingPdf(false);
      }
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (file.name.endsWith(".txt")) {
        setUploadedHtml(`<pre style="white-space:pre-wrap;font-family:inherit;">${text.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>`);
      } else {
        setUploadedHtml(text);
      }
      if (!title) setTitle(file.name.replace(/\.[^.]+$/, ""));
    };
    reader.readAsText(file, "utf-8");
  };

  const selectTemplate = (tpl: Template) => {
    setSelectedTemplate(tpl);
    setTitle(tpl.name);
    const defaults: Record<string, string> = {};
    tpl.variables.forEach((v) => (defaults[v.name] = ""));
    setVariables(defaults);
    setStep(2);
  };

  const updateSigner = (index: number, field: keyof Signer, value: string | number) => {
    setSigners((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addSigner = () => {
    setSigners((prev) => [
      ...prev,
      { name: "", email: "", role: "", signingOrder: prev.length + 1 },
    ]);
  };

  const removeSigner = (index: number) => {
    if (signers.length <= 1) return;
    setSigners((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!selectedTemplate && !uploadedHtml) return;
    setLoading(true);
    try {
      const partnerSigners = signers.filter((s) => s.name && s.email);
      let allSigners: Signer[] = [];

      if (signingMode === "owner_only") {
        allSigners = [{ name: ownerName, email: ownerEmail, role: t("create.owner.issuerRole"), signingOrder: 1 }];
      } else if (signingMode === "both_partner_first") {
        const maxPartnerOrder = partnerSigners.length > 0 ? Math.max(...partnerSigners.map(s => s.signingOrder)) : 0;
        allSigners = [
          ...partnerSigners,
          { name: ownerName, email: ownerEmail, role: t("create.owner.issuerRole"), signingOrder: maxPartnerOrder + 1 },
        ];
      } else if (signingMode === "both_owner_first") {
        allSigners = [
          { name: ownerName, email: ownerEmail, role: t("create.owner.issuerRole"), signingOrder: 1 },
          ...partnerSigners.map((s) => ({ ...s, signingOrder: s.signingOrder + 1 })),
        ];
      } else {
        allSigners = partnerSigners;
      }

      const payload: any = {
        title,
        signers: allSigners,
        expiresAt: expiresAt || undefined,
      };
      if (selectedTemplate) {
        payload.templateId = selectedTemplate.id;
        payload.variables = variables;
      } else {
        payload.contentHtml = uploadedHtml;
      }
      const res = await api.post("/contracts", payload);
      toast.success(t("create.summary.success"));
      router.push(`/contracts/${res.data.data.id}`);
    } catch (err: any) {
      toast.error(
        err.response?.data?.error?.message ?? t("create.summary.error")
      );
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { label: t("create.steps.template"), desc: t("create.steps.templateDesc"), icon: "M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z" },
    { label: t("create.steps.fill"), desc: t("create.steps.fillDesc"), icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" },
    { label: t("create.steps.signers"), desc: t("create.steps.signersDesc"), icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
    { label: t("create.steps.summary"), desc: t("create.steps.summaryDesc"), icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
  ];

  const theme = stepThemes[(step - 1) % stepThemes.length];

  return (
    <div>
      {/* ── Header with illustration ── */}
      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${theme.bg} p-6 sm:p-8 mb-8`}>
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10">
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <circle cx="160" cy="40" r="80" fill="white" />
            <circle cx="40" cy="160" r="60" fill="white" />
            <rect x="80" y="60" width="100" height="120" rx="8" fill="white" opacity="0.5" />
            <line x1="100" y1="90" x2="160" y2="90" stroke="white" strokeWidth="4" opacity="0.6" />
            <line x1="100" y1="110" x2="150" y2="110" stroke="white" strokeWidth="4" opacity="0.4" />
            <line x1="100" y1="130" x2="140" y2="130" stroke="white" strokeWidth="4" opacity="0.3" />
            <path d="M95 150 l5 5 10-10" stroke="white" strokeWidth="3" fill="none" opacity="0.7" />
          </svg>
        </div>
        <div className="relative z-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            {t("create.title")}
          </h1>
          <p className="text-white/70 text-sm sm:text-base">
            {steps[step - 1].desc}
          </p>
        </div>
      </div>

      {/* ── Step indicator ── */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 mb-8 shadow-sm">
        <div className="flex items-center">
          {steps.map((s, i) => {
            const isDone = step > i + 1;
            const isCurrent = step === i + 1;
            const isFuture = step < i + 1;
            const st = stepThemes[i];
            return (
              <div key={i} className="flex items-center flex-1 last:flex-none">
                <button
                  onClick={() => { if (isDone) setStep(i + 1); }}
                  className={`flex items-center gap-3 group ${isDone ? "cursor-pointer" : "cursor-default"}`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 ${
                      isDone
                        ? `bg-gradient-to-br ${st.bg} text-white shadow-sm`
                        : isCurrent
                          ? `bg-gradient-to-br ${st.bg} text-white shadow-lg ring-4 ${st.ring}`
                          : "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500"
                    }`}
                  >
                    {isDone ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <Ico d={s.icon} />
                    )}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${
                      isCurrent ? st.text : isFuture ? "text-gray-400 dark:text-gray-500" : "text-gray-500 dark:text-gray-400"
                    }`}>
                      {t("create.stepLabel", { num: i + 1 })}
                    </p>
                    <p className={`text-sm font-semibold ${
                      isDone
                        ? `${st.text} group-hover:opacity-80`
                        : isCurrent
                          ? "text-gray-900 dark:text-gray-100"
                          : "text-gray-400 dark:text-gray-500"
                    }`}>
                      {s.label}
                    </p>
                  </div>
                </button>
                {i < 3 && (
                  <div className="flex-1 mx-3 hidden sm:block">
                    <div className="h-1 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${isDone ? stepThemes[i].bg : ""}`}
                        style={{ width: isDone ? "100%" : "0%" }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <p className="sm:hidden text-center text-xs text-gray-500 dark:text-gray-400 mt-3 font-medium">
          {t("create.stepProgress", { current: step, total: steps.length, label: steps[step - 1].label })}
        </p>
      </div>

      {/* ══════════ Step 1: Template selection ══════════ */}
      {step === 1 && (
        <>
          <div className="flex gap-2 mb-6">
            {[
              { active: !uploadMode, label: t("create.tabs.selectTemplate"), icon: "M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5z", onClick: () => setUploadMode(false) },
              { active: uploadMode && !uploadedHtml, label: t("create.tabs.uploadFile"), icon: "M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12", onClick: () => setUploadMode(true) },
              { active: uploadMode && !!uploadedHtml, label: t("create.tabs.editor"), icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z", onClick: () => { setUploadMode(true); if (!uploadedHtml) setUploadedHtml("<p></p>"); } },
            ].map((tab, idx) => (
              <button
                key={idx}
                onClick={tab.onClick}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  tab.active
                    ? "bg-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-blue-900/30"
                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600"
                }`}
              >
                <Ico d={tab.icon} className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {uploadMode ? (
            <div className="max-w-2xl">
              <div
                className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all ${
                  dragOver
                    ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20 scale-[1.01]"
                    : "border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500"
                }`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const file = e.dataTransfer.files[0];
                  if (file) handleFileUpload(file);
                }}
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200 dark:shadow-blue-900/30">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                {uploadingPdf && (
                  <div className="mb-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
                    <p className="text-sm text-blue-600 mt-2">{t("create.upload.pdfUploading")}</p>
                  </div>
                )}
                <p className="text-gray-700 dark:text-gray-200 font-semibold mb-1">{t("create.upload.dragOrClick")}</p>
                <p className="text-sm text-gray-400 mb-5">{t("create.upload.fileTypes")}</p>
                <label className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-medium text-sm hover:shadow-lg hover:shadow-blue-200 dark:hover:shadow-blue-900/30 transition-all cursor-pointer">
                  <Ico d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" className="w-4 h-4" />
                  {t("create.upload.chooseFile")}
                  <input
                    type="file"
                    accept=".pdf,.html,.htm,.txt"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                  />
                </label>
              </div>
              {uploadedHtml && (
                <div className="mt-5 space-y-4">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t("create.upload.contractTitle")}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                  />
                  <WysiwygEditor value={uploadedHtml} onChange={setUploadedHtml} placeholder={t("create.upload.editorPlaceholder")} />
                  <button
                    onClick={() => { if (title.trim()) setStep(3); }}
                    disabled={!title.trim()}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {t("create.upload.nextToSigners")}
                  </button>
                </div>
              )}
            </div>
          ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Blank contract card */}
            <div
              className="group bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 overflow-hidden hover:shadow-lg hover:border-blue-400 dark:hover:border-blue-500 hover:-translate-y-0.5 transition-all cursor-pointer"
              onClick={() => {
                setUploadMode(true);
                if (!uploadedHtml) setUploadedHtml("<p></p>");
              }}
            >
              <div className="p-5 flex flex-col items-center justify-center text-center min-h-[140px]">
                <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-3 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition">
                  <svg className="w-6 h-6 text-gray-400 group-hover:text-blue-500 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-[.95rem]">{t("create.blankContract")}</h3>
                <p className="text-xs text-gray-400 mt-1">{t("create.blankContractDesc")}</p>
              </div>
            </div>

            {templates.map((tpl, idx) => (
              <div
                key={tpl.id}
                className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg hover:shadow-blue-100 dark:hover:shadow-blue-900/10 hover:-translate-y-0.5 transition-all"
              >
                <div className={`h-1.5 bg-gradient-to-r ${stepThemes[idx % 4].bg}`} />
                <div className="p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stepThemes[idx % 4].bg} flex items-center justify-center shrink-0`}>
                      <Ico d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" className="text-white w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-[.95rem]">{tpl.name}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {t("create.fieldsCount", { count: tpl.variables.length })}
                      </p>
                    </div>
                  </div>
                  {(() => {
                    const esignWarning = getEsignWarning(tpl.category, tpl.name);
                    return esignWarning ? (
                      <div className="mb-3 flex items-start gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
                        <Ico d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                        <span>{esignWarning}</span>
                      </div>
                    ) : null;
                  })()}
                  <div className="flex gap-2">
                    <button
                      onClick={() => selectTemplate(tpl)}
                      className={`flex-1 py-2 rounded-xl text-sm font-semibold text-white transition-all bg-gradient-to-r ${stepThemes[idx % 4].bg} hover:shadow-md`}
                    >
                      {t("create.selectBtn")}
                    </button>
                    <button
                      onClick={async () => {
                        setPreviewLoading(true);
                        try {
                          const res = await api.get(`/templates/${tpl.id}/preview`);
                          setPreviewHtml(res.data.data.contentHtml);
                        } catch { toast.error(t("create.previewError")); }
                        finally { setPreviewLoading(false); }
                      }}
                      className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                      title={t("templates.preview")}
                    >
                      <Ico d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          )}

          {/* Sablon disclaimer */}
          {!uploadMode && templates.length > 0 && (
            <div className="mt-6 flex items-start gap-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3">
              <svg className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {t("create.disclaimer")}
              </p>
            </div>
          )}

          {/* Preview Modal */}
          {(previewHtml || previewLoading) && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-3xl w-full max-h-[80vh] overflow-y-auto shadow-2xl">
                <div className="sticky top-0 bg-white dark:bg-gray-800 border-b dark:border-gray-700 p-4 flex justify-between items-center rounded-t-2xl">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t("create.previewTitle")}</h2>
                  <button onClick={() => setPreviewHtml(null)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                    <Ico d="M6 18L18 6M6 6l12 12" className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                {previewLoading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
                  </div>
                ) : (
                  <div className="p-6">
                    <div className="prose prose-sm max-w-none border rounded-xl p-4 bg-gray-50 dark:bg-gray-700/50"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(previewHtml ?? "") }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* ══════════ Step 2: Fill variables ══════════ */}
      {step === 2 && selectedTemplate && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden max-w-2xl shadow-sm">
          <div className={`h-1.5 bg-gradient-to-r ${theme.bg}`} />
          <div className="p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${theme.bg} flex items-center justify-center`}>
                <Ico d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{selectedTemplate.name}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t("create.fill.fillData")}</p>
              </div>
              {/* Progress indicator */}
              {(() => {
                const creatorVars = selectedTemplate.variables.filter(v => (v.filledBy ?? 'creator') === 'creator');
                const total = creatorVars.filter((v) => v.required).length;
                const filled = creatorVars.filter((v) => v.required && (variables[v.name] ?? "").trim() !== "").length;
                const pct = total > 0 ? Math.round((filled / total) * 100) : 100;
                return (
                  <div className="hidden sm:flex items-center gap-2.5 shrink-0">
                    <div className="w-20 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${pct === 100 ? "bg-emerald-500" : "bg-[#198296]"}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className={`text-xs font-semibold tabular-nums ${pct === 100 ? "text-emerald-600 dark:text-emerald-400" : "text-gray-500 dark:text-gray-400"}`}>
                      {filled}/{total}
                    </span>
                  </div>
                );
              })()}
            </div>

            {(() => {
              const esignWarning = getEsignWarning(selectedTemplate.category, selectedTemplate.name);
              return esignWarning ? (
                <div className="mb-6 flex items-start gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl px-3 py-2.5 text-sm text-amber-800 dark:text-amber-300">
                  <Ico d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" className="w-5 h-5 shrink-0 mt-0.5 text-amber-500" />
                  <span>{esignWarning}</span>
                </div>
              ) : null;
            })()}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("create.fill.contractName")}</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  data-testid="create-title"
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-violet-500 outline-none shadow-sm"
                />
              </div>

              {/* Group variables by prefix for better UX */}
              {(() => {
                const groupLabels: Record<string, string> = {
                  munkaltato: "Munkáltató adatai",
                  munkavalallo: "Munkavállaló adatai",
                  megbizo: "Megbízó adatai",
                  megbizott: "Megbízott adatai",
                  berleti: "Bérleti adatok",
                  berlo: "Bérlő adatai",
                  beado: "Bérbeadó adatai",
                  elado: "Eladó adatai",
                  vevo: "Vevő adatai",
                  szallito: "Szállító adatai",
                  szolgaltato: "Szolgáltató adatai",
                  ugyfel: "Ügyfél adatai",
                };
                const placeholders: Record<string, string> = {
                  adoszam: "pl. 12345678-1-42",
                  adoszama: "pl. 12345678-1-42",
                  taj: "pl. 123-456-789",
                  lakcim: "pl. 1052 Budapest, Váci utca 1.",
                  lakcime: "pl. 1052 Budapest, Váci utca 1.",
                  cime: "pl. 1052 Budapest, Váci utca 1.",
                  cim: "pl. 1052 Budapest, Váci utca 1.",
                  szekhely: "pl. 1052 Budapest, Váci utca 1.",
                  szekhelye: "pl. 1052 Budapest, Váci utca 1.",
                  neve: "pl. Kovács János / Példa Kft.",
                  nev: "pl. Kovács János",
                  email: "pl. pelda@ceg.hu",
                  telefon: "pl. +36 30 123 4567",
                  ber: "pl. 500 000",
                  alapber: "pl. 500 000",
                  dij: "pl. 100 000",
                  osszeg: "pl. 1 000 000",
                  ar: "pl. 50 000",
                };

                const getPlaceholder = (name: string, label: string): string => {
                  const lower = name.toLowerCase();
                  for (const [key, val] of Object.entries(placeholders)) {
                    if (lower.endsWith(key) || lower.includes(key)) return val;
                  }
                  return "";
                };

                const getGroup = (name: string): string | null => {
                  const lower = name.toLowerCase();
                  for (const prefix of Object.keys(groupLabels)) {
                    if (lower.startsWith(prefix)) return prefix;
                  }
                  return null;
                };

                // Build ordered groups
                const groups: { key: string | null; label: string | null; vars: TemplateVar[] }[] = [];
                let currentGroup: string | null | undefined = undefined;

                for (const v of selectedTemplate.variables) {
                  const g = getGroup(v.name);
                  if (g !== currentGroup || groups.length === 0) {
                    currentGroup = g;
                    groups.push({ key: g, label: g ? groupLabels[g] ?? null : null, vars: [v] });
                  } else {
                    groups[groups.length - 1].vars.push(v);
                  }
                }

                return groups.map((group, gi) => (
                  <div key={gi}>
                    {group.label && (
                      <div className="flex items-center gap-2 mt-4 mb-2 first:mt-0">
                        <div className="h-px flex-1 bg-gray-100 dark:bg-gray-700" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 px-1">
                          {group.label}
                        </span>
                        <div className="h-px flex-1 bg-gray-100 dark:bg-gray-700" />
                      </div>
                    )}
                    {group.vars.map((v) => (
                      <div key={v.name} className="mt-3 first:mt-0">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                          {v.label} {v.required && <span className="text-red-400">*</span>}
                          {(v.filledBy === 'signer') && (
                            <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                              {t("create.fill.signerFills")}
                            </span>
                          )}
                        </label>
                        {v.filledBy === 'signer' ? (
                          <input
                            type="text"
                            disabled
                            value=""
                            placeholder={t("create.fill.signerPlaceholder", { label: v.label })}
                            className="w-full px-4 py-3 border border-dashed border-amber-300 dark:border-amber-600 rounded-xl bg-amber-50/50 dark:bg-amber-900/10 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                          />
                        ) : v.type === "textarea" ? (
                          <textarea
                            value={variables[v.name] ?? ""}
                            onChange={(e) => setVariables((prev) => ({ ...prev, [v.name]: e.target.value }))}
                            rows={3}
                            required={v.required}
                            placeholder={getPlaceholder(v.name, v.label)}
                            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-violet-500 outline-none resize-y shadow-sm placeholder:text-gray-300 dark:placeholder:text-gray-600"
                          />
                        ) : (
                          <input
                            type={v.type === "number" ? "number" : v.type === "date" ? "date" : "text"}
                            value={variables[v.name] ?? ""}
                            onChange={(e) => setVariables((prev) => ({ ...prev, [v.name]: e.target.value }))}
                            required={v.required}
                            placeholder={v.type !== "date" ? getPlaceholder(v.name, v.label) : undefined}
                            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-violet-500 outline-none shadow-sm placeholder:text-gray-300 dark:placeholder:text-gray-600"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                ));
              })()}
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep(1)} className="px-5 py-3 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium">
                {t("common.back")}
              </button>
              <button onClick={() => setStep(3)} data-testid="create-step2-next" className={`px-6 py-3 text-white rounded-xl font-semibold transition-all hover:shadow-lg bg-gradient-to-r ${theme.bg}`}>
                {t("common.next")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ Step 3: Signing Mode & Signers ══════════ */}
      {step === 3 && (
        <div className="space-y-6 max-w-2xl">
          {/* Signing Mode Selector */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
            <div className={`h-1.5 bg-gradient-to-r ${theme.bg}`} />
            <div className="p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${theme.bg} flex items-center justify-center`}>
                  <Ico d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" className="text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t("create.signerMode.title")}</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t("create.signerMode.description")}</p>
                </div>
              </div>

              {/* Main signing mode: 3 options */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {([
                  { value: "owner_only" as const, label: t("create.signerMode.ownerOnly"), desc: t("create.signerMode.ownerOnlyDesc"), icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z", color: "teal" },
                  { value: "partner_only" as const, label: t("create.signerMode.partnerOnly"), desc: t("create.signerMode.partnerOnlyDesc"), icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z", color: "blue" },
                  { value: "both" as const, label: t("create.signerMode.both"), desc: t("create.signerMode.bothDesc"), icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z", color: "violet" },
                ] as const).map((opt) => {
                  const colorMap: Record<string, { active: string; icon: string }> = {
                    teal: { active: "border-teal-500 bg-teal-50 dark:bg-teal-900/20", icon: "bg-teal-100 dark:bg-teal-800 text-teal-600 dark:text-teal-400" },
                    blue: { active: "border-blue-500 bg-blue-50 dark:bg-blue-900/20", icon: "bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-400" },
                    violet: { active: "border-violet-500 bg-violet-50 dark:bg-violet-900/20", icon: "bg-violet-100 dark:bg-violet-800 text-violet-600 dark:text-violet-400" },
                  };
                  const c = colorMap[opt.color];
                  const isBoth = opt.value === "both";
                  const isSelected = isBoth
                    ? signingMode === "both_partner_first" || signingMode === "both_owner_first"
                    : signingMode === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        if (isBoth) {
                          if (signingMode !== "both_partner_first" && signingMode !== "both_owner_first") {
                            setSigningMode("both_partner_first");
                          }
                        } else {
                          setSigningMode(opt.value as SigningMode);
                        }
                      }}
                      className={`text-left p-4 rounded-xl border-2 transition-all ${
                        isSelected ? c.active : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                          isSelected ? c.icon : "bg-gray-100 dark:bg-gray-700 text-gray-400"
                        }`}>
                          <Ico d={opt.icon} />
                        </div>
                        <div>
                          <p className={`text-sm font-semibold ${isSelected ? "text-gray-900 dark:text-gray-100" : "text-gray-700 dark:text-gray-200"}`}>
                            {opt.label}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{opt.desc}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Signing order sub-selector (only when "Mindkét fél" is selected) */}
              {(signingMode === "both_partner_first" || signingMode === "both_owner_first") && (
                <div className="mt-4 p-4 bg-violet-50 dark:bg-violet-900/10 rounded-xl border border-violet-200 dark:border-violet-700">
                  <p className="text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400 mb-3">{t("create.signerMode.orderTitle")}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      { value: "both_partner_first" as SigningMode, label: t("create.signerMode.bothPartnerFirst"), desc: t("create.signerMode.bothPartnerFirstDesc") },
                      { value: "both_owner_first" as SigningMode, label: t("create.signerMode.bothOwnerFirst"), desc: t("create.signerMode.bothOwnerFirstDesc") },
                    ]).map((opt) => {
                      const isSelected = signingMode === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setSigningMode(opt.value)}
                          className={`text-left p-3 rounded-lg border-2 transition-all ${
                            isSelected
                              ? "border-violet-500 bg-white dark:bg-gray-800"
                              : "border-transparent bg-white/60 dark:bg-gray-800/40 hover:bg-white dark:hover:bg-gray-800"
                          }`}
                        >
                          <p className={`text-sm font-semibold ${isSelected ? "text-violet-700 dark:text-violet-300" : "text-gray-600 dark:text-gray-300"}`}>{opt.label}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{opt.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Owner signer info - with authorized signer selection */}
              {signingMode !== "partner_only" && (
                <div className="mt-5 p-5 bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/10 rounded-xl border border-teal-200 dark:border-teal-700">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center">
                      <Ico d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-sm font-semibold text-teal-800 dark:text-teal-300">{t("create.owner.selectSigner")}</p>
                  </div>

                  {/* Authorized signer dropdown */}
                  {authorizedSigners.length > 0 && (
                    <div className="mb-4">
                      <label className="block text-xs font-medium text-teal-700 dark:text-teal-400 mb-1.5 uppercase tracking-wider">{t("create.owner.presetSigner")}</label>
                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={() => setSelectedAuthSigner("self")}
                          className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition text-left ${
                            selectedAuthSigner === "self"
                              ? "border-teal-500 bg-white dark:bg-gray-700"
                              : "border-transparent bg-white/60 dark:bg-gray-700/60 hover:bg-white dark:hover:bg-gray-700"
                          }`}
                        >
                          <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center shrink-0">
                            <Ico d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" className="w-4 h-4 text-gray-500" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{t("create.owner.selfLabel")}</p>
                            <p className="text-xs text-gray-400">{t("create.owner.selfDesc")}</p>
                          </div>
                          {selectedAuthSigner === "self" && (
                            <svg className="w-5 h-5 text-teal-600 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                        {authorizedSigners.map((as) => (
                          <button
                            key={as.id}
                            type="button"
                            onClick={() => setSelectedAuthSigner(as.id)}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition text-left ${
                              selectedAuthSigner === as.id
                                ? "border-teal-500 bg-white dark:bg-gray-700"
                                : "border-transparent bg-white/60 dark:bg-gray-700/60 hover:bg-white dark:hover:bg-gray-700"
                            }`}
                          >
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shrink-0 text-white text-xs font-bold">
                              {(as.name || "").split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{as.name}</p>
                                {as.isDefault && (
                                  <span className="px-1.5 py-0.5 bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded text-[9px] font-bold uppercase">{t("create.owner.defaultBadge")}</span>
                                )}
                              </div>
                              <p className="text-xs text-gray-400 truncate">
                                {as.email}
                                {as.title && <span className="ml-1">| {as.title}</span>}
                                {as.companyName && <span className="ml-1">| {as.companyName}</span>}
                              </p>
                            </div>
                            {selectedAuthSigner === as.id && (
                              <svg className="w-5 h-5 text-teal-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      placeholder={t("create.owner.namePlaceholder")}
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      className="px-3 py-2.5 border border-teal-200 dark:border-teal-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    <input
                      placeholder={t("create.owner.emailPlaceholder")}
                      type="email"
                      value={ownerEmail}
                      onChange={(e) => setOwnerEmail(e.target.value)}
                      className="px-3 py-2.5 border border-teal-200 dark:border-teal-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <p className="text-xs text-teal-600 dark:text-teal-400 mt-2">
                    {signingMode === "both_partner_first"
                      ? t("create.owner.afterPartner")
                      : signingMode === "both_owner_first"
                        ? t("create.owner.beforePartner")
                        : t("create.owner.onlyOwner")}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Partner signers */}
          {signingMode !== "owner_only" && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
              <div className="h-1.5 bg-gradient-to-r from-violet-500 to-purple-600" />
              <div className="p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                    <Ico d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t("create.partner.title")}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t("create.partner.description")}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {signers.map((signer, i) => (
                    <div key={i} className="border border-gray-200 dark:border-gray-600 rounded-xl p-4 hover:border-violet-200 dark:hover:border-violet-700 transition">
                      <div className="flex justify-between items-center mb-3">
                        <span className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                          <span className="w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 flex items-center justify-center text-xs font-bold">{i + 1}</span>
                          {t("create.partner.signerLabel")}
                        </span>
                        {signers.length > 1 && (
                          <button onClick={() => removeSigner(i)} className="text-sm text-red-500 hover:text-red-700 font-medium">
                            {t("create.partner.removeSigner")}
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          placeholder={t("create.partner.namePlaceholder")}
                          value={signer.name}
                          onChange={(e) => updateSigner(i, "name", e.target.value)}
                          className="px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-violet-500"
                        />
                        <input
                          placeholder={t("create.partner.emailPlaceholder")}
                          type="email"
                          value={signer.email}
                          onChange={(e) => updateSigner(i, "email", e.target.value)}
                          className="px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-violet-500"
                        />
                        <input
                          placeholder={t("create.partner.rolePlaceholder")}
                          value={signer.role}
                          onChange={(e) => updateSigner(i, "role", e.target.value)}
                          className="px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-violet-500"
                        />
                        <input
                          type="number"
                          placeholder={t("create.partner.orderPlaceholder")}
                          value={signer.signingOrder}
                          onChange={(e) => updateSigner(i, "signingOrder", parseInt(e.target.value) || 1)}
                          min={1}
                          className="px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-violet-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <button onClick={addSigner} data-testid="create-add-signer" className="mt-4 flex items-center gap-2 text-sm text-violet-600 hover:text-violet-700 font-semibold">
                  <Ico d="M12 4v16m8-8H4" className="w-4 h-4" />
                  {t("create.partner.addSigner")}
                </button>
              </div>
            </div>
          )}

          {/* Expiry + Navigation */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {t("create.expiry.label")}
            </label>
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-teal-500 shadow-sm"
            />

            {/* Signing order visual */}
            {signingMode !== "partner_only" && signingMode !== "owner_only" && (
              <div className="mt-5 p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-700/30 rounded-xl">
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">{t("create.expiry.signingOrder")}</p>
                <div className="flex items-center gap-3">
                  {signingMode === "both_owner_first" ? (
                    <>
                      <div className="flex items-center gap-2 px-4 py-2.5 bg-teal-100 dark:bg-teal-900/30 rounded-xl">
                        <div className="w-7 h-7 rounded-full bg-teal-600 flex items-center justify-center text-white text-xs font-bold">1</div>
                        <span className="text-sm font-semibold text-teal-700 dark:text-teal-300">{t("create.expiry.ownerLabel")}</span>
                      </div>
                      <Ico d="M13 7l5 5m0 0l-5 5m5-5H6" className="w-5 h-5 text-gray-300" />
                      <div className="flex items-center gap-2 px-4 py-2.5 bg-violet-100 dark:bg-violet-900/30 rounded-xl">
                        <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-white text-xs font-bold">2</div>
                        <span className="text-sm font-semibold text-violet-700 dark:text-violet-300">{t("create.expiry.partnerLabel")}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 px-4 py-2.5 bg-violet-100 dark:bg-violet-900/30 rounded-xl">
                        <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-white text-xs font-bold">1</div>
                        <span className="text-sm font-semibold text-violet-700 dark:text-violet-300">{t("create.expiry.partnerLabel")}</span>
                      </div>
                      <Ico d="M13 7l5 5m0 0l-5 5m5-5H6" className="w-5 h-5 text-gray-300" />
                      <div className="flex items-center gap-2 px-4 py-2.5 bg-teal-100 dark:bg-teal-900/30 rounded-xl">
                        <div className="w-7 h-7 rounded-full bg-teal-600 flex items-center justify-center text-white text-xs font-bold">2</div>
                        <span className="text-sm font-semibold text-teal-700 dark:text-teal-300">{t("create.expiry.ownerLabel")}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep(2)} className="px-5 py-3 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium">
                {t("common.back")}
              </button>
              <button onClick={() => setStep(4)} data-testid="create-step3-next" className={`px-6 py-3 text-white rounded-xl font-semibold transition-all hover:shadow-lg bg-gradient-to-r ${theme.bg}`}>
                {t("common.next")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ Step 4: Summary ══════════ */}
      {step === 4 && (selectedTemplate || uploadedHtml) && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden max-w-2xl shadow-sm">
          <div className={`h-1.5 bg-gradient-to-r ${theme.bg}`} />
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${theme.bg} flex items-center justify-center`}>
                <Ico d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t("create.summary.title")}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t("create.summary.description")}</p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <Ico d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" className="text-gray-400 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">{t("create.summary.contractName")}</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{title}</p>
                </div>
              </div>

              {selectedTemplate ? (
                <>
                  <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
                      <Ico d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5z" className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-blue-600 dark:text-blue-400 uppercase tracking-wider font-medium">{t("create.summary.templateLabel")}</p>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">{selectedTemplate.name}</p>
                    </div>
                  </div>
                  {Object.entries(variables).filter(([, v]) => v).length > 0 && (
                    <div className="bg-violet-50 dark:bg-violet-900/10 rounded-xl p-4">
                      <p className="text-xs text-violet-600 dark:text-violet-400 uppercase tracking-wider font-medium mb-2">{t("create.summary.filledData")}</p>
                      <div className="space-y-1.5">
                        {Object.entries(variables).filter(([, v]) => v).map(([key, value]) => {
                          const varDef = selectedTemplate.variables.find((v) => v.name === key);
                          return (
                            <div key={key} className="flex text-sm">
                              <span className="text-gray-500 dark:text-gray-400 w-36 sm:w-48 shrink-0">{varDef?.label ?? key}:</span>
                              <span className="text-gray-900 dark:text-gray-100 font-medium">{value}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <Ico d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" className="text-gray-400 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">{t("create.summary.sourceLabel")}</p>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{t("create.summary.sourceUpload")}</p>
                  </div>
                </div>
              )}

              <div className="bg-teal-50 dark:bg-teal-900/10 rounded-xl p-4">
                <p className="text-xs text-teal-600 dark:text-teal-400 uppercase tracking-wider font-medium mb-3">{t("create.summary.signersLabel")}</p>
                <div className="space-y-2">
                  {(() => {
                    const allSummarySigners = [];
                    if (signingMode === "owner_only") {
                      allSummarySigners.push({ name: ownerName, email: ownerEmail, role: t("create.owner.issuerRole") });
                    } else if (signingMode === "both_owner_first") {
                      allSummarySigners.push({ name: ownerName, email: ownerEmail, role: t("create.owner.issuerRole") });
                      signers.filter(s => s.name).forEach(s => allSummarySigners.push(s));
                    } else if (signingMode === "both_partner_first") {
                      signers.filter(s => s.name).forEach(s => allSummarySigners.push(s));
                      allSummarySigners.push({ name: ownerName, email: ownerEmail, role: t("create.owner.issuerRole") });
                    } else {
                      signers.filter(s => s.name).forEach(s => allSummarySigners.push(s));
                    }
                    return allSummarySigners.map((s, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-white dark:bg-gray-700/50 rounded-lg">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${
                          s.role === t("create.owner.issuerRole") ? "bg-gradient-to-br from-teal-500 to-emerald-600" : "bg-gradient-to-br from-violet-500 to-purple-600"
                        }`}>
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">{s.name}</span>
                          <span className="text-gray-400 text-sm ml-2">({s.email})</span>
                        </div>
                        {s.role && (
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                            s.role === t("create.owner.issuerRole")
                              ? "bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300"
                              : "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300"
                          }`}>
                            {s.role}
                          </span>
                        )}
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button onClick={() => setStep(3)} className="px-5 py-3 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium">
                {t("common.back")}
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                data-testid="create-submit"
                className={`px-8 py-3 text-white rounded-xl font-bold transition-all hover:shadow-xl bg-gradient-to-r ${theme.bg} disabled:opacity-50 flex items-center gap-2`}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    {t("create.summary.creating")}
                  </>
                ) : (
                  <>
                    <Ico d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" className="w-5 h-5" />
                    {t("create.summary.createBtn")}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CreatePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      }
    >
      <CreateWizardInner />
    </Suspense>
  );
}
