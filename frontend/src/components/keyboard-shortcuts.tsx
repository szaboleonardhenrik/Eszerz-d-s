"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

const shortcuts = [
  { key: "n", ctrl: true, label: "Új szerződés", action: "/create" },
  { key: "k", ctrl: true, label: "Keresés fókusz", action: "focus-search" },
  { key: "h", ctrl: true, label: "Kezdőlap", action: "/dashboard" },
  { key: "t", ctrl: true, label: "Sablonok", action: "/templates" },
  { key: ",", ctrl: true, label: "Beállítások", action: "/settings" },
];

export function useKeyboardShortcuts() {
  const router = useRouter();
  const [showHelp, setShowHelp] = useState(false);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't trigger in inputs
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      ) {
        // Except for Escape
        if (e.key === "Escape") {
          (target as HTMLInputElement).blur();
        }
        return;
      }

      // ? for help
      if (e.key === "?" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setShowHelp((v) => !v);
        return;
      }

      // Escape closes help
      if (e.key === "Escape") {
        setShowHelp(false);
        return;
      }

      const isCtrlOrMeta = e.ctrlKey || e.metaKey;

      for (const shortcut of shortcuts) {
        if (shortcut.ctrl && isCtrlOrMeta && e.key.toLowerCase() === shortcut.key) {
          e.preventDefault();
          if (shortcut.action === "focus-search") {
            const searchInput = document.querySelector<HTMLInputElement>(
              'input[placeholder*="Keresés"]'
            );
            if (searchInput) {
              searchInput.focus();
              searchInput.select();
            }
          } else {
            router.push(shortcut.action);
          }
          return;
        }
      }
    },
    [router]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return { showHelp, setShowHelp };
}

export default function KeyboardShortcutsHelp({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Billentyűparancsok
            </h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <svg
                className="w-5 h-5 text-gray-500"
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
          <div className="space-y-2">
            {shortcuts.map((s) => (
              <div
                key={s.key}
                className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {s.label}
                </span>
                <kbd className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono text-gray-600 dark:text-gray-400 border dark:border-gray-600">
                  {s.ctrl && <span>Ctrl</span>}
                  {s.ctrl && <span>+</span>}
                  <span className="uppercase">{s.key}</span>
                </kbd>
              </div>
            ))}
            <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Súgó megnyitása/bezárása
              </span>
              <kbd className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono text-gray-600 dark:text-gray-400 border dark:border-gray-600">
                ?
              </kbd>
            </div>
            <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Bezárás / Fókusz elvétele
              </span>
              <kbd className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono text-gray-600 dark:text-gray-400 border dark:border-gray-600">
                Esc
              </kbd>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-4 text-center">
            Nyomj <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-[10px] font-mono">?</kbd> billentyűt bárhol az alkalmazásban
          </p>
        </div>
      </div>
    </>
  );
}
