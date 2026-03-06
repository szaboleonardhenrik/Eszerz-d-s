"use client";

import { useState, useEffect, useMemo } from "react";
import api from "@/lib/api";
import toast from "react-hot-toast";

function getPasswordStrength(password: string): {
  label: string;
  color: string;
  width: string;
} {
  if (!password) return { label: "", color: "bg-gray-200", width: "w-0" };

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score <= 2) return { label: "Gyenge", color: "bg-red-500", width: "w-1/3" };
  if (score <= 3) return { label: "Közepes", color: "bg-yellow-500", width: "w-2/3" };
  return { label: "Erős", color: "bg-green-500", width: "w-full" };
}

export default function SecuritySettings() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [lastActivity, setLastActivity] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const strength = useMemo(() => getPasswordStrength(newPassword), [newPassword]);

  const passwordsMatch = confirmPassword === "" || newPassword === confirmPassword;
  const isValid =
    oldPassword.length > 0 &&
    newPassword.length >= 8 &&
    newPassword === confirmPassword;

  useEffect(() => {
    api
      .get("/auth/sessions")
      .then((res) => {
        setLastActivity(res.data.data.lastActivity);
      })
      .catch(() => {});
  }, []);

  const handleChangePassword = async () => {
    if (!isValid) return;
    setSaving(true);
    try {
      await api.post("/auth/change-password", { oldPassword, newPassword });
      toast.success("Jelszó sikeresen módosítva");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      const message =
        err.response?.data?.error?.message ??
        err.response?.data?.message ??
        "Hiba a jelszó módosításakor";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = () => {
    setShowDeleteConfirm(false);
    toast("Kérjük vegye fel a kapcsolatot: hello@szerzodesportal.hu", {
      icon: "📧",
      duration: 5000,
    });
  };

  return (
    <div className="max-w-2xl space-y-6">
      {/* Password Change */}
      <div className="bg-white rounded-xl border p-6 space-y-5">
        <h2 className="text-lg font-semibold text-gray-900">
          Jelszó módosítása
        </h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Jelenlegi jelszó
          </label>
          <input
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#198296] outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Új jelszó
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#198296] outline-none"
          />
          {newPassword && (
            <div className="mt-2">
              <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${strength.color} ${strength.width} transition-all duration-300 rounded-full`}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Jelszó erőssége:{" "}
                <span
                  className={
                    strength.label === "Gyenge"
                      ? "text-red-600"
                      : strength.label === "Közepes"
                      ? "text-yellow-600"
                      : "text-green-600"
                  }
                >
                  {strength.label}
                </span>
              </p>
            </div>
          )}
          {newPassword && newPassword.length < 8 && (
            <p className="text-xs text-red-500 mt-1">
              Minimum 8 karakter szükséges
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Új jelszó megerősítése
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#198296] outline-none"
          />
          {!passwordsMatch && (
            <p className="text-xs text-red-500 mt-1">
              A jelszavak nem egyeznek
            </p>
          )}
        </div>

        <button
          onClick={handleChangePassword}
          disabled={!isValid || saving}
          className="bg-[#198296] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-[#14697a] disabled:opacity-50 transition"
        >
          {saving ? "Mentés..." : "Jelszó módosítása"}
        </button>
      </div>

      {/* Account Security */}
      <div className="bg-white rounded-xl border p-6 space-y-5">
        <h2 className="text-lg font-semibold text-gray-900">
          Fiók biztonság
        </h2>

        <div className="flex items-center justify-between py-3 border-b">
          <div>
            <p className="text-sm font-medium text-gray-900">
              Utolsó bejelentkezés
            </p>
            <p className="text-sm text-gray-500">
              {lastActivity
                ? new Date(lastActivity).toLocaleString("hu-HU")
                : "Betöltés..."}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between py-3 border-b">
          <div>
            <p className="text-sm font-medium text-gray-900">
              Kétfaktoros hitelesítés
            </p>
            <p className="text-sm text-gray-500">
              Extra biztonsági réteg a fiókodhoz
            </p>
          </div>
          <span className="text-xs font-medium bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
            Hamarosan
          </span>
        </div>

        <div className="py-3">
          <p className="text-sm font-medium text-gray-900 mb-2">
            Munkamenetek
          </p>
          <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Jelenlegi munkamenet
                </p>
                <p className="text-xs text-gray-500">
                  {lastActivity
                    ? `Utolsó aktivitás: ${new Date(lastActivity).toLocaleString("hu-HU")}`
                    : "Aktív"}
                </p>
              </div>
            </div>
            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
              Aktív
            </span>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-xl border border-red-200 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-red-600">Veszélyzóna</h2>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">Fiók törlése</p>
            <p className="text-sm text-gray-500">
              A fiók és az összes adat véglegesen törlődik
            </p>
          </div>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="text-red-600 border border-red-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-50 transition"
          >
            Fiók törlése
          </button>
        </div>

        {showDeleteConfirm && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
            <p className="text-sm text-red-800">
              Biztosan törölni szeretnéd a fiókodat? Ez a művelet nem
              visszavonható.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDeleteAccount}
                className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition"
              >
                Igen, törlöm
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="bg-white text-gray-700 border px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
              >
                Mégsem
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
