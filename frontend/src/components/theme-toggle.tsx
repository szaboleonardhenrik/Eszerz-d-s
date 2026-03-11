"use client";

import { useTheme } from "./theme-provider";

export default function ThemeToggle() {
  const { resolved, setTheme } = useTheme();

  return (
    <div className="flex items-center bg-white/10 rounded-lg p-0.5">
      <button
        onClick={() => setTheme("light")}
        className={`p-1.5 rounded-md transition ${
          resolved === "light"
            ? "bg-white/20 text-yellow-300"
            : "text-white/50 hover:text-white/80"
        }`}
        title="Világos mód"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      </button>
      <button
        onClick={() => setTheme("dark")}
        className={`p-1.5 rounded-md transition ${
          resolved === "dark"
            ? "bg-white/20 text-yellow-300"
            : "text-white/50 hover:text-white/80"
        }`}
        title="Sötét mód"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      </button>
    </div>
  );
}
