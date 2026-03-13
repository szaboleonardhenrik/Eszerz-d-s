"use client";

import { useEffect, useState } from "react";
import { onMaintenanceChange, getMaintenanceMessage } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

export default function MaintenanceBanner() {
  const { t } = useI18n();
  const [message, setMessage] = useState<string | null>(getMaintenanceMessage());

  useEffect(() => {
    return onMaintenanceChange(setMessage);
  }, []);

  if (!message) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-5">
          <svg
            className="w-8 h-8 text-amber-600 dark:text-amber-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {t("maintenance.title")}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {message}
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
          <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span>{t("maintenance.comingBack")}</span>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition"
        >
          {t("maintenance.retry")}
        </button>
      </div>
    </div>
  );
}
