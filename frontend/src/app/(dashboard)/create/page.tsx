"use client";

import { useEffect, useState, Suspense, lazy } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api";
import toast from "react-hot-toast";
import WysiwygEditor from "@/components/wysiwyg-editor";

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

  const [step, setStep] = useState(1);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [signers, setSigners] = useState<Signer[]>([
    { name: "", email: "", role: "", signingOrder: 1 },
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

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        Új szerződés létrehozása
      </h1>

      {/* Step indicator */}
      <div className="flex gap-2 mb-8">
        {["Sablon", "Kitöltés", "Aláírók", "Összegzés"].map((label, i) => (
          <div key={i} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step > i + 1
                  ? "bg-green-100 text-green-700"
                  : step === i + 1
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-400"
              }`}
            >
              {step > i + 1 ? "\u2713" : i + 1}
            </div>
            <span
              className={`text-sm hidden sm:inline ${
                step === i + 1 ? "text-gray-900 font-medium" : "text-gray-400"
              }`}
            >
              {label}
            </span>
            {i < 3 && (
              <div className="w-8 h-px bg-gray-200 hidden sm:block" />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Template selection */}
      {step === 1 && (
        <>
          <div className="flex gap-3 mb-6">
            <button
              onClick={() => setUploadMode(false)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${!uploadMode ? "bg-blue-100 text-blue-700" : "text-gray-500 hover:bg-gray-100"}`}
            >
              Sablon választás
            </button>
            <button
              onClick={() => setUploadMode(true)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${uploadMode && !uploadedHtml ? "bg-blue-100 text-blue-700" : "text-gray-500 hover:bg-gray-100"}`}
            >
              Saját fájl feltöltés
            </button>
            <button
              onClick={() => { setUploadMode(true); if (!uploadedHtml) setUploadedHtml("<p></p>"); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${uploadMode && uploadedHtml ? "bg-blue-100 text-blue-700" : "text-gray-500 hover:bg-gray-100"}`}
            >
              Szerkesztő
            </button>
          </div>

          {uploadMode ? (
            <div className="max-w-2xl">
              <div
                className={`border-2 border-dashed rounded-2xl p-12 text-center transition ${
                  dragOver ? "border-blue-400 bg-blue-50" : "border-gray-200 hover:border-gray-300"
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
                <p className="text-gray-600 font-medium mb-1">Húzd ide a fájlt, vagy kattints a feltöltéshez</p>
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
                    className="w-full px-4 py-2.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
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
                className="bg-white rounded-xl border p-5 text-left hover:border-blue-300 hover:shadow-sm transition"
              >
                <h3 className="font-semibold text-gray-900 mb-1">{t.name}</h3>
                <p className="text-xs text-gray-400 mb-3">
                  {t.variables.length} kitöltendő mező
                </p>
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
                      dangerouslySetInnerHTML={{ __html: previewHtml ?? "" }}
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
        <div className="bg-white rounded-xl border p-6 max-w-2xl">
          <h2 className="text-lg font-semibold mb-1">
            {selectedTemplate.name}
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Töltsd ki a szerződés adatait
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Szerződés neve *
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            {selectedTemplate.variables.map((v) => (
              <div key={v.name}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                    className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-y"
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
                    className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setStep(1)}
              className="px-5 py-2.5 border rounded-lg text-gray-600 hover:bg-gray-50"
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
        <div className="bg-white rounded-xl border p-6 max-w-2xl">
          <h2 className="text-lg font-semibold mb-1">Aláírók</h2>
          <p className="text-sm text-gray-500 mb-6">
            Add meg az aláírókat és szerepüket
          </p>

          <div className="space-y-4">
            {signers.map((signer, i) => (
              <div key={i} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-medium text-gray-700">
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
                    className="px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    placeholder="Email *"
                    type="email"
                    value={signer.email}
                    onChange={(e) => updateSigner(i, "email", e.target.value)}
                    className="px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    placeholder="Szerepkör (pl. Megbízó)"
                    value={signer.role}
                    onChange={(e) => updateSigner(i, "role", e.target.value)}
                    className="px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    placeholder="Sorrend"
                    value={signer.signingOrder}
                    onChange={(e) =>
                      updateSigner(i, "signingOrder", parseInt(e.target.value) || 1)
                    }
                    min={1}
                    className="px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Aláírási határidő (opcionális)
            </label>
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="px-4 py-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setStep(2)}
              className="px-5 py-2.5 border rounded-lg text-gray-600 hover:bg-gray-50"
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
      {step === 4 && selectedTemplate && (
        <div className="bg-white rounded-xl border p-6 max-w-2xl">
          <h2 className="text-lg font-semibold mb-4">Összegzés</h2>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Szerződés neve</p>
              <p className="font-medium">{title}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Sablon</p>
              <p className="font-medium">{selectedTemplate.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-2">Kitöltött adatok</p>
              <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
                {Object.entries(variables)
                  .filter(([, v]) => v)
                  .map(([key, value]) => {
                    const varDef = selectedTemplate.variables.find(
                      (v) => v.name === key
                    );
                    return (
                      <div key={key} className="flex">
                        <span className="text-gray-500 w-48 shrink-0">
                          {varDef?.label ?? key}:
                        </span>
                        <span className="text-gray-900">{value}</span>
                      </div>
                    );
                  })}
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-2">Aláírók</p>
              <div className="space-y-2">
                {signers
                  .filter((s) => s.name)
                  .map((s, i) => (
                    <div key={i} className="bg-gray-50 rounded-lg p-3 text-sm">
                      <span className="font-medium">{s.name}</span>
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
              className="px-5 py-2.5 border rounded-lg text-gray-600 hover:bg-gray-50"
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
