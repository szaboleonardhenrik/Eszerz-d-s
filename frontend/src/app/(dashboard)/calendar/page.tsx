"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import api from "@/lib/api";
import toast from "react-hot-toast";

/* ── Types ─────────────────────────────────────────────────────────── */

interface Contract {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
}

interface CalendarEvent {
  contractId: string;
  contractTitle: string;
  date: string; // YYYY-MM-DD
  type: "created" | "expires" | "completed";
}

/* ── Constants ─────────────────────────────────────────────────────── */

const MONTH_NAMES = [
  "Januar", "Februar", "Marcius", "Aprilis", "Majus", "Junius",
  "Julius", "Augusztus", "Szeptember", "Oktober", "November", "December",
];

const DAY_LABELS = ["H", "K", "Sz", "Cs", "P", "Sz", "V"];

const EVENT_CONFIG: Record<CalendarEvent["type"], { label: string; dotColor: string; badgeClass: string }> = {
  created: {
    label: "Letrehozva",
    dotColor: "bg-blue-500",
    badgeClass: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  },
  expires: {
    label: "Lejar",
    dotColor: "bg-red-500",
    badgeClass: "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300",
  },
  completed: {
    label: "Befejezve",
    dotColor: "bg-green-500",
    badgeClass: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  },
};

/* ── Helpers ────────────────────────────────────────────────────────── */

function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isSameDay(a: string, b: string): boolean {
  return a === b;
}

function getMonthGrid(year: number, month: number) {
  // month is 0-indexed
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();

  // Monday = 0, Sunday = 6
  let startDow = firstDay.getDay() - 1;
  if (startDow < 0) startDow = 6;

  const cells: { date: Date; inMonth: boolean }[] = [];

  // Previous month fill
  for (let i = startDow - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    cells.push({ date: d, inMonth: false });
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, month, d), inMonth: true });
  }

  // Next month fill to complete last row
  const remaining = 7 - (cells.length % 7);
  if (remaining < 7) {
    for (let i = 1; i <= remaining; i++) {
      cells.push({ date: new Date(year, month + 1, i), inMonth: false });
    }
  }

  return cells;
}

/* ── Component ─────────────────────────────────────────────────────── */

