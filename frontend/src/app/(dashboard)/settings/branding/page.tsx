"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import toast from "react-hot-toast";
import FeatureGate from "@/components/feature-gate";
import { useI18n } from "@/lib/i18n";

const PRESET_COLORS = [
  "#198296", "#2563eb", "#7c3aed", "#dc2626", "#059669",
  "#d97706", "#db2777", "#4f46e5", "#0891b2", "#65a30d",
];

export default function BrandingSettings() {
  const { t } = useI18n();
  const { user, loadProfile } = useAuth();
  const [logoUrl, setLogoUrl] = useState("");
  const [brandColor, setBrandColor] = useState("#198296");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setLogoUrl((user as any).brandLogoUrl ?? "");
      setBrandColor((user as any).brandColor ?? "#198296");
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch("/auth/profile", {
        brandLogoUrl: logoUrl || null,
        brandColor: brandColor || null,
      });
      await loadProfile();
      toast.success("Arculat mentve!");
    } catch {
      toast.error("Hiba a mentéskor");
    } finally {
      setSaving(false);
    }
  };

  return (
    <FeatureGate featureKey="custom_branding" requiredTier="premium" featureName="Branding">
    <div className="max-w-2xl">
      <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {t("branding.title")}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t("branding.subtitle")}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t("branding.logo")}
          </label>
          <input
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="https://example.com/logo.png"
            className="w-full px-4 py-2.5 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#198296] outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
          <p className="text-xs text-gray-400 mt-1">
            Ajánlott méret: max 200x60 px, PNG vagy SVG formátum
          </p>
        </div>

        {logoUrl && (
          <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <span className="text-sm text-gray-500 dark:text-gray-400">{t("branding.preview")}:</span>
            <img
              src={logoUrl}
              alt="Logo"
              className="max-h-10 max-w-[200px] object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t("branding.color")}
          </label>
          <div className="flex items-center gap-3 flex-wrap">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setBrandColor(c)}
                className={`w-8 h-8 rounded-full border-2 transition ${
                  brandColor === c ? "border-gray-900 dark:border-white scale-110" : "border-transparent"
                }`}
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
            <div className="flex items-center gap-2 ml-2">
              <input
                type="color"
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer border-0"
              />
              <input
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                className="w-24 px-2 py-1.5 border dark:border-gray-600 rounded-lg text-sm font-mono bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="#198296"
              />
            </div>
          </div>
        </div>

        {/* Preview */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t("branding.pdfPreview")}
          </label>
          <div className="border dark:border-gray-600 rounded-lg p-6 bg-white dark:bg-gray-900">
            <div className="flex items-center justify-between pb-3 mb-4" style={{ borderBottom: `2px solid ${brandColor}` }}>
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="max-h-8 max-w-[160px] object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              ) : (
                <div className="w-8 h-8 rounded" style={{ backgroundColor: brandColor, opacity: 0.2 }} />
              )}
              <span className="text-sm font-semibold" style={{ color: brandColor }}>
                {(user as any)?.companyName || "Céged neve"}
              </span>
            </div>
            <h3 className="text-base font-bold mb-2" style={{ color: brandColor }}>
              Minta szerződés cím
            </h3>
            <div className="space-y-1">
              <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded w-full" />
              <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded w-11/12" />
              <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded w-10/12" />
              <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded w-8/12" />
            </div>
            <div className="mt-4 pt-3 border-t dark:border-gray-700 text-center">
              <span className="text-[10px] text-gray-400">
                {(user as any)?.companyName || "Legitas"} — Elektronikusan generált dokumentum — 1/1. oldal
              </span>
            </div>
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="text-white px-6 py-2.5 rounded-lg font-medium hover:opacity-90 disabled:opacity-50 transition"
            style={{ backgroundColor: brandColor }}
          >
            {saving ? t("settings.saving") : t("common.save")}
          </button>
        </div>
      </div>
    </div>
    </FeatureGate>
  );
}
