"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import toast from "react-hot-toast";
import { useI18n } from "@/lib/i18n";

interface NotificationForm {
  notifyOnSign: boolean;
  notifyOnDecline: boolean;
  notifyOnExpire: boolean;
  notifyOnComment: boolean;
  notifyOnComplete: boolean;
  notifyMarketing: boolean;
  emailDigest: string;
}

const contractToggles: {
  key: keyof NotificationForm;
  label: string;
  description: string;
}[] = [
  {
    key: "notifyOnSign",
    label: "Aláírás értesítés",
    description: "Értesítés amikor valaki aláírja a szerződésedet",
  },
  {
    key: "notifyOnDecline",
    label: "Visszautasítás értesítés",
    description: "Értesítés amikor valaki visszautasít egy szerződést",
  },
  {
    key: "notifyOnExpire",
    label: "Lejárati figyelmeztetés",
    description: "Értesítés a szerződések lejárata előtt",
  },
  {
    key: "notifyOnComment",
    label: "Hozzászólás értesítés",
    description: "Értesítés új hozzászólásokról a szerződéseidnél",
  },
  {
    key: "notifyOnComplete",
    label: "Befejezés értesítés",
    description: "Értesítés amikor egy szerződés teljesen aláírva és lezárva",
  },
];

const marketingToggles: {
  key: keyof NotificationForm;
  label: string;
  description: string;
}[] = [
  {
    key: "notifyMarketing",
    label: "Marketing értesítések",
    description: "Hírlevelek, tippek, újdonságok és promóciók",
  },
];

const digestOptions = [
  { value: "instant", label: "Azonnal", description: "Minden eseménynél" },
  { value: "daily", label: "Napi", description: "Napi összesítő" },
  { value: "weekly", label: "Heti", description: "Heti összesítő" },
  { value: "none", label: "Kikapcsolva", description: "Nincs email" },
];

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#41A5B9] focus:ring-offset-2 ${
        checked ? "bg-[#198296]" : "bg-gray-200"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

export default function NotificationSettings() {
  const { t } = useI18n();
  const { user, loadProfile } = useAuth();
  const [form, setForm] = useState<NotificationForm>({
    notifyOnSign: true,
    notifyOnDecline: true,
    notifyOnExpire: true,
    notifyOnComment: true,
    notifyOnComplete: true,
    notifyMarketing: false,
    emailDigest: "instant",
  });
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        notifyOnSign: user.notifyOnSign ?? true,
        notifyOnDecline: user.notifyOnDecline ?? true,
        notifyOnExpire: user.notifyOnExpire ?? true,
        notifyOnComment: user.notifyOnComment ?? true,
        notifyOnComplete: user.notifyOnComplete ?? true,
        notifyMarketing: user.notifyMarketing ?? false,
        emailDigest: user.emailDigest ?? "instant",
      });
      setLoaded(true);
    }
  }, [user]);

  const handleToggle = (key: keyof NotificationForm) => {
    setForm((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch("/auth/profile", form);
      await loadProfile();
      toast.success("Értesítési beállítások mentve");
    } catch {
      toast.error("Hiba a mentéskor");
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) {
    return (
      <div className="max-w-2xl">
        <div className="bg-white rounded-xl border p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-40 mb-4" />
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex justify-between items-center py-3">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-32" />
                  <div className="h-3 bg-gray-100 rounded w-56" />
                </div>
                <div className="h-6 w-11 bg-gray-200 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Contract notifications */}
      <div className="bg-white rounded-xl border p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            {t("notificationSettings.contractNotifications")}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {t("notificationSettings.contractNotificationsDesc")}
          </p>
        </div>

        <div className="space-y-1">
          {contractToggles.map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between py-3 border-b last:border-b-0"
            >
              <div className="pr-4">
                <p className="text-sm font-medium text-gray-900">
                  {item.label}
                </p>
                <p className="text-sm text-gray-500">{item.description}</p>
              </div>
              <Toggle
                checked={form[item.key] as boolean}
                onChange={() => handleToggle(item.key)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Email frequency */}
      <div className="bg-white rounded-xl border p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            {t("notificationSettings.emailFrequency")}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {t("notificationSettings.emailFrequencyDesc")}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {digestOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() =>
                setForm((prev) => ({ ...prev, emailDigest: opt.value }))
              }
              className={`px-4 py-3 rounded-lg text-center border transition ${
                form.emailDigest === opt.value
                  ? "border-[#198296] bg-[#41A5B9]/10 text-[#198296] ring-1 ring-[#198296]"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              <span className="block text-sm font-medium">{opt.label}</span>
              <span className="block text-xs text-gray-400 mt-0.5">
                {opt.description}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Marketing */}
      <div className="bg-white rounded-xl border p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            {t("notificationSettings.marketing")}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {t("notificationSettings.marketingDesc")}
          </p>
        </div>

        <div className="space-y-1">
          {marketingToggles.map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between py-3 border-b last:border-b-0"
            >
              <div className="pr-4">
                <p className="text-sm font-medium text-gray-900">
                  {item.label}
                </p>
                <p className="text-sm text-gray-500">{item.description}</p>
              </div>
              <Toggle
                checked={form[item.key] as boolean}
                onChange={() => handleToggle(item.key)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-[#198296] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-[#146d7d] disabled:opacity-50 transition"
        >
          {saving ? t("notificationSettings.saving") : t("notificationSettings.saveSettings")}
        </button>
      </div>
    </div>
  );
}
