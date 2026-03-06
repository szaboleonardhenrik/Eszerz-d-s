"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-100/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-10">
              <Link href="/landing" className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-brand-teal-dark flex items-center justify-center">
                  <span className="text-white font-bold text-sm">SZ</span>
                </div>
                <span className="text-lg font-bold text-gray-900">
                  <span className="text-brand-teal-dark">Szerződés</span>Portál
                </span>
              </Link>
              <div className="hidden md:flex gap-8">
                <Link href="/landing#funkciok" className="text-sm text-gray-600 hover:text-brand-teal-dark transition font-medium">
                  Funkciók
                </Link>
                <Link href="/landing#hogyan-mukodik" className="text-sm text-gray-600 hover:text-brand-teal-dark transition font-medium">
                  Hogyan működik
                </Link>
                <Link href="/landing#arak" className="text-sm text-gray-600 hover:text-brand-teal-dark transition font-medium">
                  Árak
                </Link>
                <Link href="/landing#velemenyek" className="text-sm text-gray-600 hover:text-brand-teal-dark transition font-medium">
                  Vélemények
                </Link>
                <Link href="/landing#gyik" className="text-sm text-gray-600 hover:text-brand-teal-dark transition font-medium">
                  GYIK
                </Link>
                <Link href="/blog" className="text-sm text-gray-600 hover:text-brand-teal-dark transition font-medium">
                  Blog
                </Link>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm font-semibold text-gray-700 hover:text-brand-teal-dark px-4 py-2 transition"
              >
                Bejelentkezés
              </Link>
              <Link
                href="/register"
                className="text-sm font-semibold bg-brand-gold text-white px-5 py-2.5 rounded-lg hover:bg-brand-gold-dark transition shadow-sm"
              >
                Ingyenes kezdés
              </Link>
            </div>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d={mobileOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>
        </div>
        {mobileOpen && (
          <div className="md:hidden bg-white border-t">
            <div className="px-4 py-4 space-y-3">
              {[
                { href: "/landing#funkciok", label: "Funkciók" },
                { href: "/landing#hogyan-mukodik", label: "Hogyan működik" },
                { href: "/landing#arak", label: "Árak" },
                { href: "/landing#velemenyek", label: "Vélemények" },
                { href: "/landing#gyik", label: "GYIK" },
                { href: "/blog", label: "Blog" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="block text-gray-700 font-medium py-2"
                >
                  {item.label}
                </Link>
              ))}
              <div className="pt-3 border-t flex flex-col gap-2">
                <Link href="/login" className="text-center py-2.5 text-gray-700 font-semibold">
                  Bejelentkezés
                </Link>
                <Link
                  href="/register"
                  className="text-center py-2.5 bg-brand-gold text-white rounded-lg font-semibold"
                >
                  Ingyenes kezdés
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>
      <main className="pt-16">{children}</main>
      <footer className="bg-gray-950 text-gray-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-5">
                <div className="w-7 h-7 rounded-md bg-brand-teal flex items-center justify-center">
                  <span className="text-white font-bold text-xs">SZ</span>
                </div>
                <span className="text-white font-bold">SzerződésPortál</span>
              </div>
              <p className="text-sm leading-relaxed">A magyar KKV-k szerződéskezelő platformja. Ptk.-conform sablonok, e-aláírás, egy helyen.</p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Termék</h3>
              <ul className="space-y-2.5 text-sm">
                <li><Link href="/landing#funkciok" className="hover:text-white transition">Funkciók</Link></li>
                <li><Link href="/landing#arak" className="hover:text-white transition">Árazás</Link></li>
                <li><Link href="/landing#sablonok" className="hover:text-white transition">Sablonok</Link></li>
                <li><Link href="/blog" className="hover:text-white transition">Blog</Link></li>
                <li><Link href="/api/docs" target="_blank" className="hover:text-white transition">API dokumentáció</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Jogi</h3>
              <ul className="space-y-2.5 text-sm">
                <li><Link href="/adatvedelem" className="hover:text-white transition">Adatvédelmi tájékoztató</Link></li>
                <li><Link href="/aszf" className="hover:text-white transition">ÁSZF</Link></li>
                <li><Link href="/cookie" className="hover:text-white transition">Cookie szabályzat</Link></li>
                <li><Link href="/adatvedelem" className="hover:text-white transition">GDPR megfelelőség</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Kapcsolat</h3>
              <ul className="space-y-2.5 text-sm">
                <li><a href="mailto:hello@szerzodes.cegverzum.hu" className="hover:text-white transition">hello@szerzodes.cegverzum.hu</a></li>
                <li><span className="cursor-default">Budapest, Magyarország</span></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm">
              &copy; {new Date().getFullYear()} SzerződésPortál. Minden jog fenntartva.
            </p>
            <p className="text-xs text-gray-500">
              A platform nem helyettesíti a jogi tanácsadást. A sablonokat jogász ellenőrizte.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