export default function CalendarPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const todayKey = useMemo(() => toDateKey(new Date()), []);

  /* ── Data fetch ── */
  const loadContracts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/contracts", { params: { limit: 100 } });
      const pagination = res.data.data;
      setContracts(pagination.items ?? []);
    } catch {
      toast.error("Hiba a szerződések betöltésekor");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContracts();
  }, [loadContracts]);

  /* ── Build events ── */
  const events = useMemo<CalendarEvent[]>(() => {
    const result: CalendarEvent[] = [];
    for (const c of contracts) {
      if (c.createdAt) {
        result.push({
          contractId: c.id,
          contractTitle: c.title,
          date: toDateKey(new Date(c.createdAt)),
          type: "created",
        });
      }
      if (c.expiresAt) {
        result.push({
          contractId: c.id,
          contractTitle: c.title,
          date: toDateKey(new Date(c.expiresAt)),
          type: "expires",
        });
      }
      if (c.status === "completed" && c.updatedAt) {
        result.push({
          contractId: c.id,
          contractTitle: c.title,
          date: toDateKey(new Date(c.updatedAt)),
          type: "completed",
        });
      }
    }
    return result;
  }, [contracts]);

  /* ── Events grouped by date key ── */
  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const ev of events) {
      if (!map[ev.date]) map[ev.date] = [];
      map[ev.date].push(ev);
    }
    return map;
  }, [events]);

  /* ── Grid ── */
  const grid = useMemo(() => getMonthGrid(currentYear, currentMonth), [currentYear, currentMonth]);

  /* ── Events for selected date ── */
  const selectedEvents = useMemo(() => {
    if (!selectedDate) return [];
    return eventsByDate[selectedDate] ?? [];
  }, [selectedDate, eventsByDate]);

  /* ── Month navigation ── */
  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
    setSelectedDate(null);
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
    setSelectedDate(null);
  };

  const goToToday = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
    setSelectedDate(todayKey);
  };

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse w-64" />
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
          <div className="h-8 bg-gray-100 dark:bg-gray-700 rounded-lg w-48 mb-6" />
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 dark:bg-gray-700 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Naptar</h1>
        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          {(Object.keys(EVENT_CONFIG) as CalendarEvent["type"][]).map((type) => (
            <span key={type} className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${EVENT_CONFIG[type].dotColor}`} />
              {EVENT_CONFIG[type].label}
            </span>
          ))}
        </div>
      </div>

      {/* ── Calendar card ── */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        {/* Month header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <button
              onClick={goToPrevMonth}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-600 dark:text-gray-400"
              aria-label="Előző hónap"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 min-w-[180px] text-center">
              {MONTH_NAMES[currentMonth]} {currentYear}
            </h2>
            <button
              onClick={goToNextMonth}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-600 dark:text-gray-400"
              aria-label="Következő hónap"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            Ma
          </button>
        </div>

        {/* ── Desktop grid view ── */}
        <div className="hidden sm:block p-4">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {DAY_LABELS.map((label, i) => (
              <div
                key={i}
                className="text-center text-xs font-semibold text-gray-500 dark:text-gray-400 py-2"
              >
                {label}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-1">
            {grid.map((cell, i) => {
              const key = toDateKey(cell.date);
              const dayEvents = eventsByDate[key] ?? [];
              const isToday = isSameDay(key, todayKey);
              const isSelected = selectedDate === key;
              const hasCreated = dayEvents.some((e) => e.type === "created");
              const hasExpires = dayEvents.some((e) => e.type === "expires");
              const hasCompleted = dayEvents.some((e) => e.type === "completed");

              return (
                <button
                  key={i}
                  onClick={() => setSelectedDate(isSelected ? null : key)}
                  className={`
                    relative min-h-[4rem] p-2 rounded-lg text-left transition
                    ${cell.inMonth
                      ? "text-gray-900 dark:text-gray-100"
                      : "text-gray-300 dark:text-gray-600"
                    }
                    ${isSelected
                      ? "bg-blue-50 dark:bg-blue-900/30 ring-2 ring-blue-500"
                      : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    }
                    ${isToday && !isSelected
                      ? "ring-2 ring-blue-400 dark:ring-blue-500"
                      : ""
                    }
                  `}
                >
                  <span
                    className={`text-sm font-medium ${
                      isToday ? "text-blue-600 dark:text-blue-400 font-bold" : ""
                    }`}
                  >
                    {cell.date.getDate()}
                  </span>
                  {/* Dots */}
                  {dayEvents.length > 0 && (
                    <div className="flex items-center gap-1 mt-1 flex-wrap">
                      {hasCreated && <span className="w-2 h-2 rounded-full bg-blue-500" />}
                      {hasExpires && <span className="w-2 h-2 rounded-full bg-red-500" />}
                      {hasCompleted && <span className="w-2 h-2 rounded-full bg-green-500" />}
                      {dayEvents.length > 3 && (
                        <span className="text-[10px] text-gray-400 ml-0.5">+{dayEvents.length - 3}</span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Mobile list view ── */}
        <div className="sm:hidden p-4">
          {(() => {
            // Collect days in current month that have events
            const daysWithEvents: { key: string; date: Date; events: CalendarEvent[] }[] = [];
            for (const cell of grid) {
              if (!cell.inMonth) continue;
              const key = toDateKey(cell.date);
              const dayEvts = eventsByDate[key];
              if (dayEvts && dayEvts.length > 0) {
                daysWithEvents.push({ key, date: cell.date, events: dayEvts });
              }
            }

            if (daysWithEvents.length === 0) {
              return (
                <div className="py-12 text-center">
                  <svg className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    Nincs esemeny ebben a honapban
                  </p>
                </div>
              );
            }

            return (
              <div className="space-y-3">
                {daysWithEvents.map((day) => {
                  const isToday = isSameDay(day.key, todayKey);
                  return (
                    <div key={day.key}>
                      <div className={`flex items-center gap-2 mb-2 ${isToday ? "text-blue-600 dark:text-blue-400" : "text-gray-700 dark:text-gray-300"}`}>
                        <span className={`text-sm font-semibold ${isToday ? "bg-blue-600 text-white w-7 h-7 rounded-full flex items-center justify-center" : ""}`}>
                          {day.date.getDate()}
                        </span>
                        {!isToday && (
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            {MONTH_NAMES[day.date.getMonth()]} {day.date.getDate()}.
                          </span>
                        )}
                        {isToday && (
                          <span className="text-xs font-medium">Ma</span>
                        )}
                      </div>
                      <div className="space-y-1.5 ml-2">
                        {day.events.map((ev, idx) => {
                          const cfg = EVENT_CONFIG[ev.type];
                          return (
                            <Link
                              key={`${ev.contractId}-${ev.type}-${idx}`}
                              href={`/contracts/${ev.contractId}`}
                              className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition group"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dotColor}`} />
                                <span className="text-sm text-gray-900 dark:text-gray-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                                  {ev.contractTitle}
                                </span>
                              </div>
                              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ml-2 ${cfg.badgeClass}`}>
                                {cfg.label}
                              </span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>

        {/* ── No events in month (desktop) ── */}
        {events.filter((e) => {
          const d = new Date(e.date);
          return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
        }).length === 0 && (
          <div className="hidden sm:block px-5 pb-6 text-center">
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Nincs esemeny ebben a honapban
            </p>
          </div>
        )}
      </div>

      {/* ── Selected day detail panel ── */}
      {selectedDate && (
        <div className="hidden sm:block bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
              {(() => {
                const d = new Date(selectedDate + "T00:00:00");
                return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
              })()}
            </h3>
            <button
              onClick={() => setSelectedDate(null)}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-400"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {selectedEvents.length > 0 ? (
            <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
              {selectedEvents.map((ev, idx) => {
                const cfg = EVENT_CONFIG[ev.type];
                return (
                  <Link
                    key={`${ev.contractId}-${ev.type}-${idx}`}
                    href={`/contracts/${ev.contractId}`}
                    className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${cfg.dotColor}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                          {ev.contractTitle}
                        </p>
                      </div>
                    </div>
                    <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full flex-shrink-0 ml-3 ${cfg.badgeClass}`}>
                      {cfg.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="px-5 py-8 text-center">
              <p className="text-sm text-gray-400 dark:text-gray-500">Nincs esemeny ezen a napon</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
