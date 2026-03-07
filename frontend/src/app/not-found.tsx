import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        {/* SVG Illustration */}
        <div className="flex justify-center mb-8">
          <svg
            width="200"
            height="160"
            viewBox="0 0 200 160"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-blue-600 dark:text-blue-400"
          >
            {/* Document with magnifying glass */}
            <rect x="50" y="20" width="80" height="110" rx="6" className="fill-gray-200 dark:fill-gray-700" stroke="currentColor" strokeWidth="2" />
            <line x1="70" y1="50" x2="110" y2="50" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="70" y1="65" x2="110" y2="65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="70" y1="80" x2="95" y2="80" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            {/* Magnifying glass */}
            <circle cx="135" cy="105" r="22" className="fill-gray-50 dark:fill-gray-900" stroke="currentColor" strokeWidth="3" />
            <text x="123" y="113" className="fill-current" fontSize="16" fontWeight="bold">?</text>
            <line x1="151" y1="121" x2="170" y2="140" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          </svg>
        </div>

        {/* 404 Number */}
        <h1 className="text-8xl font-extrabold text-gray-200 dark:text-gray-700 select-none">
          404
        </h1>

        {/* Message */}
        <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
          Az oldal nem talalhato
        </h2>
        <p className="mt-3 text-gray-600 dark:text-gray-400 text-base leading-relaxed">
          A keresett oldal nem letezik, vagy at lett helyezve.
          Ellenorizd a cimet, vagy terj vissza a fooldalra.
        </p>

        {/* Button */}
        <div className="mt-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
            Vissza a fooldalra
          </Link>
        </div>
      </div>
    </div>
  );
}
