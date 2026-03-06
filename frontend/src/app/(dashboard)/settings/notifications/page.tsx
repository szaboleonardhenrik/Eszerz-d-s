"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import toast from "react-hot-toast";

interface NotificationForm {
  notifyOnSign: boolean;
  notifyOnDecline: boolean;
  notifyOnExpire: boolean;
  notifyOnComment: boolean;
  emailDigest: string;
}

const toggleItems: { key: keyof Omit<NotificationForm, "emailDigest">; label: string; description: string }[] = [
  { key: "notifyOnSign", label: "Aláíráskor", description: "Értesítés, ha valaki aláír egy szerződést" },
  { key: "notifyOnDecline", label: "Visszautasításkor", description: "Értesítés, ha valaki visszautasít egy szerződést" },
  { key: "notifyOnExpire", label: "Lejáratkor", description: "Értesítés, ha egy szerződés hamarosan lejár" },
  { key: "notifyOnComment", label: "Megjegyzésnél", description: "Értesítés, ha valaki megjegyzést fűz egy szerződéshez" },
];

const digestOptions = [
  { value: "instant", label: "Azonnal" },
  { value: "daily", label: "Napi összesítő" },
  { value: "weekly", label: "Heti összesítő" },
  { value: "none", label: "Kikapcsolva" },
];

export default function NotificationSettings() {
  const { user, loadProfile } = useAuth();
  const [form, setForm] = useState<NotificationForm>({
    notifyOnSign: true,
    notifyOnDecline: true,
    notifyOnExpire: true,
    notifyOnComment: true,
    emailDigest: "instant",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      const u = user as any;
      setForm({
        notifyOnSign: u.notifyOnSign ?? true,
        notifyOnDecline: u.notifyOnDecline ?? true,
        notifyOnExpire: u.notifyOnExpire ?? true,
        notifyOnComment: u.notifyOnComment ?? true,
        emailDigest: u.emailDigest ?? "instant",
      });
    }
  }, [user]);

  const handleToggle = (key: keyof Omit<NotificationForm, "emailDigest">) => {
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

  return (
    <div className="max-w-2xl">
      <div className="bg-white rounded-xl border p-6 space-y-6">
        <h2 className="text-lg font-semibold text-gray-900">Értesítések</h2>
        <p className="text-sm text-gray-500">
          Állítsd be, milyen eseményekről kapsz értesítést emailben.
        </p>

        <div className="space-y-4">
          {toggleItems.map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between py-3 border-b last:border-b-0"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">{item.label}</p>
                <p className="text-sm text-gray-500">{item.description}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={form[item.key]}
                onClick={() => handleToggle(item.key)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#41A5B9] focus:ring-offset-2 ${
                  form[item.key] ? "bg-[#198296]" : "bg-gray-200"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    form[item.key] ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>

        <div className="pt-2">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Email gyakoriság</h2>
          <p className="text-sm text-gray-500 mb-4">
            Milyen gyakran küldjünk összesítőt az értesítésekről?
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {digestOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, emailDigest: opt.value }))}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium border transition ${
                  form.emailDigest === opt.value
                    ? "border-[#198296] bg-[#41A5B9]/10 text-[#198296]"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {saving ? "Mentés..." : "Mentés"}
          </button>
        </div>
      </div>
    </div>
  );
}
