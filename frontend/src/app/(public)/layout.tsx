"use client";

import { useState } from "react";
import Link from "next/link";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-b border-gray-100/80 dark:border-gray-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-10">
              <Link href="/landing" className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-700 dark:bg-blue-600 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">SZ</span>
                </div>
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  <span className="text-blue-700 dark:text-cyan-400">Szerződés</span>Portál
                </span>
              </Link>
              <div className="hidden md:flex gap-8">
                <Link href="/landing#funkciok" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-700 dark:hover:text-cyan-400 transition font-medium">
                  Funkciók
                </Link>
                <Link href="/landing#hogyan-mukodik" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-700 dark:hover:text-cyan-400 transition font-medium">
                  Hogyan működik
                </Link>
                <Link href="/pricing" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-700 dark:hover:text-cyan-400 transition font-medium">
                  Árak
                </Link>
                <Link href="/landing#velemenyek" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-700 dark:hover:text-cyan-400 transition font-medium">
                  Vélemények
                </Link>
                <Link href="/blog" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-700 dark:hover:text-cyan-400 transition font-medium">
                  Blog
                </Link>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-blue-700 dark:hover:text-cyan-400 px-4 py-2 transition"
              >
                Bejelentkezés
              </Link>
              <Link
                href="/register"
                className="text-sm font-semibold bg-blue-700 dark:bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-800 dark:hover:bg-blue-700 transition shadow-sm"
              >
                Ingyenes kezdés
              </Link>
            </div>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d={mobileOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>
        </div>
        {mobileOpen && (
          <div className="md:hidden bg-white dark:bg-gray-900 border-t dark:border-gray-800">
            <div className="px-4 py-4 space-y-3">
              {[
                { href: "/landing#funkciok", label: "Funkciók" },
                { href: "/landing#hogyan-mukodik", label: "Hogyan működik" },
                { href: "/pricing", label: "Árak" },
                { href: "/landing#velemenyek", label: "Vélemények" },
                { href: "/blog", label: "Blog" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="block text-gray-700 dark:text-gray-300 font-medium py-2"
                >
                  {item.label}
                </Link>
              ))}
              <div className="pt-3 border-t dark:border-gray-800 flex flex-col gap-2">
                <Link href="/login" className="text-center py-2.5 text-gray-700 dark:text-gray-300 font-semibold">
                  Bejelentkezés
                </Link>
                <Link
                  href="/register"
                  className="text-center py-2.5 bg-blue-700 dark:bg-blue-600 text-white rounded-lg font-semibold"
                >
                  Ingyenes kezdés
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>
      <main className="pt-16">{children}</main>
    </div>
  );
}
