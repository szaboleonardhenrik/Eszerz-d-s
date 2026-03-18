"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { useSocket } from "@/lib/socket";
import toast from "react-hot-toast";
import { useI18n } from "@/lib/i18n";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export default function NotificationBell() {
  const { t } = useI18n();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const wsConnected = useRef(false);

  // WebSocket connection for real-time updates
  useSocket({
    onNotification: (notification) => {
      wsConnected.current = true;
      setNotifications((prev) => [
        { ...notification, read: false, createdAt: new Date().toISOString() },
        ...prev,
      ].slice(0, 50));
      setUnreadCount((c) => c + 1);
      toast(notification.title, {
        icon: "🔔",
        duration: 4000,
        style: { fontSize: "14px" },
      });
    },
    onUnreadCount: (data) => {
      wsConnected.current = true;
      setUnreadCount(data.count);
    },
  });

  const loadUnreadCount = async () => {
    try {
      const res = await api.get("/notifications/unread-count");
      setUnreadCount(res.data.data?.count ?? 0);
    } catch {}
  };

  const loadNotifications = async () => {
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data.data ?? []);
    } catch {}
  };

  // Polling fallback (longer interval when WS is connected)
  useEffect(() => {
    loadUnreadCount();
    const interval = setInterval(
      loadUnreadCount,
      wsConnected.current ? 120000 : 30000
    );
    return () => clearInterval(interval);
     
  }, []);

  useEffect(() => {
    if (open) loadNotifications();
     
  }, [open]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markAllRead = async () => {
    try {
      await api.put("/notifications/read-all");
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {}
  };

  const markRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setUnreadCount((c) => Math.max(0, c - 1));
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch {}
  };

  const typeIcons: Record<string, string> = {
    contract_signed: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
    contract_completed: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
    contract_declined: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z",
    contract_expired: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
    reminder: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
    system: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  };

  const typeColors: Record<string, string> = {
    contract_signed: "text-blue-500",
    contract_completed: "text-green-500",
    contract_declined: "text-red-500",
    contract_expired: "text-orange-500",
    reminder: "text-yellow-500",
    system: "text-gray-500",
  };

  /* eslint-disable react-hooks/purity */
  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return t("notificationBell.timeNow");
    if (mins < 60) return t("notificationBell.timeMinutes", { count: String(mins) });
    const hours = Math.floor(mins / 60);
    if (hours < 24) return t("notificationBell.timeHours", { count: String(hours) });
    const days = Math.floor(hours / 24);
    return t("notificationBell.timeDays", { count: String(days) });
  };
  /* eslint-enable react-hooks/purity */

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-white/10 transition"
      >
        <svg className="w-5 h-5 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-xl shadow-xl border dark:border-gray-700 z-50 max-h-[28rem] flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b dark:border-gray-700">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{t("notificationBell.title")}</h3>
                {wsConnected.current && (
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full" title={t("notificationBell.realtime")} />
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-blue-600 hover:underline"
                >
                  {t("notificationBell.markAllRead")}
                </button>
              )}
            </div>
            <div className="overflow-y-auto flex-1" style={{ maxHeight: "20rem" }}>
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">
                  {t("notificationBell.empty")}
                </div>
              ) : (
                notifications.map((n) => {
                  const content = (
                    <div
                      className={`px-4 py-3 flex gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition cursor-pointer ${
                        !n.read ? "bg-blue-50/50 dark:bg-blue-900/10" : ""
                      }`}
                      onClick={() => { if (!n.read) markRead(n.id); setOpen(false); }}
                    >
                      <svg
                        className={`w-5 h-5 mt-0.5 shrink-0 ${typeColors[n.type] ?? "text-gray-400"}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d={typeIcons[n.type] ?? typeIcons.system} />
                      </svg>
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm ${!n.read ? "font-semibold text-gray-900 dark:text-gray-100" : "text-gray-700 dark:text-gray-300"}`}>
                          {n.title}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{n.message}</p>
                        <p className="text-xs text-gray-300 dark:text-gray-500 mt-1">{timeAgo(n.createdAt)}</p>
                      </div>
                      {!n.read && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 shrink-0" />
                      )}
                    </div>
                  );
                  return n.link ? (
                    <Link key={n.id} href={n.link}>{content}</Link>
                  ) : (
                    <div key={n.id}>{content}</div>
                  );
                })
              )}
            </div>
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="block text-center py-2.5 text-xs font-medium text-[#198296] hover:bg-gray-50 dark:hover:bg-gray-700 border-t dark:border-gray-700 transition"
            >
              {t("notificationBell.viewAll")}
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
