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

interface Session {
  id: string;
  ipAddress: string | null;
  device: string | null;
  lastActive: string;
  createdAt: string;
  current: boolean;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Most";
  if (mins < 60) return `${mins} perce`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} órája`;
  const days = Math.floor(hours / 24);
  return `${days} napja`;
}

function deviceIcon(device: string | null): string {
  switch (device) {
    case "Windows": return "M3 5h8v8H3V5zm10 0h8v8h-8V5zM3 15h8v6H3v-6zm10 0h8v6h-8v-6z";
    case "Mac": return "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z";
    case "iPhone": case "Android": case "Mobil": return "M7 2h10a2 2 0 012 2v16a2 2 0 01-2 2H7a2 2 0 01-2-2V4a2 2 0 012-2zm5 18a1 1 0 100-2 1 1 0 000 2z";
    case "Linux": return "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z";
    default: return "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z";
  }
}

export default function SecuritySettings() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [twoFaSetup, setTwoFaSetup] = useState<{ qrCode: string; secret: string } | null>(null);
  const [twoFaCode, setTwoFaCode] = useState("");
  const [twoFaEnabled, setTwoFaEnabled] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [twoFaLoading, setTwoFaLoading] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");

  const strength = useMemo(() => getPasswordStrength(newPassword), [newPassword]);

  const passwordsMatch = confirmPassword === "" || newPassword === confirmPassword;
  const isValid =
    oldPassword.length > 0 &&
    newPassword.length >= 8 &&
    newPassword === confirmPassword;

  useEffect(() => {
    loadSessions();
    load2faStatus();
  }, []);

  const load2faStatus = async () => {
    try {
      const res = await api.get("/auth/profile");
      setTwoFaEnabled(res.data.data.twoFactorEnabled ?? false);
    } catch {}
  };

  const handleSetup2fa = async () => {
    setTwoFaLoading(true);
    try {
      const res = await api.post("/auth/2fa/setup");
      setTwoFaSetup(res.data.data);
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message ?? "Hiba a 2FA beállításkor");
    } finally {
      setTwoFaLoading(false);
    }
  };

  const handleVerify2fa = async () => {
    if (!twoFaCode.trim()) return;
    setTwoFaLoading(true);
    try {
      const res = await api.post("/auth/2fa/verify", { code: twoFaCode.trim() });
      setBackupCodes(res.data.data.backupCodes);
      setTwoFaEnabled(true);
      setTwoFaSetup(null);
      setTwoFaCode("");
      toast.success("Kétfaktoros hitelesítés bekapcsolva!");
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message ?? "Érvénytelen kód");
    } finally {
      setTwoFaLoading(false);
    }
  };

  const handleDisable2fa = async () => {
    if (!disablePassword) { toast.error("Add meg a jelszavadat"); return; }
    setTwoFaLoading(true);
    try {
      await api.post("/auth/2fa/disable", { password: disablePassword });
      setTwoFaEnabled(false);
      setDisablePassword("");
      toast.success("Kétfaktoros hitelesítés kikapcsolva");
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message ?? "Hiba");
    } finally {
      setTwoFaLoading(false);
    }
  };

  const loadSessions = async () => {
    try {
      const res = await api.get("/auth/sessions");
      setSessions(res.data.data);
    } catch {
      // silently fail
    } finally {
      setSessionsLoading(false);
    }
  };

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

  const revokeSession = async (sessionId: string) => {
    try {
      await api.delete(`/auth/sessions/${sessionId}`);
      toast.success("Munkamenet törölve");
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch {
      toast.error("Hiba a munkamenet törlésekor");
    }
  };

  const revokeAllOther = async () => {
    try {
      const res = await api.delete("/auth/sessions");
      toast.success(res.data.data.message);
      setSessions((prev) => prev.filter((s) => s.current));
    } catch {
      toast.error("Hiba a munkamenetek törlésekor");
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      toast.error("Add meg a jelszavadat a törléshez");
      return;
    }
    setDeleting(true);
    try {
      await api.post("/auth/delete-account", { password: deletePassword });
      toast.success("Fiók sikeresen törölve");
      localStorage.clear();
      window.location.href = "/login";
    } catch (err: any) {
      const msg = err.response?.data?.error?.message ?? "Hiba a fiók törlésekor";
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      const res = await api.get("/auth/export-data", { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `szerzodes-portal-adatexport-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Adatexport letöltve");
    } catch {
      toast.error("Hiba az adatexportnál");
    } finally {
      setExporting(false);
    }
  };

  const otherSessions = sessions.filter((s) => !s.current);

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

      {/* Active Sessions */}
      <div className="bg-white rounded-xl border p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Aktív munkamenetek
          </h2>
          {otherSessions.length > 0 && (
            <button
              onClick={revokeAllOther}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Összes többi kijelentkeztetése
            </button>
          )}
        </div>

        {sessionsLoading ? (
          <div className="py-8 text-center text-gray-400 text-sm">Betöltés...</div>
        ) : sessions.length === 0 ? (
          <div className="py-8 text-center text-gray-400 text-sm">Nincs aktív munkamenet</div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={`rounded-lg p-4 flex items-center justify-between ${
                  session.current ? "bg-green-50 border border-green-200" : "bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    session.current ? "bg-green-100" : "bg-gray-200"
                  }`}>
                    <svg className={`w-5 h-5 ${session.current ? "text-green-600" : "text-gray-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={deviceIcon(session.device)} />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900">
                        {session.device || "Ismeretlen eszköz"}
                      </p>
                      {session.current && (
                        <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-0.5 rounded">
                          Jelenlegi
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      {session.ipAddress || "Ismeretlen IP"} &middot; {timeAgo(session.lastActive)}
                    </p>
                    <p className="text-xs text-gray-400">
                      Belépés: {new Date(session.createdAt).toLocaleString("hu-HU")}
                    </p>
                  </div>
                </div>
                {!session.current && (
                  <button
                    onClick={() => revokeSession(session.id)}
                    className="text-sm text-red-600 hover:text-red-700 font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition"
                  >
                    Kijelentkeztetés
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

      </div>

      {/* 2FA Section */}
      <div className="bg-white rounded-xl border p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Kétfaktoros hitelesítés (2FA)</h2>
            <p className="text-sm text-gray-500 mt-1">Extra biztonsági réteg a fiókodhoz</p>
          </div>
          {twoFaEnabled && (
            <span className="text-xs font-semibold bg-green-100 text-green-700 px-3 py-1 rounded-full">
              Aktív
            </span>
          )}
        </div>

        {/* Backup codes display after setup */}
        {backupCodes && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
            <p className="text-sm font-semibold text-amber-800">Tartalék kódok — mentsd el biztonságos helyre!</p>
            <p className="text-xs text-amber-700">Ezek a kódok csak egyszer használhatók. Ha elveszíted a hitelesítő alkalmazásod, ezekkel tudsz bejelentkezni.</p>
            <div className="grid grid-cols-2 gap-2">
              {backupCodes.map((code, i) => (
                <code key={i} className="bg-white border rounded px-3 py-1.5 text-sm font-mono text-center select-all">
                  {code}
                </code>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(backupCodes.join("\n"));
                  toast.success("Kódok vágólapra másolva");
                }}
                className="text-sm text-amber-700 font-medium hover:text-amber-900"
              >
                Másolás
              </button>
              <button
                onClick={() => setBackupCodes(null)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Bezárás
              </button>
            </div>
          </div>
        )}

        {!twoFaEnabled ? (
          <>
            {!twoFaSetup ? (
              <button
                onClick={handleSetup2fa}
                disabled={twoFaLoading}
                className="bg-[#198296] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-[#14697a] disabled:opacity-50 transition"
              >
                {twoFaLoading ? "Betöltés..." : "2FA bekapcsolása"}
              </button>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Szkenneld be a QR kódot egy hitelesítő alkalmazással (pl. Google Authenticator, Authy):
                </p>
                <div className="flex justify-center">
                  <img src={twoFaSetup.qrCode} alt="2FA QR kód" className="w-48 h-48 rounded-lg border" />
                </div>
                <details className="text-sm">
                  <summary className="text-gray-500 cursor-pointer hover:text-gray-700">Kézi bevitel</summary>
                  <code className="block mt-2 bg-gray-100 rounded px-3 py-2 text-xs font-mono select-all break-all">
                    {twoFaSetup.secret}
                  </code>
                </details>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ellenőrző kód az alkalmazásból
                  </label>
                  <input
                    type="text"
                    value={twoFaCode}
                    onChange={(e) => setTwoFaCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#198296] outline-none text-center text-xl tracking-widest font-mono"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleVerify2fa}
                    disabled={twoFaLoading || twoFaCode.length !== 6}
                    className="bg-[#198296] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-[#14697a] disabled:opacity-50 transition"
                  >
                    {twoFaLoading ? "Ellenőrzés..." : "Megerősítés és bekapcsolás"}
                  </button>
                  <button
                    onClick={() => { setTwoFaSetup(null); setTwoFaCode(""); }}
                    className="px-4 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                  >
                    Mégse
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              A kétfaktoros hitelesítés aktív. Kikapcsolásához add meg a jelszavadat.
            </p>
            <div className="flex gap-2">
              <input
                type="password"
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
                placeholder="Jelszó"
                className="flex-1 px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
              />
              <button
                onClick={handleDisable2fa}
                disabled={twoFaLoading || !disablePassword}
                className="text-red-600 border border-red-300 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-50 transition"
              >
                2FA kikapcsolása
              </button>
            </div>
          </div>
        )}
      </div>

      {/* GDPR Data Export */}
      <div className="bg-white rounded-xl border p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Adataim</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">Adathordozhatóság (GDPR 20. cikk)</p>
            <p className="text-sm text-gray-500">
              Az összes személyes adatod letöltése géppel olvasható JSON formátumban
            </p>
          </div>
          <button
            onClick={handleExportData}
            disabled={exporting}
            className="bg-[#198296] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#14697a] disabled:opacity-50 transition"
          >
            {exporting ? "Exportálás..." : "Adatok letöltése"}
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-xl border border-red-200 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-red-600">Veszélyzóna</h2>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">Fiók törlése (GDPR 17. cikk)</p>
            <p className="text-sm text-gray-500">
              A fiók és az összes személyes adat véglegesen és visszavonhatatlanul törlődik
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
            <p className="text-sm text-red-800 font-medium">
              Biztosan törölni szeretnéd a fiókodat? Ez a művelet nem visszavonható.
            </p>
            <p className="text-xs text-red-700">
              Minden szerződésed, partnered, sablonod és napló bejegyzésed véglegesen törlődik.
              A jogszabály által előírt adatmegőrzési kötelezettségek (pl. számviteli adatok 8 év)
              ettől függetlenül érvényesek maradnak.
            </p>
            <div>
              <label className="block text-sm font-medium text-red-800 mb-1">
                Add meg a jelszavadat a megerősítéshez
              </label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Jelszó"
                className="w-full px-4 py-2.5 border border-red-300 rounded-lg outline-none focus:ring-2 focus:ring-red-500 bg-white"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleDeleteAccount}
                disabled={deleting || !deletePassword}
                className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition"
              >
                {deleting ? "Törlés..." : "Véglegesen törlöm a fiókomat"}
              </button>
              <button
                onClick={() => { setShowDeleteConfirm(false); setDeletePassword(""); }}
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
