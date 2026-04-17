import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Karbantartás alatt",
  description: "A Legitas jelenleg karbantartás alatt áll.",
  robots: { index: false, follow: false },
};

export default function MaintenancePage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12 bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-950">
      <div className="max-w-lg w-full text-center">
        <div className="mx-auto mb-8 w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
          <svg
            className="w-10 h-10 text-blue-600 dark:text-blue-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.8}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-50 mb-4">
          Karbantartás alatt
        </h1>

        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-8">
          A Legitas jelenleg nem elérhető. Dolgozunk rajta, hogy hamarosan újra használhasd a
          szolgáltatást. Köszönjük a türelmet!
        </p>

        <div className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          A rendszer átmenetileg offline
        </div>

        <p className="mt-12 text-xs text-gray-400 dark:text-gray-500">
          Kapcsolat:{" "}
          <a
            href="mailto:info@legitas.hu"
            className="underline hover:text-gray-600 dark:hover:text-gray-300"
          >
            info@legitas.hu
          </a>
        </p>
      </div>
    </main>
  );
}
