"use client";

import { useEffect, useState, Suspense, lazy } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api";
import toast from "react-hot-toast";
import WysiwygEditor from "@/components/wysiwyg-editor";
import { sanitizeHtml } from "@/lib/sanitize";
import { getEsignWarning } from "@/lib/esign-warnings";

interface TemplateVar {
  name: string;
  label: string;
  type: string;
  required: boolean;
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

function CreateWizardInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateIdParam = searchParams.get("templateId");
  const signerNameParam = searchParams.get("signerName");
  const signerEmailParam = searchParams.get("signerEmail");
  const signerCompanyParam = searchParams.get("signerCompany");

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

  useEffect(() => {
    api.get("/templates").then((res) => {
      setTemplates(res.data.data);
      if (templateIdParam) {
        const t = res.data.data.find(
          (t: Template) => t.id === templateIdParam
        );
        if (t) {
          setSelectedTemplate(t);
          setTitle(t.name);
          setStep(2);
        }
      }
    });
  }, [templateIdParam]);

  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [pdfFileName, setPdfFileName] = useState("");

  const handleFileUpload = async (file: File) => {
    if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
      // Upload PDF to backend
      setUploadingPdf(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await api.post("/contracts/upload-pdf", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setPdfFileName(file.name);
        setUploadedHtml(`<!-- PDF:${res.data.data.key} --><div style="text-align:center;padding:40px;background:#f8f9fa;border-radius:8px;"><p style="font-size:18px;font-weight:bold;color:#198296;">PDF feltöltve</p><p style="color:#666;">${file.name} (${(file.size / 1024).toFixed(0)} KB)</p></div>`);
        if (!title) setTitle(file.name.replace(/\.pdf$/i, ""));
        toast.success("PDF sikeresen feltöltve!");
      } catch (err: any) {
        toast.error(err.response?.data?.error?.message ?? "Hiba a PDF feltöltésekor");
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

  const selectTemplate = (t: Template) => {
    setSelectedTemplate(t);
    setTitle(t.name);
    const defaults: Record<string, string> = {};
    t.variables.forEach((v) => (defaults[v.name] = ""));
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
      const payload: any = {
        title,
        signers: signers.filter((s) => s.name && s.email),
        expiresAt: expiresAt || undefined,
      };
      if (selectedTemplate) {
        payload.templateId = selectedTemplate.id;
        payload.variables = variables;
      } else {
        payload.contentHtml = uploadedHtml;
      }
      const res = await api.post("/contracts", payload);
      toast.success("Szerződés létrehozva!");
      router.push(`/contracts/${res.data.data.id}`);
    } catch (err: any) {
      toast.error(
        err.response?.data?.error?.message ?? "Hiba a szerződés létrehozásakor"
      );
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { label: "Sablon", icon: "M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z" },
    { label: "Kitoltes", icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" },
    { label: "Alairok", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
    { label: "Osszegzes", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
        Uj szerzodes letrehozasa
      </h1>

      {/* Step indicator */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-8">
        <div className="flex items-center">
          {steps.map((s, i) => {
            const isDone = step > i + 1;
            const isCurrent = step === i + 1;
            const isFuture = step < i + 1;
            return (
              <div key={i} className="flex items-center flex-1 last:flex-none">
                <button
                  onClick={() => { if (isDone) setStep(i + 1); }}
                  className={`flex items-center gap-2.5 group ${isDone ? "cursor-pointer" : "cursor-default"}`}
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                      isDone
                        ? "bg-green-500 text-white shadow-sm shadow-green-200 dark:shadow-green-900/30"
                        : isCurrent
                          ? "bg-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-blue-900/40 ring-4 ring-blue-100 dark:ring-blue-900/30"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500"
                    }`}
                  >
                    {isDone ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={s.icon} />
                      </svg>
                    )}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className={`text-xs font-medium uppercase tracking-wider ${
                      isFuture ? "text-gray-400 dark:text-gray-500" : "text-gray-500 dark:text-gray-400"
                    }`}>
                      {i + 1}. lepes
                    </p>
                    <p className={`text-sm font-semibold ${
                      isDone
                        ? "text-green-600 dark:text-green-400 group-hover:text-green-700 dark:group-hover:text-green-300"
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
                    <div className="h-0.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isDone ? "bg-green-400 w-full" : "bg-gray-100 dark:bg-gray-700 w-0"
                        }`}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <p className="sm:hidden text-center text-xs text-gray-500 dark:text-gray-400 mt-3">
          {step}. lepes / {steps.length} — {steps[step - 1].label}
        </p>
      </div>

      {/* Step 1: Template selection */}
      {step === 1 && (
        <>
          <div className="flex gap-3 mb-6">
            <button
              onClick={() => setUploadMode(false)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${!uploadMode ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"}`}
            >
              Sablon választás
            </button>
            <button
              onClick={() => setUploadMode(true)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${uploadMode && !uploadedHtml ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"}`}
            >
              Saját fájl feltöltés
            </button>
            <button
              onClick={() => { setUploadMode(true); if (!uploadedHtml) setUploadedHtml("<p></p>"); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${uploadMode && uploadedHtml ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"}`}
            >
              Szerkesztő
            </button>
          </div>

          {uploadMode ? (
            <div className="max-w-2xl">
              <div
                className={`border-2 border-dashed rounded-2xl p-6 sm:p-12 text-center transition ${
                  dragOver ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20" : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
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
                <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                {uploadingPdf && (
                  <div className="mb-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
                    <p className="text-sm text-blue-600 mt-2">PDF feltöltése...</p>
                  </div>
                )}
                <p className="text-gray-600 dark:text-gray-300 font-medium mb-1">Húzd ide a fájlt, vagy kattints a feltöltéshez</p>
                <p className="text-sm text-gray-400 mb-4">Támogatott formátumok: .pdf, .html, .txt</p>
                <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition cursor-pointer">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Fájl kiválasztása
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
                <div className="mt-4 space-y-4">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Szerződés címe"
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <WysiwygEditor
                    value={uploadedHtml}
                    onChange={setUploadedHtml}
                    placeholder="Szerkessze a szerződés tartalmát..."
                  />
                  <button
                    onClick={() => { if (title.trim()) setStep(3); }}
                    disabled={!title.trim()}
                    className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    Tovább az aláírókhoz
                  </button>
                </div>
              )}
            </div>
          ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((t) => (
              <div
                key={t.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 text-left hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-sm transition"
              >
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{t.name}</h3>
                <p className="text-xs text-gray-400 mb-3">
                  {t.variables.length} kitöltendő mező
                </p>
                {(() => {
                  const esignWarning = getEsignWarning(t.category, t.name);
                  return esignWarning ? (
                    <div className="mb-3 flex items-start gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
                      <svg className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span>{esignWarning}</span>
                    </div>
                  ) : null;
                })()}
                <div className="flex gap-2">
                  <button
                    onClick={() => selectTemplate(t)}
                    className="flex-1 bg-blue-600 text-white py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                  >
                    Kiválasztás
                  </button>
                  <button
                    onClick={async () => {
                      setPreviewLoading(true);
                      try {
                        const res = await api.get(`/templates/${t.id}/preview`);
                        setPreviewHtml(res.data.data.contentHtml);
                      } catch { toast.error("Hiba"); }
                      finally { setPreviewLoading(false); }
                    }}
                    className="px-3 py-1.5 border rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition"
                    title="Előnézet"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
          )}
          {/* Preview Modal */}
          {(previewHtml || previewLoading) && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[80vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center rounded-t-2xl">
                  <h2 className="text-lg font-semibold">Sablon előnézet</h2>
                  <button onClick={() => setPreviewHtml(null)} className="p-1 hover:bg-gray-100 rounded-lg">
                    <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                {previewLoading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
                  </div>
                ) : (
                  <div className="p-6">
                    <div className="prose prose-sm max-w-none border rounded-lg p-4 bg-gray-50"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(previewHtml ?? "") }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Step 2: Fill variables */}
      {step === 2 && selectedTemplate && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 max-w-2xl">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
            {selectedTemplate.name}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Töltsd ki a szerződés adatait
          </p>

          {(() => {
            const esignWarning = getEsignWarning(selectedTemplate.category, selectedTemplate.name);
            return esignWarning ? (
              <div className="mb-6 flex items-start gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg px-3 py-2.5 text-sm text-amber-800 dark:text-amber-300">
                <svg className="w-5 h-5 shrink-0 mt-0.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{esignWarning}</span>
              </div>
            ) : null;
          })()}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Szerződés neve *
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            {selectedTemplate.variables.map((v) => (
              <div key={v.name}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {v.label} {v.required && "*"}
                </label>
                {v.type === "textarea" ? (
                  <textarea
                    value={variables[v.name] ?? ""}
                    onChange={(e) =>
                      setVariables((prev) => ({
                        ...prev,
                        [v.name]: e.target.value,
                      }))
                    }
                    rows={3}
                    required={v.required}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none resize-y"
                  />
                ) : (
                  <input
                    type={v.type === "number" ? "number" : v.type === "date" ? "date" : "text"}
                    value={variables[v.name] ?? ""}
                    onChange={(e) =>
                      setVariables((prev) => ({
                        ...prev,
                        [v.name]: e.target.value,
                      }))
                    }
                    required={v.required}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setStep(1)}
              className="px-5 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Vissza
            </button>
            <button
              onClick={() => setStep(3)}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >
              Tovább
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Signers */}
      {step === 3 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 max-w-2xl">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">Aláírók</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Add meg az aláírókat és szerepüket
          </p>

          <div className="space-y-4">
            {signers.map((signer, i) => (
              <div key={i} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {i + 1}. aláíró
                  </span>
                  {signers.length > 1 && (
                    <button
                      onClick={() => removeSigner(i)}
                      className="text-sm text-red-500 hover:text-red-700"
                    >
                      Törlés
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    placeholder="Név *"
                    value={signer.name}
                    onChange={(e) => updateSigner(i, "name", e.target.value)}
                    className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    placeholder="Email *"
                    type="email"
                    value={signer.email}
                    onChange={(e) => updateSigner(i, "email", e.target.value)}
                    className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    placeholder="Szerepkör (pl. Megbízó)"
                    value={signer.role}
                    onChange={(e) => updateSigner(i, "role", e.target.value)}
                    className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    placeholder="Sorrend"
                    value={signer.signingOrder}
                    onChange={(e) =>
                      updateSigner(i, "signingOrder", parseInt(e.target.value) || 1)
                    }
                    min={1}
                    className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={addSigner}
            className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            + Aláíró hozzáadása
          </button>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Aláírási határidő (opcionális)
            </label>
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setStep(2)}
              className="px-5 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Vissza
            </button>
            <button
              onClick={() => setStep(4)}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >
              Tovább
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Summary */}
      {step === 4 && (selectedTemplate || uploadedHtml) && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 max-w-2xl">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Összegzés</h2>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Szerzodes neve</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">{title}</p>
            </div>
            {selectedTemplate ? (
              <>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Sablon</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{selectedTemplate.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Kitoltott adatok</p>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-sm space-y-1">
                    {Object.entries(variables)
                      .filter(([, v]) => v)
                      .map(([key, value]) => {
                        const varDef = selectedTemplate.variables.find(
                          (v) => v.name === key
                        );
                        return (
                          <div key={key} className="flex">
                            <span className="text-gray-500 dark:text-gray-400 w-32 sm:w-48 shrink-0">
                              {varDef?.label ?? key}:
                            </span>
                            <span className="text-gray-900 dark:text-gray-100">{value}</span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </>
            ) : (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Forras</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">Sajat feltoltes / szerkeszto</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Alairok</p>
              <div className="space-y-2">
                {signers
                  .filter((s) => s.name)
                  .map((s, i) => (
                    <div key={i} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-sm">
                      <span className="font-medium text-gray-900 dark:text-gray-100">{s.name}</span>
                      <span className="text-gray-500 ml-2">({s.email})</span>
                      {s.role && (
                        <span className="text-gray-400 ml-2">- {s.role}</span>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setStep(3)}
              className="px-5 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Vissza
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Létrehozás..." : "Szerződés létrehozása"}
            </button>
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
