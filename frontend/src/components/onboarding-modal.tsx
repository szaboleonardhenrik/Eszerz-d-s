"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { useI18n } from "@/lib/i18n";

const STORAGE_KEY = "onboarding_completed";

export default function OnboardingModal() {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [companyName, setCompanyName] = useState("");
  const [taxNumber, setTaxNumber] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const done = localStorage.getItem(STORAGE_KEY);
      if (!done) {
        setVisible(true);
      }
    }
  }, []);

  const finish = async () => {
    if (companyName || taxNumber) {
      setSaving(true);
      try {
        await api.patch("/auth/profile", {
          ...(companyName ? { companyName } : {}),
          ...(taxNumber ? { taxNumber } : {}),
        });
      } catch {
        // silent - not critical
      } finally {
        setSaving(false);
      }
    }
    localStorage.setItem(STORAGE_KEY, "true");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Step indicator dots */}
        <div className="flex justify-center gap-2 pt-6">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                i === step ? "bg-blue-600" : "bg-gray-200"
              }`}
            />
          ))}
        </div>

        <div className="p-8">
          {/* Step 1: Welcome */}
          {step === 0 && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto mb-6">
                <span className="text-white font-bold text-2xl">L</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                {t("onboardingModal.welcome")}
              </h2>
              <p className="text-gray-500 mb-2 leading-relaxed">
                {t("onboardingModal.welcomeDesc")}
              </p>
              <p className="text-gray-400 text-sm">
                {t("onboardingModal.welcomeFeatures")}
              </p>
            </div>
          )}

          {/* Step 2: Company data */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2 text-center">
                {t("onboardingModal.companyTitle")}
              </h2>
              <p className="text-sm text-gray-500 mb-6 text-center">
                {t("onboardingModal.companyDesc")}
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("onboardingModal.companyName")}
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder={t("onboardingModal.companyPlaceholder")}
                    className="w-full px-4 py-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("onboardingModal.taxNumber")}
                  </label>
                  <input
                    type="text"
                    value={taxNumber}
                    onChange={(e) => setTaxNumber(e.target.value)}
                    placeholder="12345678-1-23"
                    className="w-full px-4 py-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Quick actions */}
          {step === 2 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2 text-center">
                {t("onboardingModal.letsStart")}
              </h2>
              <p className="text-sm text-gray-500 mb-6 text-center">
                {t("onboardingModal.chooseAction")}
              </p>
              <div className="space-y-3">
                <QuickAction
                  href="/templates"
                  icon="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z"
                  title={t("onboardingModal.browseTemplates")}
                  description={t("onboardingModal.browseTemplatesDesc")}
                  onClick={finish}
                />
                <QuickAction
                  href="/create"
                  icon="M12 4v16m8-8H4"
                  title={t("onboardingModal.createFirst")}
                  description={t("onboardingModal.createFirstDesc")}
                  onClick={finish}
                />
                <QuickAction
                  href="/settings/team"
                  icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                  title={t("onboardingModal.inviteTeam")}
                  description={t("onboardingModal.inviteTeamDesc")}
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
              className="text-sm text-gray-500 hover:text-gray-700 font-medium"
            >
              {t("onboardingModal.back")}
            </button>
          ) : (
            <button
              onClick={finish}
              className="text-sm text-gray-400 hover:text-gray-600"
            >
              {t("onboardingModal.skip")}
            </button>
          )}

          {step < 2 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition text-sm"
            >
              {t("onboardingModal.next")}
            </button>
          ) : (
            <button
              onClick={finish}
              disabled={saving}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition text-sm disabled:opacity-50"
            >
              {saving ? t("onboardingModal.saving") : t("onboardingModal.finish")}
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
  description,
  onClick,
}: {
  href: string;
  icon: string;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-4 p-4 rounded-xl border hover:bg-blue-50 hover:border-blue-200 transition group"
    >
      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 transition">
        <svg
          className="w-5 h-5 text-blue-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d={icon}
          />
        </svg>
      </div>
      <div>
        <p className="font-medium text-gray-900 text-sm">{title}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
    </Link>
  );
}
