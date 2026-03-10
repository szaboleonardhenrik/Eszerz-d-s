'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

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
          >
            {/* Warning triangle */}
            <path
              d="M100 20L175 140H25L100 20Z"
              className="fill-red-50 dark:fill-red-900/30"
              stroke="#EF4444"
              strokeWidth="3"
              strokeLinejoin="round"
            />
            {/* Exclamation mark */}
            <line x1="100" y1="60" x2="100" y2="100" stroke="#EF4444" strokeWidth="5" strokeLinecap="round" />
            <circle cx="100" cy="118" r="4" fill="#EF4444" />
            {/* Gear icons */}
            <circle cx="40" cy="40" r="14" className="fill-gray-200 dark:fill-gray-700" stroke="#9CA3AF" strokeWidth="2" />
            <circle cx="40" cy="40" r="5" className="fill-gray-50 dark:fill-gray-900" />
            <rect x="38" y="24" width="4" height="6" rx="1" fill="#9CA3AF" />
            <rect x="38" y="50" width="4" height="6" rx="1" fill="#9CA3AF" />
            <rect x="24" y="38" width="6" height="4" rx="1" fill="#9CA3AF" />
            <rect x="50" y="38" width="6" height="4" rx="1" fill="#9CA3AF" />
            <circle cx="165" cy="50" r="10" className="fill-gray-200 dark:fill-gray-700" stroke="#9CA3AF" strokeWidth="2" />
            <circle cx="165" cy="50" r="3.5" className="fill-gray-50 dark:fill-gray-900" />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Hiba történt
        </h1>

        {/* Message */}
        <p className="mt-3 text-gray-600 dark:text-gray-400 text-base leading-relaxed">
          Váratlan hiba lépett fel az oldal betöltése során.
          Próbáld újra, vagy térj vissza a főoldalra.
        </p>

        {/* Error digest for debugging */}
        {error.digest && (
          <p className="mt-3 text-xs text-gray-400 dark:text-gray-500 font-mono">
            Hibakod: {error.digest}
          </p>
        )}

        {/* Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
            Újrapróba
          </button>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors duration-200 border border-gray-300 dark:border-gray-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
            Vissza a főoldalra
          </Link>
        </div>
      </div>
    </div>
  );
}
