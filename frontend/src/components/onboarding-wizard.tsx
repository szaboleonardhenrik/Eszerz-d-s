"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { useI18n } from "@/lib/i18n";

const POPULAR_TEMPLATES = [
  {
    id: "munkaszerzodes",
    category: "munkajogi",
    icon: "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
  },
  {
    id: "megbizasi",
    category: "b2b",
    icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  },
  {
    id: "nda",
    category: "b2b",
    icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
  },
];

const TEMPLATE_NAMES: Record<string, Record<string, string>> = {
  hu: {
    munkaszerzodes: "Munkaszerz\u0151d\u00e9s",
    megbizasi: "Megb\u00edz\u00e1si szerz\u0151d\u00e9s",
    nda: "Titoktart\u00e1si meg\u00e1llapod\u00e1s (NDA)",
  },
  en: {
    munkaszerzodes: "Employment Contract",
    megbizasi: "Service Agreement",
    nda: "Non-Disclosure Agreement (NDA)",
  },
};

export default function OnboardingWizard() {
  const { user, loadProfile } = useAuth();
  const { t, locale } = useI18n();
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [companyName, setCompanyName] = useState("");
  const [taxNumber, setTaxNumber] = useState("");
  const [address, setAddress] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);

  useEffect(() => {
    if (user && user.onboardingCompleted === false) {
      setVisible(true);
      // Pre-fill from user profile if available
      if (user.companyName) setCompanyName(user.companyName);
    }
  }, [user]);

  useEffect(() => {
    if (visible) {
      api.get("/templates?limit=3&sort=popular").then((res) => {
        const data = res.data?.data;
        if (Array.isArray(data) && data.length > 0) {
          setTemplates(data.slice(0, 3));
        }
      }).catch(() => {});
    }
  }, [visible]);

  const finish = async () => {
    setSaving(true);
    try {
      await api.patch("/auth/onboarding", {
        ...(companyName ? { companyName } : {}),
        ...(taxNumber ? { taxNumber } : {}),
        ...(address ? { address } : {}),
      });
      await loadProfile();
    } catch {
      // non-critical
    } finally {
      setSaving(false);
      setVisible(false);
    }
  };

  const skipAndClose = async () => {
    setSaving(true);
    try {
      await api.patch("/auth/onboarding", {});
      await loadProfile();
    } catch {
      // non-critical
    } finally {
      setSaving(false);
      setVisible(false);
    }
  };

  if (!visible) return null;

  const isPersonal = (user as any)?.accountType === "personal";
  const totalSteps = isPersonal ? 3 : 4;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 pt-6">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === step
                  ? "w-8 bg-brand-teal-dark"
                  : i < step
                  ? "w-2.5 bg-brand-teal-dark/50"
                  : "w-2.5 bg-gray-200 dark:bg-gray-600"
              }`}
            />
          ))}
        </div>

        <div className="p-8">
          {/* Step 0: Welcome */}
          {step === 0 && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-teal-dark to-brand-teal flex items-center justify-center mx-auto mb-6">
                <span className="text-white font-bold text-2xl">L</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                {t("onboarding.welcomeTitle")}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mb-2 leading-relaxed">
                {t("onboarding.welcomeDesc")}
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-sm">
                {t("onboarding.welcomeFeatures")}
              </p>
            </div>
          )}

          {/* Step 1: Company info (skip for personal accounts) */}
          {step === 1 && !isPersonal && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 text-center">
                {t("onboarding.companyTitle")}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 text-center">
                {t("onboarding.companyDesc")}
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t("onboarding.companyName")}
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder={t("onboarding.companyNamePlaceholder")}
                    className="w-full px-4 py-2.5 border dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-brand-teal-dark bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t("onboarding.taxNumber")}
                  </label>
                  <input
                    type="text"
                    value={taxNumber}
                    onChange={(e) => setTaxNumber(e.target.value)}
                    placeholder={t("onboarding.taxNumberPlaceholder")}
                    className="w-full px-4 py-2.5 border dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-brand-teal-dark bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t("onboarding.address")}
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder={t("onboarding.addressPlaceholder")}
                    className="w-full px-4 py-2.5 border dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-brand-teal-dark bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: First template (step 1 for personal) */}
          {step === (isPersonal ? 1 : 2) && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 text-center">
                {t("onboarding.templateTitle")}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 text-center">
                {t("onboarding.templateDesc")}
              </p>
              <div className="space-y-3">
                {(templates.length > 0 ? templates : POPULAR_TEMPLATES).map((tmpl) => {
                  const isApiTemplate = !!tmpl.name;
                  const templateId = isApiTemplate ? tmpl.id : tmpl.id;
                  const templateName = isApiTemplate
                    ? tmpl.name
                    : (TEMPLATE_NAMES[locale] || TEMPLATE_NAMES.hu)[tmpl.id] || tmpl.id;
                  const icon = isApiTemplate
                    ? POPULAR_TEMPLATES[0]?.icon
                    : tmpl.icon;
                  const isSelected = selectedTemplate === templateId;

                  return (
                    <button
                      key={templateId}
                      onClick={() => setSelectedTemplate(isSelected ? null : templateId)}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border transition text-left ${
                        isSelected
                          ? "border-brand-teal-dark bg-brand-teal-dark/5 dark:bg-brand-teal/10"
                          : "border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition ${
                          isSelected
                            ? "bg-brand-teal-dark text-white"
                            : "bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={icon} />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                          {templateName}
                        </p>
                        {isApiTemplate && tmpl.category && (
                          <p className="text-xs text-gray-400">{tmpl.category}</p>
                        )}
                      </div>
                      {isSelected && (
                        <svg className="w-5 h-5 text-brand-teal-dark flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 3: Done (step 2 for personal) */}
          {step === (isPersonal ? 2 : 3) && (
            <div>
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  {t("onboarding.doneTitle")}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  {t("onboarding.doneDesc")}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {t("onboarding.doneTrialInfo")}
                </p>
              </div>
              <div className="space-y-3">
                <QuickAction
                  href={selectedTemplate ? `/create?template=${selectedTemplate}` : "/create"}
                  icon="M12 4v16m8-8H4"
                  title={t("onboarding.doneCreateContract")}
                  onClick={finish}
                />
                <QuickAction
                  href="/templates"
                  icon="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z"
                  title={t("onboarding.doneBrowseTemplates")}
                  onClick={finish}
                />
                <QuickAction
                  href="/settings"
                  icon="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  title={t("onboarding.doneGoToSettings")}
                  onClick={finish}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer buttons */}
        <div className="px-8 pb-8 flex justify-between items-center">
          {step > 0 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 font-medium"
            >
              {t("onboarding.back")}
            </button>
          ) : (
            <button
              onClick={skipAndClose}
              className="text-sm text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
            >
              {t("onboarding.skip")}
            </button>
          )}

          {step < totalSteps - 1 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="bg-brand-teal-dark text-white px-6 py-2.5 rounded-lg font-medium hover:bg-brand-teal-dark/90 transition text-sm"
            >
              {t("onboarding.next")}
            </button>
          ) : (
            <button
              onClick={finish}
              disabled={saving}
              className="bg-brand-teal-dark text-white px-6 py-2.5 rounded-lg font-medium hover:bg-brand-teal-dark/90 transition text-sm disabled:opacity-50"
            >
              {saving ? t("onboarding.saving") : t("onboarding.finish")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function QuickAction({
  href,
  icon,
  title,
  onClick,
}: {
  href: string;
  icon: string;
  title: string;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-4 p-4 rounded-xl border dark:border-gray-600 hover:bg-brand-teal-dark/5 dark:hover:bg-brand-teal/10 hover:border-brand-teal-dark/30 transition group"
    >
      <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 group-hover:bg-brand-teal-dark/10 transition">
        <svg
          className="w-5 h-5 text-brand-teal-dark"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={icon} />
        </svg>
      </div>
      <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">{title}</p>
    </Link>
  );
}
