"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import toast from "react-hot-toast";
import FeatureGate from "@/components/feature-gate";

interface Template {
  id: string;
  name: string;
  category: string;
}

interface Recipient {
  name: string;
  email: string;
  role: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const emptyRecipient = (): Recipient => ({ name: "", email: "", role: "Aláíró" });

export default function BulkSendPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [recipients, setRecipients] = useState<Recipient[]>([
    emptyRecipient(),
    emptyRecipient(),
    emptyRecipient(),
  ]);
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvText, setCsvText] = useState("");

  useEffect(() => {
    setTemplatesLoading(true);
    api
      .get("/templates")
      .then((res) => setTemplates(res.data.data ?? []))
      .catch(() => toast.error("Nem sikerült a sablonok betöltése"))
      .finally(() => setTemplatesLoading(false));
  }, []);

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId) ?? null;

  const updateRecipient = useCallback(
    (index: number, field: keyof Recipient, value: string) => {
      setRecipients((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], [field]: value };
        return next;
      });
    },
    []
  );

  const removeRecipient = useCallback((index: number) => {
    setRecipients((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const addRecipient = useCallback(() => {
    setRecipients((prev) => [...prev, emptyRecipient()]);
  }, []);

  const validateRecipients = (): { valid: Recipient[]; errors: string[] } => {
    const errors: string[] = [];
    const valid: Recipient[] = [];

    recipients.forEach((r, i) => {
      const row = i + 1;
      const nameEmpty = !r.name.trim();
      const emailEmpty = !r.email.trim();

      if (nameEmpty && emailEmpty) return; // skip entirely empty rows

      if (nameEmpty) {
        errors.push(`${row}. sor: a név megadása kötelező`);
        return;
      }
      if (emailEmpty) {
        errors.push(`${row}. sor: az email megadása kötelező`);
        return;
      }
      if (!EMAIL_REGEX.test(r.email.trim())) {
        errors.push(`${row}. sor: érvénytelen email cím (${r.email})`);
        return;
      }

      valid.push({
        name: r.name.trim(),
        email: r.email.trim(),
        role: r.role.trim() || "Alairo",
      });
    });

    return { valid, errors };
  };

  const handleSend = async () => {
    if (!selectedTemplate) {
      toast.error("Válassz ki egy sablont!");
      return;
    }

    const { valid, errors } = validateRecipients();

    if (errors.length > 0) {
      errors.forEach((e) => toast.error(e));
      return;
    }

    if (valid.length === 0) {
      toast.error("Adj meg legalább egy címzettet!");
      return;
    }

    setSending(true);
    setProgress({ current: 0, total: valid.length });

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < valid.length; i++) {
      const recipient = valid[i];
      setProgress({ current: i + 1, total: valid.length });

      try {
        const createRes = await api.post("/contracts", {
          templateId: selectedTemplate.id,
          title: `${selectedTemplate.name} - ${recipient.name}`,
          signers: [
            {
              name: recipient.name,
              email: recipient.email,
              role: recipient.role,
            },
          ],
        });

        const contractId = createRes.data.data?.id;
        if (!contractId) throw new Error("Nem sikerült a szerződés létrehozása");

        await api.post(`/contracts/${contractId}/send`);
        successCount++;
      } catch (err: any) {
        failCount++;
        const msg =
          err.response?.data?.error?.message ??
          err.message ??
          "Ismeretlen hiba";
        toast.error(`${recipient.name} (${recipient.email}): ${msg}`);
      }
    }

    setSending(false);

    if (successCount > 0) {
      toast.success(`${successCount} szerződés sikeresen elküldve!`);
    }
    if (failCount > 0 && successCount > 0) {
      toast.error(`${failCount} küldés sikertelen volt.`);
    }
  };

  const parseCsv = () => {
    const lines = csvText
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) {
      toast.error("A CSV mező üres!");
      return;
    }

    const parsed: Recipient[] = [];
    const errors: string[] = [];

    lines.forEach((line, i) => {
      // Support both comma and semicolon separators
      const separator = line.includes(";") ? ";" : ",";
      const parts = line.split(separator).map((p) => p.trim());

      if (parts.length < 2) {
        errors.push(`${i + 1}. sor: legalább név és email szükséges`);
        return;
      }

      const [name, email] = parts;

      if (!name) {
        errors.push(`${i + 1}. sor: üres név`);
        return;
      }
      if (!EMAIL_REGEX.test(email)) {
        errors.push(`${i + 1}. sor: érvénytelen email (${email})`);
        return;
      }

      parsed.push({
        name,
        email,
        role: parts[2]?.trim() || "Alairo",
      });
    });

    if (errors.length > 0) {
      errors.slice(0, 5).forEach((e) => toast.error(e));
      if (errors.length > 5) {
        toast.error(`...és még ${errors.length - 5} hiba`);
      }
      return;
    }

    // Replace empty rows, append to non-empty ones
    setRecipients((prev) => {
      const nonEmpty = prev.filter((r) => r.name.trim() || r.email.trim());
      return [...nonEmpty, ...parsed];
    });

    toast.success(`${parsed.length} címzett importálva!`);
    setCsvText("");
    setShowCsvModal(false);
  };

  const filledCount = recipients.filter(
    (r) => r.name.trim() && r.email.trim()
  ).length;

  return (
    <FeatureGate featureKey="bulk_operations" featureName="Tömeges műveletek">
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Tömeges küldés
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Válassz egy sablont, add meg a címzetteket, és küld el mindenkinek
          egyszerre.
        </p>
      </div>

      {/* Template selector */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Sablon kiválasztása
        </label>
        {templatesLoading ? (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#198296]" />
            Sablonok betöltése...
          </div>
        ) : (
          <select
            value={selectedTemplateId}
            onChange={(e) => setSelectedTemplateId(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#198296] focus:border-transparent transition"
          >
            <option value="">-- Válassz sablont --</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.category})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Recipients */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Címzettek
            </h2>
            {filledCount > 0 && (
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {filledCount} címzett megadva
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowCsvModal(true)}
            className="text-sm font-medium text-[#198296] hover:text-[#146b7c] dark:text-[#2ab0c7] dark:hover:text-[#198296] transition"
          >
            Címzettek importálása
          </button>
        </div>

        {/* Table header */}
        <div className="hidden sm:grid sm:grid-cols-[1fr_1fr_150px_40px] gap-3 mb-2 px-1">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Név
          </span>
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Email
          </span>
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Szerepkör
          </span>
          <span />
        </div>

        {/* Recipient rows */}
        <div className="space-y-2">
          {recipients.map((r, i) => (
            <div
              key={i}
              className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_150px_40px] gap-2 sm:gap-3 items-start sm:items-center p-3 sm:p-1 bg-gray-50 dark:bg-gray-750 sm:bg-transparent dark:sm:bg-transparent rounded-lg sm:rounded-none"
            >
              <div>
                <label className="block sm:hidden text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Név
                </label>
                <input
                  type="text"
                  placeholder="Név"
                  value={r.name}
                  onChange={(e) => updateRecipient(i, "name", e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg text-sm outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition focus:ring-2 focus:ring-[#198296] focus:border-transparent ${
                    r.name.trim() || !r.email.trim()
                      ? "border-gray-300 dark:border-gray-600"
                      : "border-red-400 dark:border-red-500"
                  }`}
                />
              </div>
              <div>
                <label className="block sm:hidden text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="email@pelda.hu"
                  value={r.email}
                  onChange={(e) => updateRecipient(i, "email", e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg text-sm outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition focus:ring-2 focus:ring-[#198296] focus:border-transparent ${
                    !r.email.trim() || EMAIL_REGEX.test(r.email.trim())
                      ? "border-gray-300 dark:border-gray-600"
                      : "border-red-400 dark:border-red-500"
                  }`}
                />
              </div>
              <div>
                <label className="block sm:hidden text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Szerepkör
                </label>
                <input
                  type="text"
                  placeholder="Alairo"
                  value={r.role}
                  onChange={(e) => updateRecipient(i, "role", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition focus:ring-2 focus:ring-[#198296] focus:border-transparent"
                />
              </div>
              <div className="flex justify-end sm:justify-center">
                <button
                  type="button"
                  onClick={() => removeRecipient(i)}
                  disabled={recipients.length <= 1}
                  className="p-1.5 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition disabled:opacity-30 disabled:cursor-not-allowed rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                  title="Sor törlése"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addRecipient}
          className="mt-3 text-sm font-medium text-[#198296] hover:text-[#146b7c] dark:text-[#2ab0c7] dark:hover:text-[#198296] transition flex items-center gap-1"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4v16m8-8H4"
            />
          </svg>
          Sor hozzáadása
        </button>
      </div>

      {/* Send button + progress */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        <button
          type="button"
          onClick={handleSend}
          disabled={sending || !selectedTemplateId || filledCount === 0}
          className="relative px-8 py-3 bg-[#198296] hover:bg-[#146b7c] text-white font-medium rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed text-sm overflow-hidden"
        >
          {sending && (
            <div
              className="absolute inset-0 bg-[#146b7c] transition-all duration-300"
              style={{
                width: `${
                  progress.total > 0
                    ? (progress.current / progress.total) * 100
                    : 0
                }%`,
              }}
            />
          )}
          <span className="relative flex items-center justify-center gap-2">
            {sending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Küldés... ({progress.current} / {progress.total})
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                  />
                </svg>
                Küldés mindenkinek
              </>
            )}
          </span>
        </button>

        {!sending && filledCount > 0 && selectedTemplateId && (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {filledCount} szerződés kerül létrehozásra és elküldésre
          </span>
        )}
      </div>

      {/* CSV Import Modal */}
      {showCsvModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              Címzettek importálása
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Illessze be a CSV tartalmat. Formátum: <code className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-xs">név,email</code> vagy{" "}
              <code className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-xs">név,email,szerepkör</code>
              . Soronként egy címzett. Pontosvessző (;) is használható elválasztóként.
            </p>
            <textarea
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              rows={8}
              placeholder={`Kiss Janos,kiss.janos@pelda.hu\nNagy Eva,nagy.eva@pelda.hu,Tanu`}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono focus:ring-2 focus:ring-[#198296] focus:border-transparent transition resize-none"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => {
                  setShowCsvModal(false);
                  setCsvText("");
                }}
                className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              >
                Mégse
              </button>
              <button
                type="button"
                onClick={parseCsv}
                disabled={!csvText.trim()}
                className="px-5 py-2 text-sm font-medium text-white bg-[#198296] hover:bg-[#146b7c] rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Importálás
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </FeatureGate>
  );
}
