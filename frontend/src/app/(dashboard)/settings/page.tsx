"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import toast from "react-hot-toast";
import { useI18n } from "@/lib/i18n";

export default function ProfileSettings() {
  const { t } = useI18n();
  const { user, loadProfile } = useAuth();
  const [form, setForm] = useState({
    name: "",
    companyName: "",
    taxNumber: "",
    phone: "",
    companyAddress: "",
  });
  const [saving, setSaving] = useState(false);
  const formatTaxNumber = (raw: string): string => {
    const cleaned = raw.replace(/[^\d-]/g, "");
    if (/^\d{0,8}(-\d{0,2}(-\d{0,2})?)?$/.test(cleaned)) {
      const parts = cleaned.split("-");
      parts[0] = parts[0].slice(0, 8);
      if (parts[1] !== undefined) parts[1] = parts[1].slice(0, 1);
      if (parts[2] !== undefined) parts[2] = parts[2].slice(0, 2);
      return parts.join("-");
    }
    const digits = raw.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 8) return digits;
    if (digits.length <= 9) return `${digits.slice(0, 8)}-${digits.slice(8)}`;
    return `${digits.slice(0, 8)}-${digits.slice(8, 9)}-${digits.slice(9)}`;
  };

  const [showEmailChange, setShowEmailChange] = useState(false);
  const [emailChangeForm, setEmailChangeForm] = useState({ newEmail: "", password: "" });
  const [emailChangeSaving, setEmailChangeSaving] = useState(false);

  useEffect(() => {
    if (user) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const u = user as any;
      setForm({
        name: user.name ?? "",
        companyName: u.companyName ?? "",
        taxNumber: u.taxNumber ?? "",
        phone: u.phone ?? "",
        companyAddress: u.companyAddress ?? "",
      });
    }
  }, [user]);

  const handleSave = async () => {
    if (form.taxNumber && !/^\d{8}-\d{1,2}-\d{2}$/.test(form.taxNumber)) {
      toast.error("Érvénytelen adószám formátum (helyes: 12345678-1-23)");
      return;
    }
    setSaving(true);
    try {
      await api.patch("/auth/profile", form);
      await loadProfile();
      toast.success("Profil frissítve");
    } catch {
      toast.error("Hiba a mentéskor");
    } finally {
      setSaving(false);
    }
  };

  const handleEmailChange = async () => {
    setEmailChangeSaving(true);
    try {
      await api.post("/auth/change-email", emailChangeForm);
      toast.success("Megerősítő e-mailt küldtünk az új címre!");
      setShowEmailChange(false);
      setEmailChangeForm({ newEmail: "", password: "" });
      await loadProfile();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string; error?: { message?: string } } } };
      toast.error(axiosErr?.response?.data?.error?.message || axiosErr?.response?.data?.message || "Hiba az e-mail módosításkor");
    } finally {
      setEmailChangeSaving(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-6 space-y-5">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t("settings.personalInfo")}</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("settings.fullName")}</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-2.5 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("settings.phone")}</label>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-4 py-2.5 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:text-gray-100"
              placeholder="+36 30 123 4567"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("settings.emailAddress")}</label>
          <div className="flex gap-2">
            <input
              value={user?.email ?? ""}
              disabled
              className="flex-1 px-4 py-2.5 border dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400"
            />
            <button
              type="button"
              onClick={() => setShowEmailChange(true)}
              className="px-4 py-2.5 border dark:border-gray-600 rounded-lg text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition"
            >
              Módosítás
            </button>
          </div>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {(user as any)?.emailVerified === false && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Az e-mail cím nincs megerősítve. Ellenőrizd a postaládádat.</p>
          )}
        </div>

        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 pt-4">{t("settings.companyData")}</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("settings.companyName")}</label>
            <input
              value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
              className="w-full px-4 py-2.5 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("settings.taxNumber")}</label>
            <input
              value={form.taxNumber}
              onChange={(e) => setForm({ ...form, taxNumber: formatTaxNumber(e.target.value) })}
              maxLength={13}
              className="w-full px-4 py-2.5 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:text-gray-100"
              placeholder="12345678-1-23"
            />
            {form.taxNumber && (
              <div className="flex items-center justify-between mt-1">
                <p className={`text-xs ${/^\d{8}-\d{1,2}-\d{2}$/.test(form.taxNumber) ? "text-green-500 dark:text-green-400" : "text-red-500 dark:text-red-400"}`}>
                  {/^\d{8}-\d{1,2}-\d{2}$/.test(form.taxNumber) ? "Érvényes adószám" : "Érvénytelen formátum (helyes: 12345678-1-23)"}
                </p>
                <span className={`text-xs ${form.taxNumber.replace(/\D/g, "").length === 11 ? "text-green-500" : "text-gray-400"}`}>
                  {form.taxNumber.replace(/\D/g, "").length}/11 számjegy
                </span>
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Székhely</label>
          <input
            value={form.companyAddress}
            onChange={(e) => setForm({ ...form, companyAddress: e.target.value })}
            className="w-full px-4 py-2.5 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:text-gray-100"
            placeholder="1234 Budapest, Példa utca 1."
          />
        </div>

        <div className="pt-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {saving ? t("settings.saving") : t("common.save")}
          </button>
        </div>
      </div>

      {/* Email change modal */}
      {showEmailChange && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">E-mail cím módosítása</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Az új e-mail címre megerősítő linket küldünk.</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Új e-mail cím</label>
              <input
                type="email"
                value={emailChangeForm.newEmail}
                onChange={(e) => setEmailChangeForm(f => ({ ...f, newEmail: e.target.value }))}
                className="w-full px-4 py-2.5 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:text-gray-100"
                placeholder="uj@email.hu"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Jelenlegi jelszó</label>
              <input
                type="password"
                value={emailChangeForm.password}
                onChange={(e) => setEmailChangeForm(f => ({ ...f, password: e.target.value }))}
                className="w-full px-4 py-2.5 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowEmailChange(false)} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                Mégse
              </button>
              <button
                onClick={handleEmailChange}
                disabled={emailChangeSaving || !emailChangeForm.newEmail || !emailChangeForm.password}
                className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {emailChangeSaving ? "Küldés..." : "E-mail módosítása"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
