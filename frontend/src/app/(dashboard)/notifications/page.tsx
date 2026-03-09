"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import api from "@/lib/api";
import toast from "react-hot-toast";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

const tabs = [
  { key: "", label: "Összes" },
  { key: "unread", label: "Olvasatlan" },
  { key: "contract_signed", label: "Aláírás" },
  { key: "contract_expired", label: "Lejárat" },
  { key: "system", label: "Rendszer" },
];

const typeIcons: Record<string, string> = {
  contract_signed: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  contract_completed: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  contract_declined: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z",
  contract_expired: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  reminder: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
  system: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
};

const typeColors: Record<string, string> = {
  contract_signed: "text-blue-500 bg-blue-50 dark:bg-blue-900/20",
  contract_completed: "text-green-500 bg-green-50 dark:bg-green-900/20",
  contract_declined: "text-red-500 bg-red-50 dark:bg-red-900/20",
  contract_expired: "text-orange-500 bg-orange-50 dark:bg-orange-900/20",
  reminder: "text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20",
  system: "text-gray-500 bg-gray-50 dark:bg-gray-700",
};

const timeAgo = (date: string) => {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "most";
  if (mins < 60) return `${mins} perce`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} órája`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} napja`;
  return new Date(date).toLocaleDateString("hu-HU");
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("");

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "20");
      if (activeTab === "unread") {
        params.set("unreadOnly", "true");
      } else if (activeTab) {
        params.set("type", activeTab);
      }

      const res = await api.get(`/notifications/all?${params}`);
      const data = res.data.data;
      setNotifications(data.items);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      toast.error("Hiba az értesítések betöltésekor");
    } finally {
      setLoading(false);
    }
  }, [page, activeTab]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const markAsRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await api.put("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success("Összes olvasottnak jelölve");
    } catch {
      toast.error("Hiba történt");
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setTotal((t) => t - 1);
    } catch {}
  };

  const clearRead = async () => {
    try {
      await api.delete("/notifications/clear-read");
      setNotifications((prev) => prev.filter((n) => !n.read));
      toast.success("Olvasott értesítések törölve");
      loadNotifications();
    } catch {
      toast.error("Hiba történt");
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Értesítések
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {total} értesítés{unreadCount > 0 ? ` (${unreadCount} olvasatlan)` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={markAllRead}
            className="px-4 py-2 text-sm font-medium bg-white dark:bg-gray-800 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            Összes olvasott
          </button>
          <button
            onClick={clearRead}
            className="px-4 py-2 text-sm font-medium text-red-600 bg-white dark:bg-gray-800 border rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition"
          >
            Olvasottak törlése
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key);
              setPage(1);
            }}
            className={`px-4 py-2 text-sm font-medium rounded-md transition ${
              activeTab === tab.key
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#198296] mx-auto" />
            <p className="mt-3 text-sm text-gray-400">Betöltés...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-16 text-center">
            <svg
              className="w-16 h-16 mx-auto text-gray-200 dark:text-gray-700 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              Nincs értesítés
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Az új értesítések itt fognak megjelenni.
            </p>
          </div>
        ) : (
          <div className="divide-y dark:divide-gray-700">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`flex items-start gap-4 px-5 py-4 transition hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                  !n.read ? "bg-blue-50/40 dark:bg-blue-900/10" : ""
                }`}
              >
                {/* Icon */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    typeColors[n.type] ?? "text-gray-400 bg-gray-100 dark:bg-gray-700"
                  }`}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d={typeIcons[n.type] ?? typeIcons.system}
                    />
                  </svg>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      {n.link ? (
                        <Link
                          href={n.link}
                          className={`text-sm hover:underline ${
                            !n.read
                              ? "font-semibold text-gray-900 dark:text-gray-100"
                              : "text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {n.title}
                        </Link>
                      ) : (
                        <p
                          className={`text-sm ${
                            !n.read
                              ? "font-semibold text-gray-900 dark:text-gray-100"
                              : "text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {n.title}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">
                        {n.message}
                      </p>
                      <p className="text-xs text-gray-300 dark:text-gray-500 mt-1">
                        {timeAgo(n.createdAt)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {!n.read && (
                        <button
                          onClick={() => markAsRead(n.id)}
                          title="Olvasottnak jelölés"
                          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition"
                        >
                          <svg
                            className="w-4 h-4 text-blue-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(n.id)}
                        title="Törlés"
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                      >
                        <svg
                          className="w-4 h-4 text-gray-400 hover:text-red-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Unread dot */}
                {!n.read && (
                  <span className="w-2.5 h-2.5 bg-blue-500 rounded-full mt-2 shrink-0" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {page}. oldal / {totalPages}
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              Előző
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              Következő
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
