"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-store";
import { useI18n } from "@/lib/i18n";

export default function TrialBanner() {
  const { user } = useAuth();
  const { t } = useI18n();

  if (!user) return null;

  const isProTrial = user.subscriptionTier === "pro_trial";
  const trialEndsAt = user.trialEndsAt ? new Date(user.trialEndsAt) : null;
  const now = new Date();

  // Show expired banner if trial ended and user is on free tier
  const trialExpired =
    user.subscriptionTier === "free" &&
    trialEndsAt &&
    trialEndsAt < now;

  if (!isProTrial && !trialExpired) return null;

  if (trialExpired) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-sm text-red-700 dark:text-red-300 font-medium">
              {t("trial.bannerExpired")}
            </p>
          </div>
          <Link
            href="/settings/billing"
            className="flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
          >
            {t("trial.upgrade")}
          </Link>
        </div>
      </div>
    );
  }

  if (!trialEndsAt) return null;

  const daysLeft = Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  const isExpiring = daysLeft <= 3;

  return (
    <div
      className={`border-b ${
        isExpiring
          ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
          : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <svg
            className={`w-4 h-4 flex-shrink-0 ${
              isExpiring ? "text-amber-500" : "text-blue-500"
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p
            className={`text-sm font-medium ${
              isExpiring
                ? "text-amber-700 dark:text-amber-300"
                : "text-blue-700 dark:text-blue-300"
            }`}
          >
            {isExpiring
              ? t("trial.bannerExpiring", { days: String(daysLeft) })
              : t("trial.banner", { days: String(daysLeft) })}
          </p>
        </div>
        <Link
          href="/settings/billing"
          className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg transition ${
            isExpiring
              ? "bg-amber-600 text-white hover:bg-amber-700"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          {t("trial.upgrade")}
        </Link>
      </div>
    </div>
  );
}
