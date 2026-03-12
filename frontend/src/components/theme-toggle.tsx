"use client";

import { useTheme } from "./theme-provider";

export default function ThemeToggle({ variant = "dark" }: { variant?: "dark" | "light" }) {
  const { resolved, setTheme } = useTheme();

  const isDark = variant === "dark";

  return (
    <div className={`flex items-center rounded-lg p-0.5 ${isDark ? "bg-white/10" : "bg-[#F0F5F7]"}`}>
      <button
        onClick={() => setTheme("light")}
        className={`p-1.5 rounded-md transition ${
          resolved === "light"
            ? isDark ? "bg-white/20 text-yellow-300" : "bg-white text-amber-500 shadow-sm"
            : isDark ? "text-white/50 hover:text-white/80" : "text-[#6B8290] hover:text-[#3D5260]"
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
            ? isDark ? "bg-white/20 text-yellow-300" : "bg-white text-indigo-500 shadow-sm"
            : isDark ? "text-white/50 hover:text-white/80" : "text-[#6B8290] hover:text-[#3D5260]"
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
