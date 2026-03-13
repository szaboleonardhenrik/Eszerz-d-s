"use client";
import Link from "next/link";
import { useAuth } from "@/lib/auth-store";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useI18n } from "@/lib/i18n";

const tierOrder = ["free", "starter", "medium", "premium", "enterprise"];

// Cache flags globally so we don't re-fetch on every gate
let flagsCache: Record<string, boolean> | null = null;
let flagsPromise: Promise<Record<string, boolean>> | null = null;

function fetchFlags(): Promise<Record<string, boolean>> {
  if (flagsCache) return Promise.resolve(flagsCache);
  if (flagsPromise) return flagsPromise;
  flagsPromise = api
    .get("/feature-flags")
    .then((res) => {
      flagsCache = res.data.data;
      return flagsCache!;
    })
    .catch(() => {
      flagsPromise = null;
      return {} as Record<string, boolean>;
    });
  return flagsPromise;
}

// Call this when user logs out or tier changes
export function invalidateFeatureFlags() {
  flagsCache = null;
  flagsPromise = null;
}

interface FeatureGateProps {
  featureKey?: string;
  requiredTier?: string;
  children: React.ReactNode;
  featureName?: string;
}

export default function FeatureGate({
  featureKey,
  requiredTier,
  children,
  featureName,
}: FeatureGateProps) {
  const user = useAuth((s) => s.user);
  const [flags, setFlags] = useState<Record<string, boolean> | null>(flagsCache);
  const [loading, setLoading] = useState(!flagsCache);

  useEffect(() => {
    if (!user) return;
    if (flagsCache) {
      setFlags(flagsCache);
      setLoading(false);
      return;
    }
    fetchFlags().then((f) => {
      setFlags(f);
      setLoading(false);
    });
  }, [user]);

  // While loading, show children (optimistic)
  if (loading) return <>{children}</>;

  // Check feature flag if provided
  if (featureKey && flags) {
    if (flags[featureKey] === false) {
      return <UpgradePrompt featureName={featureName} featureKey={featureKey}>{children}</UpgradePrompt>;
    }
    if (flags[featureKey] === true) {
      return <>{children}</>;
    }
  }

  // Fallback: tier-based check (backwards compat)
  if (requiredTier) {
    const userTierIndex = tierOrder.indexOf(user?.subscriptionTier ?? "free");
    const requiredTierIndex = tierOrder.indexOf(requiredTier);
    if (userTierIndex >= requiredTierIndex) {
      return <>{children}</>;
    }
    return <UpgradePrompt featureName={featureName} tier={requiredTier}>{children}</UpgradePrompt>;
  }

  return <>{children}</>;
}

function UpgradePrompt({
  children,
  featureName,
  featureKey,
  tier,
}: {
  children: React.ReactNode;
  featureName?: string;
  featureKey?: string;
  tier?: string;
}) {
  const { t } = useI18n();

  const tierLabels: Record<string, string> = {
    starter: t("featureGate.tierStarter"),
    medium: t("featureGate.tierMedium"),
    premium: t("featureGate.tierPremium"),
    enterprise: t("featureGate.tierEnterprise"),
  };

  const label = featureName ?? featureKey ?? t("featureGate.defaultFeature");
  const tierName = tier ? tierLabels[tier] || tier : t("featureGate.tierHigher");

  return (
    <div className="relative">
      <div className="opacity-30 pointer-events-none blur-[1px]">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 text-center max-w-sm">
          <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mx-auto mb-3">
            <svg
              className="w-6 h-6 text-purple-600 dark:text-purple-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
            {t("featureGate.availableIn", { label, tier: tierName })}
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            {t("featureGate.upgradeDesc")}
          </p>
          <Link
            href="/settings/billing"
            className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
            {t("featureGate.upgradePlan")}
          </Link>
        </div>
      </div>
    </div>
  );
}
