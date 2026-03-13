"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { useI18n } from "@/lib/i18n";

interface Signer {
  name: string;
  email: string;
  status: string;
}

interface Contract {
  id: string;
  title: string;
  status: string;
  updatedAt: string;
  signers: Signer[];
}

interface ActivityFeedProps {
  limit?: number;
}

const STATUS_CONFIG: Record<
  string,
  { icon: React.ReactNode; labelKey: string; color: string }
> = {
  draft: {
    labelKey: "activityFeed.draftCreated",
    color: "text-gray-500 dark:text-gray-400",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125"
        />
      </svg>
    ),
  },
  sent: {
    labelKey: "activityFeed.sentForSigning",
    color: "text-blue-500 dark:text-blue-400",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
        />
      </svg>
    ),
  },
  completed: {
    labelKey: "activityFeed.fullySigned",
    color: "text-green-500 dark:text-green-400",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  declined: {
    labelKey: "activityFeed.declined",
    color: "text-red-500 dark:text-red-400",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  partially_signed: {
    labelKey: "activityFeed.partiallySigned",
    color: "text-yellow-500 dark:text-yellow-400",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
};

// relativeTime is now a method inside the component

export default function ActivityFeed({ limit = 10 }: ActivityFeedProps) {
  const { t } = useI18n();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  const relativeTime = (dateStr: string): string => {
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diffMs = now - then;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    const diffWeek = Math.floor(diffDay / 7);
    const diffMonth = Math.floor(diffDay / 30);

    if (diffSec < 60) return t("activityFeed.timeNow");
    if (diffMin < 60) return t("activityFeed.timeMinutes", { count: String(diffMin) });
    if (diffHour < 24) return t("activityFeed.timeHours", { count: String(diffHour) });
    if (diffDay < 7) return t("activityFeed.timeDays", { count: String(diffDay) });
    if (diffWeek < 5) return t("activityFeed.timeWeeks", { count: String(diffWeek) });
    return t("activityFeed.timeMonths", { count: String(diffMonth) });
  };

  useEffect(() => {
    api
      .get("/contracts", { params: { limit: 20, sort: "updatedAt" } })
      .then((res) => {
        const items: Contract[] = res.data.data.items ?? [];
        setContracts(items.slice(0, limit));
      })
      .catch(() => {
        setContracts([]);
      })
      .finally(() => setLoading(false));
  }, [limit]);

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (contracts.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
        {t("activityFeed.noActivity")}
      </p>
    );
  }

  return (
    <div className="relative">
      {/* Vertical timeline line */}
      <div className="absolute left-5 top-5 bottom-5 w-px bg-gray-200 dark:bg-gray-700" />

      <ul className="space-y-4">
        {contracts.map((contract) => {
          const config = STATUS_CONFIG[contract.status] ?? STATUS_CONFIG.draft;
          const signerNames = contract.signers
            ?.map((s) => s.name)
            .filter(Boolean)
            .join(", ");

          return (
            <li key={contract.id} className="relative flex gap-3 pl-0">
              {/* Icon circle */}
              <div
                className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 shrink-0
                  bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 ${config.color}`}
              >
                {config.icon}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1 pt-0.5">
                <Link
                  href={`/contracts/${contract.id}`}
                  className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-[#198296] dark:hover:text-[#198296] transition-colors truncate block"
                >
                  {contract.title}
                </Link>
                <p className={`text-xs mt-0.5 ${config.color}`}>
                  {t(config.labelKey)}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {relativeTime(contract.updatedAt)}
                  </span>
                  {signerNames && (
                    <>
                      <span className="text-gray-300 dark:text-gray-600">
                        &middot;
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500 truncate">
                        {signerNames}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {/* View all link */}
      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 text-center">
        <Link
          href="/dashboard"
          className="text-sm font-medium text-[#198296] hover:underline"
        >
          {t("activityFeed.viewAll")}
        </Link>
      </div>
    </div>
  );
}
